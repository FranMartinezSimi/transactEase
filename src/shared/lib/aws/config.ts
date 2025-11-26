/**
 * AWS Configuration Helper
 * Validates and provides AWS S3 configuration
 */

export interface AWSConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucket: string;
  sse?: "AES256" | "aws:kms";
}

/**
 * Validates and returns AWS S3 configuration
 * @throws Error if required environment variables are missing
 */
export function getAWSConfig(): AWSConfig {
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  const sse = process.env.AWS_S3_SSE === "aws:kms" ? "aws:kms" : "AES256";

  const missing: string[] = [];
  if (!region) missing.push("AWS_S3_REGION or AWS_REGION");
  if (!accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("AWS_S3_BUCKET");

  if (missing.length > 0) {
    throw new Error(
      `Missing required AWS environment variables: ${missing.join(", ")}`
    );
  }

  return {
    region: region!,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    bucket: bucket!,
    sse,
  };
}
