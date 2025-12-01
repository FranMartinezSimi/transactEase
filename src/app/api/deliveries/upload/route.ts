import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { createContextLogger } from "@shared/lib/logger";
import { sendDeliveryNotification } from "@shared/lib/email/send-delivery-notification";
import { getAWSConfig } from "@shared/lib/aws/config";
import { withRateLimit, RateLimitPresets } from "@shared/lib/rate-limit";
import { sanitizeText, sanitizeEmail, sanitizeFilename } from "@shared/lib/sanitize";
import { checkSubscriptionLimits, incrementDeliveryUsage } from "@shared/lib/subscription/guards";

async function uploadHandler(req: NextRequest) {
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
    } catch (formError: unknown) {
      console.error("[upload] Failed to parse FormData:", formError);
      return NextResponse.json(
        {
          message: "Failed to parse form data",
          error:
            formError instanceof Error ? formError.message : String(formError),
          contentType: req.headers.get("content-type"),
        },
        { status: 400 }
      );
    }

    const file = form.get("files") as File | null;

    // Sanitize all inputs
    const title = sanitizeText(String(form.get("title") || "").trim());
    const recipientEmail = sanitizeEmail(String(form.get("recipientEmail") || "").trim());
    const message = sanitizeText(String(form.get("message") || "").trim());
    const expiresAtRaw = String(form.get("expiresAt") || "");
    const maxViews = Number(form.get("maxViews") || 10);
    const maxDownloads = Number(form.get("maxDownloads") || 5);
    const createTempUser = form.get("createTempUser") === "true";

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

    // Check subscription limits using centralized guard
    const subscriptionCheck = await checkSubscriptionLimits(
      supabase,
      profile.organization_id,
      "upload_file",
      { fileSizeBytes: file.size }
    );

    if (!subscriptionCheck.allowed) {
      log.warn(
        {
          organizationId: profile.organization_id,
          reason: subscriptionCheck.reason,
          metadata: subscriptionCheck.metadata
        },
        "Subscription check failed"
      );
      return NextResponse.json(
        {
          message: subscriptionCheck.reason,
          ...subscriptionCheck.metadata,
        },
        { status: subscriptionCheck.statusCode || 402 }
      );
    }

    // Create temporary user if requested
    if (createTempUser) {
      log.debug(
        { recipientEmail },
        "Creating temporary user for external recipient"
      );

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, is_temporary")
        .eq("email", recipientEmail)
        .single();

      if (!existingProfile) {
        // Generate a random password for the temporary user
        const tempPassword = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(expiresAtRaw);

        // Create the temporary profile
        const { error: tempUserError } = await supabase
          .from("profiles")
          .insert({
            id: crypto.randomUUID(),
            organization_id: profile.organization_id,
            email: recipientEmail,
            full_name: recipientEmail.split("@")[0], // Use email prefix as name
            role: "member",
            is_active: true,
            is_temporary: true,
            expires_at: expiresAt.toISOString(),
            temporary_password: tempPassword,
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (tempUserError) {
          log.error(
            { error: tempUserError, recipientEmail },
            "Failed to create temporary user"
          );
          // Don't fail the delivery, just log the error
        } else {
          log.info(
            { recipientEmail, expiresAt },
            "Temporary user created successfully"
          );
        }
      } else if (existingProfile.is_temporary) {
        log.debug(
          { recipientEmail },
          "Temporary user already exists, reusing existing profile"
        );
      } else {
        log.debug(
          { recipientEmail },
          "User already exists as permanent member, not creating temporary profile"
        );
      }
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

    const deliveryId = delivery.id;

    // Validate AWS configuration
    const awsConfig = getAWSConfig();
    const s3 = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
    const bucket = awsConfig.bucket;

    const fileId = crypto.randomUUID();
    const originalName = file.name || "file";
    const safeName = originalName.replace(/[^\w.\-]/g, "_");
    const key = `${profile.organization_id}/${deliveryId}/${fileId}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    // Hash SHA-256
    const fileHash = crypto.createHash("sha256").update(body).digest("hex");

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: awsConfig.sse || "AES256",
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

    // Increment usage counter AFTER successful upload
    const usageResult = await incrementDeliveryUsage(
      supabase,
      profile.organization_id
    );

    if (!usageResult.success) {
      // Log error but don't fail - delivery was created successfully
      log.error(
        {
          error: usageResult.error,
          organizationId: profile.organization_id,
        },
        "Failed to increment delivery usage counter (non-critical)"
      );
    } else {
      log.debug(
        { organizationId: profile.organization_id },
        "Delivery usage counter incremented"
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
    } catch (emailError: unknown) {
      // Log email error but don't fail the request
      log.error(
        {
          error:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
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
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    log.error(
      {
        error,
        duration,
      },
      "Delivery upload failed"
    );
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the upload endpoint (10 uploads per 5 minutes)
export const POST = withRateLimit(uploadHandler, RateLimitPresets.upload);
