import cron from "node-cron";
import { logger } from "@shared/lib/logger";
import { createClient } from "@shared/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAWSConfig } from "@/shared/lib/aws/config";

export default function GET() {
  cron.schedule("0 0 * * *", async () => {
    const supabase = await createClient();
    const awsConfig = getAWSConfig();

    const { data, error } = await supabase.from("deliveries").select("*");
    if (error) {
      logger.error(
        { message: "Error fetching deliveries:" },
        error.message || "Unknown error"
      );
      return;
    }
    logger.info({ message: "Deliveries fetched:", count: data?.length || 0 });

    const { data: deliveriesToDelete, error: deliveriesToDeleteError } =
      await supabase
        .from("deliveries")
        .select("id, delivery_files(id, storage_path)")
        .eq("status", "expired")
        .or("status.eq.revoked");

    if (deliveriesToDeleteError) {
      logger.error(
        { message: "Error fetching deliveries to delete:" },
        deliveriesToDeleteError.message || "Unknown error"
      );
      return NextResponse.json(
        { message: "Error fetching deliveries to delete" },
        { status: 500 }
      );
    }

    if (deliveriesToDelete?.length > 0) {
      const { S3Client, DeleteObjectCommand } = await import(
        "@aws-sdk/client-s3"
      );
      const s3 = new S3Client({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
      });
      const bucket = awsConfig.bucket;

      for (const delivery of deliveriesToDelete) {
        logger.info({
          message: "Deleting delivery:",
          deliveryId: delivery.id,
          fileCount: delivery.delivery_files.length,
        });

        // Eliminar archivos de S3
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
                storagePath: file.storage_path,
              });
            } catch (s3Error) {
              logger.error({
                message: "Failed to delete file from S3",
                storagePath: file.storage_path,
                error: s3Error,
              });
              // Continúa con otros archivos aunque uno falle
            }
          }
        }

        // Eliminar el delivery de la base de datos (cascade eliminará los delivery_files)
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
        } else {
          logger.info({
            message: "Delivery deleted successfully",
            deliveryId: delivery.id,
          });
        }
      }

      logger.info({
        message: "Cronjob completed",
        deletedCount: deliveriesToDelete.length,
      });
      return NextResponse.json(
        {
          message: "Cronjob completed",
          deletedCount: deliveriesToDelete.length,
        },
        { status: 200 }
      );
    }

    logger.info({ message: "No deliveries to delete" });
    return NextResponse.json(
      { message: "No deliveries to delete" },
      { status: 200 }
    );
  });
}
