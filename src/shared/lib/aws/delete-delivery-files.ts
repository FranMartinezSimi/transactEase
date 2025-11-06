import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getAWSConfig } from "./config";
import { logger } from "@shared/lib/logger";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Deletes all files associated with a delivery from S3 and updates delivery status
 * @param deliveryId - The ID of the delivery
 * @param supabase - Supabase client instance
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export async function deleteDeliveryFilesFromS3(
  deliveryId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const awsConfig = getAWSConfig();

    // Get all files associated with the delivery
    const { data: files, error: filesError } = await supabase
      .from("delivery_files")
      .select("id, storage_path")
      .eq("delivery_id", deliveryId);

    if (filesError) {
      logger.error({
        message: "Error fetching delivery files",
        deliveryId,
        error: filesError,
      });
      return false;
    }

    if (!files || files.length === 0) {
      logger.info({
        message: "No files to delete for delivery",
        deliveryId,
      });
      return true;
    }

    // Initialize S3 client
    const s3 = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
    const bucket = awsConfig.bucket;

    // Delete each file from S3
    let deletedCount = 0;
    for (const file of files) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: file.storage_path,
          })
        );
        deletedCount++;
        logger.info({
          message: "File deleted from S3",
          deliveryId,
          fileId: file.id,
          storagePath: file.storage_path,
        });
      } catch (s3Error) {
        logger.error({
          message: "Failed to delete file from S3",
          deliveryId,
          fileId: file.id,
          storagePath: file.storage_path,
          error: s3Error,
        });
        // Continue with other files even if one fails
      }
    }

    logger.info({
      message: "Delivery files deletion completed",
      deliveryId,
      totalFiles: files.length,
      deletedCount,
    });

    return deletedCount > 0;
  } catch (error) {
    logger.error({
      message: "Error in deleteDeliveryFilesFromS3",
      deliveryId,
      error,
    });
    return false;
  }
}
