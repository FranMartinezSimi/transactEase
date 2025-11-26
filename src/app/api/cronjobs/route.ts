import { logger } from "@shared/lib/logger";
import { createClient } from "@shared/lib/supabase/server";
import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getAWSConfig } from "@/shared/lib/aws/config";

/**
 * Manual cleanup endpoint for expired and revoked deliveries
 * This endpoint can be called manually or via external cron service (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET() {
  try {
    logger.info({ message: "Starting cleanup job for expired deliveries" });

    const supabase = await createClient();
    const awsConfig = getAWSConfig();

    // Fetch deliveries with status expired or revoked
    const { data: deliveriesToDelete, error: deliveriesToDeleteError } =
      await supabase
        .from("deliveries")
        .select("id, delivery_files(id, storage_path)")
        .in("status", ["expired", "revoked"]);

    if (deliveriesToDeleteError) {
      logger.error({
        message: "Error fetching deliveries to delete",
        error: deliveriesToDeleteError,
      });
      return NextResponse.json(
        { message: "Error fetching deliveries to delete" },
        { status: 500 }
      );
    }

    if (!deliveriesToDelete || deliveriesToDelete.length === 0) {
      logger.info({ message: "No deliveries to delete" });
      return NextResponse.json(
        { message: "No deliveries to delete" },
        { status: 200 }
      );
    }

    logger.info({
      message: "Found deliveries to delete",
      count: deliveriesToDelete.length,
    });

    // Initialize S3 client
    const s3 = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
    const bucket = awsConfig.bucket;

    let successCount = 0;
    let errorCount = 0;

    // Process each delivery
    for (const delivery of deliveriesToDelete) {
      try {
        logger.info({
          message: "Processing delivery deletion",
          deliveryId: delivery.id,
          fileCount: delivery.delivery_files?.length || 0,
        });

        // Delete files from S3
        if (delivery.delivery_files && delivery.delivery_files.length > 0) {
          for (const file of delivery.delivery_files) {
            try {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: bucket,
                  Key: file.storage_path,
                })
              );
              logger.info({
                message: "File deleted from S3",
                deliveryId: delivery.id,
                fileId: file.id,
                storagePath: file.storage_path,
              });
            } catch (s3Error) {
              logger.error({
                message: "Failed to delete file from S3",
                deliveryId: delivery.id,
                fileId: file.id,
                storagePath: file.storage_path,
                error: s3Error,
              });
              // Continue with other files even if one fails
            }
          }
        }

        // Delete delivery from database (cascade will delete delivery_files)
        const { error: deleteError } = await supabase
          .from("deliveries")
          .delete()
          .eq("id", delivery.id);

        if (deleteError) {
          logger.error({
            message: "Failed to delete delivery from database",
            deliveryId: delivery.id,
            error: deleteError,
          });
          errorCount++;
        } else {
          logger.info({
            message: "Delivery deleted successfully",
            deliveryId: delivery.id,
          });
          successCount++;
        }
      } catch (deliveryError) {
        logger.error({
          message: "Error processing delivery deletion",
          deliveryId: delivery.id,
          error: deliveryError,
        });
        errorCount++;
      }
    }

    logger.info({
      message: "Cleanup job completed",
      totalProcessed: deliveriesToDelete.length,
      successCount,
      errorCount,
    });

    return NextResponse.json(
      {
        message: "Cleanup job completed",
        totalProcessed: deliveriesToDelete.length,
        successCount,
        errorCount,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      message: "Fatal error in cleanup job",
      error,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
