import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeliveryRepository } from "@/api/delivery/delivery.repository";
import { DeliveryService } from "@/api/delivery/delivery.service";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Autenticación: obtener usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("files") as File | null;

    const title = String(form.get("title") || "").trim();
    const recipientEmail = String(form.get("recipientEmail") || "").trim();
    const message = String(form.get("message") || "").trim();
    const expiresAtRaw = String(form.get("expiresAt") || "");
    const maxViews = Number(form.get("maxViews") || 10);
    const maxDownloads = Number(form.get("maxDownloads") || 5);
    const createTempUser =
      String(form.get("createTempUser") || "false") === "true";

    if (!title || !recipientEmail || !expiresAtRaw || !file) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Obtener perfil para conocer la organización
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

    // Subir archivo a S3 y registrar en delivery_files
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

    // Crear registro en delivery_files
    const { error: filesError } = await supabase.from("delivery_files").insert({
      id: fileId,
      delivery_id: deliveryId,
      filename: safeName,
      original_name: originalName,
      mime_type: contentType,
      size: body.length,
      storage_path: key,
    });
    if (filesError) {
      // Intentar rollback del objeto subido
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const { default: assert } = await import("node:assert");
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (e) {
        console.error("[upload] rollback S3 failed:", e);
      }
      console.error("[upload] error creating delivery_files:", filesError);
      return NextResponse.json(
        { message: "Error saving file metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: deliveryId }, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/deliveries/upload] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GetById(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? undefined;
    const emailProvided = url.searchParams.get("email") ?? undefined;
    const fwd = req.headers.get("x-forwarded-for");
    const ipAddress =
      fwd?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-vercel-forwarded-for") ||
      "";
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const loggedUser = userData?.user ?? null;
    if (!loggedUser) {
      console.error("[GetById] No logged user");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const repository = new DeliveryRepository(supabase);
    const service = new DeliveryService(repository);

    const hasAccess = await service.validateAccess(id, token, emailProvided);
    if (!hasAccess) {
      return NextResponse.json(
        {
          message: "Email verification required",
          code: "EMAIL_VERIFICATION_REQUIRED",
        },
        { status: 401 }
      );
    }

    const deliveryForViewer = await service.getDeliveryForViewer(
      id,
      loggedUser?.email || null
    );
    if (!deliveryForViewer) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(deliveryForViewer, { status: 200 });
  } catch (error: any) {
    console.error("[GetById] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const client = await createClient();
    const { data: userData } = await client.auth.getUser();
    const loggedUser = userData?.user ?? null;
    if (!loggedUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const repository = new DeliveryRepository(client);
    const service = new DeliveryService(repository);
    const delivery = await service.getDeliveryById(id);
    if (!delivery) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (loggedUser && loggedUser.email !== (delivery as any).recipient_email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await service.deleteDelivery(id);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("[DELETE] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
