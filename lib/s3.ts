import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const BUCKET = process.env.MINIO_BUCKET ?? 'lms-recordings';

// Lazy initialization — only create the client when first needed,
// avoiding crashes at build time when env vars are not yet set
let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKeyId = process.env.MINIO_ACCESS_KEY;
  const secretAccessKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'MinIO is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY in .env.local'
    );
  }

  _s3Client = new S3Client({
    endpoint,
    region: 'us-east-1', // MinIO requires a region value even though it doesn't use it
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // Required for MinIO path-style URLs
  });

  return _s3Client;
}

/**
 * Generate a presigned GET URL for a recording file.
 * The URL expires after `expiresInSeconds` (default: 1 hour).
 * Only authenticated users who have been verified to have access
 * should ever receive this URL.
 */
export async function getPresignedUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
  // If the fileKey is actually a full URL (e.g. from Stream CDN), return it directly.
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey;
  }

  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
