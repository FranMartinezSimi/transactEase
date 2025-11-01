import { NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { createContextLogger } from "@shared/lib/logger";
import { sendDeliveryNotification } from "@shared/lib/email/send-delivery-notification";

export async function POST(req: Request) {
  const log = createContextLogger({ operation: "uploadDelivery" });
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData with error handling
    let form: FormData;
    try {
      form = await req.formData();
    } catch (formError: any) {
      console.error("[upload] Failed to parse FormData:", formError);
      return NextResponse.json(
        {
          message: "Failed to parse form data",
          error: formError?.message,
          contentType: req.headers.get("content-type"),
        },
        { status: 400 }
      );
    }

    const file = form.get("files") as File | null;

    const title = String(form.get("title") || "").trim();
    const recipientEmail = String(form.get("recipientEmail") || "").trim();
    const message = String(form.get("message") || "").trim();
    const expiresAtRaw = String(form.get("expiresAt") || "");
    const maxViews = Number(form.get("maxViews") || 10);
    const maxDownloads = Number(form.get("maxDownloads") || 5);

    if (!title || !recipientEmail || !expiresAtRaw || !file) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { message: "User without organization" },
        { status: 400 }
      );
    }

    const repository = new DeliveryRepository(supabase);
    const service = new DeliveryService(repository);

    const delivery = await service.sendDelivery({
      senderId: user.id,
      organizationId: profile.organization_id,
      title,
      message: message || undefined,
      recipientEmail,
      expiresAt: new Date(expiresAtRaw),
      maxViews,
      maxDownloads,
    });

    const deliveryId = (delivery as any).id as string;

    const s3 = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const bucket = process.env.AWS_S3_BUCKET!;

    const fileId = crypto.randomUUID();
    const originalName = file.name || "file";
    const safeName = originalName.replace(/[^\w.\-]/g, "_");
    const key = `${profile.organization_id}/${deliveryId}/${fileId}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    // Hash SHA-256
    const fileHash = crypto.createHash("sha256").update(body).digest("hex");

    const sse = process.env.AWS_S3_SSE === "aws:kms" ? "aws:kms" : "AES256";
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: sse,
      })
    );

    const { error: filesError } = await supabase.from("delivery_files").insert({
      id: fileId,
      delivery_id: deliveryId,
      filename: safeName,
      original_name: originalName,
      mime_type: contentType,
      size: body.length,
      storage_path: key,
      hash: fileHash,
    });
    if (filesError) {
      log.error(
        { error: filesError, deliveryId, fileId, s3Key: key },
        "Failed to create delivery_files record, attempting S3 rollback"
      );
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        log.info(
          { s3Key: key },
          "S3 object deleted successfully during rollback"
        );
      } catch (e) {
        log.error(
          { error: e, s3Key: key },
          "S3 rollback failed - orphaned file may remain"
        );
      }
      return NextResponse.json(
        { message: "Error saving file metadata" },
        { status: 500 }
      );
    }

    const hashId = crypto.randomUUID();
    const { error: hashError } = await supabase.from("document_hashes").insert({
      id: hashId,
      document_id: fileId,
      delivery_id: deliveryId,
      original_filename: originalName,
      hash: fileHash,
      algorithm: "SHA-256",
      file_size: body.length,
      mime_type: contentType,
      updated_at: new Date().toISOString(),
    });
    if (hashError) {
      log.warn(
        { error: hashError },
        "Failed to create document_hashes record (non-critical)"
      );
    }

    // Send email notification to recipient
    try {
      log.debug({ recipientEmail }, "Sending delivery notification email");
      await sendDeliveryNotification({
        recipientEmail,
        senderEmail: user.email || "unknown@sender.com",
        deliveryId,
        deliveryTitle: title,
        deliveryMessage: message || undefined,
        expiresAt: expiresAtRaw,
        maxViews,
        maxDownloads,
        fileCount: 1,
      });
      log.info({ recipientEmail }, "Email notification sent successfully");
    } catch (emailError: any) {
      // Log email error but don't fail the request
      log.error(
        {
          error: emailError,
          recipientEmail,
          deliveryId,
        },
        "Failed to send email notification (non-critical)"
      );
      // Continue - delivery was created successfully
    }

    const duration = Date.now() - startTime;
    log.info(
      {
        deliveryId,
        duration,
        fileSize: body.length,
      },
      "Delivery upload completed successfully"
    );

    return NextResponse.json({ id: deliveryId }, { status: 200 });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log.error(
      {
        error,
        duration,
      },
      "Delivery upload failed"
    );
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
