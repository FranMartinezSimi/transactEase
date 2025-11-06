import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { DeliveryRepository } from "@features/delivery/services/delivery.repository";
import { DeliveryService } from "@features/delivery/services/delivery.service";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DeliveryWithFiles } from "@features/delivery/types/delivery.interface";
import { getAWSConfig } from "@shared/lib/aws/config";
import { deleteDeliveryFilesFromS3 } from "@shared/lib/aws/delete-delivery-files";
import { logger } from "@shared/lib/logger";

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
    const delivery: DeliveryWithFiles =
      await service.getDeliveryById(deliveryId);

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
    const awsConfig = getAWSConfig();
    const s3 = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });

    const bucket = awsConfig.bucket;

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
      // AWS SDK v3 returns a Readable stream in Node.js
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else if (Buffer.isBuffer(chunk)) {
          chunks.push(new Uint8Array(chunk));
        } else {
          chunks.push(new Uint8Array(Buffer.from(chunk)));
        }
      }
      const fileBuffer = Buffer.concat(chunks);

      // 8. Increment download counter using service
      await service.incrementDeliveryDownloads(deliveryId);

      // Check if download limit reached and update status
      const updatedDelivery = await service.getDeliveryById(deliveryId);
      if (updatedDelivery.current_downloads >= updatedDelivery.max_downloads) {
        logger.info({
          message: "Download quota reached, deleting files",
          deliveryId,
          currentDownloads: updatedDelivery.current_downloads,
          maxDownloads: updatedDelivery.max_downloads,
        });

        // Delete files from S3
        await deleteDeliveryFilesFromS3(deliveryId, supabase);

        // Update status to expired
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

      // If S3 file is missing or corrupted, mark delivery as expired and delete
      logger.error({
        message: "S3 error during download, marking delivery as expired",
        deliveryId,
        error: s3Error,
      });

      await deleteDeliveryFilesFromS3(deliveryId, supabase);
      await service.updateDeliveryStatus(deliveryId, "expired");

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
