import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const params = await context.params;
    const { id: deliveryId, fileId } = params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email required for verification" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const repository = new DeliveryRepository(supabase);
    const service = new DeliveryService(repository);

    // 1. Get delivery and verify email
    const delivery = await service.getDeliveryById(deliveryId);

    // 2. Verify email matches recipient
    if (delivery.recipient_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email verification failed" },
        { status: 401 }
      );
    }

    // 3. Check if delivery is active
    if (delivery.status !== "active") {
      return NextResponse.json(
        { error: "Delivery is not active" },
        { status: 403 }
      );
    }

    // 4. Check expiration
    if (new Date(delivery.expires_at) < new Date()) {
      // Auto-update status to expired
      await service.updateDeliveryStatus(deliveryId, "expired");

      return NextResponse.json(
        { error: "Delivery has expired" },
        { status: 403 }
      );
    }

    // 5. Check download limits
    if (delivery.current_downloads >= delivery.max_downloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 403 }
      );
    }

    // 6. Get file info
    const { data: file, error: fileError } = await supabase
      .from("delivery_files")
      .select("*")
      .eq("id", fileId)
      .eq("delivery_id", deliveryId)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 7. Download file from AWS S3
    const s3 = new S3Client({
      region: process.env.AWS_S3_REGION || process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucket = process.env.AWS_S3_BUCKET!;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: file.storage_path,
      });

      const response = await s3.send(command);

      if (!response.Body) {
        throw new Error("Empty response body from S3");
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      // 8. Increment download counter using service
      await service.incrementDeliveryDownloads(deliveryId);

      // Check if download limit reached and update status
      const updatedDelivery = await service.getDeliveryById(deliveryId);
      if (updatedDelivery.current_downloads >= updatedDelivery.max_downloads) {
        await service.updateDeliveryStatus(deliveryId, "expired");
      }

      // 9. Log download action
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Determine viewer type
      const viewerType =
        email === delivery.recipient_email ? "recipient" : "sender";

      const { error: logError } = await supabase.from("access_logs").insert({
        delivery_id: deliveryId,
        action: "download",
        ip_address: clientIP,
        user_agent: request.headers.get("user-agent") || "unknown",
        metadata: {
          file_id: fileId,
          filename: file.original_name,
          email: email,
          viewer_type: viewerType,
        },
        success: true,
      });

      if (logError) {
        console.error("[download] Failed to insert access log:", logError);
      }

      // 10. Return file as blob
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": file.mime_type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${file.original_name}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    } catch (s3Error) {
      console.error("[Download] S3 error:", s3Error);
      return NextResponse.json(
        { error: "Failed to download file from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Download] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
