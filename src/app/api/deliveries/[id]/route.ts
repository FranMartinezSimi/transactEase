import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";
import { getAWSConfig } from "@shared/lib/aws/config";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? undefined;
  const emailProvided = url.searchParams.get("email") ?? undefined;

  const supabase = await createClient();
  // Intentar obtener usuario, pero no es requerido (endpoint público con validación por token/email)
  const { data: userData } = await supabase.auth.getUser();
  const loggedUser = userData?.user ?? null;

  const repository = new DeliveryRepository(supabase);
  const service = new DeliveryService(repository);

  // Validar acceso por token o email (no requiere auth si tiene estos)
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

  // Obtener delivery (con masking si usuario autenticado no es el destinatario)
  const deliveryForViewer = await service.getDeliveryForViewer(
    id,
    loggedUser?.email || null
  );
  if (!deliveryForViewer) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // Increment view counter and check limits
  await service.incrementDeliveryViews(id);

  // Check if view limit reached and update status to expired
  const updatedDelivery = await service.getDeliveryById(id);
  if (updatedDelivery.current_views >= updatedDelivery.max_views) {
    await service.updateDeliveryStatus(id, "expired");
  }

  // Log view action
  const clientIP =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Determine viewer type
  const viewerEmail = emailProvided || loggedUser?.email || "unknown";
  const viewerType =
    viewerEmail === updatedDelivery.recipient_email ? "recipient" : "sender";

  const { error: logError } = await supabase.from("access_logs").insert({
    delivery_id: id,
    action: "view",
    ip_address: clientIP,
    user_agent: req.headers.get("user-agent") || "unknown",
    metadata: {
      email: viewerEmail,
      viewer_type: viewerType,
    },
    success: true,
  });

  if (logError) {
    console.error("[view] Failed to insert access log:", logError);
  }

  return NextResponse.json(deliveryForViewer, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const repository = new DeliveryRepository(supabase);
    const service = new DeliveryService(repository);

    // Get delivery raw data to verify ownership (includes sender_id and organization_id)
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select("id, sender_id, organization_id, title")
      .eq("id", id)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { message: "Delivery not found" },
        { status: 404 }
      );
    }

    // Check if user is the sender or has organization access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const isOwner = delivery.sender_id === user.id;
    const isSameOrg = delivery.organization_id === profile?.organization_id;

    if (!isOwner && !isSameOrg) {
      return NextResponse.json(
        {
          message:
            "Forbidden: You don't have permission to delete this delivery",
        },
        { status: 403 }
      );
    }

    // Get all files associated with the delivery before deletion
    const { data: files } = await supabase
      .from("delivery_files")
      .select("storage_path")
      .eq("delivery_id", id);

    // Delete files from S3
    if (files && files.length > 0) {
      const { S3Client, DeleteObjectCommand } = await import(
        "@aws-sdk/client-s3"
      );
      const awsConfig = getAWSConfig();
      const s3 = new S3Client({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
      });

      const bucket = awsConfig.bucket;

      // Delete each file from S3
      for (const file of files) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: file.storage_path,
            })
          );
        } catch (s3Error) {
          console.error(
            `[DELETE] Failed to delete file from S3: ${file.storage_path}`,
            s3Error
          );
          // Continue deleting other files even if one fails
        }
      }
    }

    // Delete delivery (cascade will handle delivery_files, document_hashes, and access_logs)
    const deletedDelivery = await service.deleteDelivery(id);

    return NextResponse.json(
      {
        message: "Delivery deleted successfully",
        delivery: deletedDelivery,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/deliveries/[id]] error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
