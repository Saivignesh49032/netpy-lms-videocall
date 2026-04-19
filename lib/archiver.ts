import { BUCKET, getS3Client, objectExists } from './s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createAdminClient } from './supabase/admin';

/**
 * Downloads a recording from the Stream CDN URL and uploads it
 * directly to MinIO without loading the entire file into memory.
 */
export async function archiveRecording(recordingId: string, streamUrl: string, streamSessionId: string, meetingId: string) {
  console.log(`[Archiver] Started archival for recording ${recordingId}...`);

  try {
    const adminDb = createAdminClient();
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeMeetingId = sanitize(meetingId);
    const safeSessionId = sanitize(streamSessionId);
    
    const destinationKey = `recordings/${safeMeetingId}/${safeSessionId}.mp4`;

    // 1. Idempotency Check
    const exists = await objectExists(destinationKey);
    if (exists) {
      console.log(`[Archiver] File ${destinationKey} already exists in MinIO. Updating DB only.`);
      await updateDbFileKey(adminDb, recordingId, destinationKey);
      return;
    }

    // 2. Fetch the video stream with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let body: ReadableStream<Uint8Array>;
    try {
      const response = await fetch(streamUrl, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch from Stream CDN: ${response.statusText}`);
      }
      body = response.body as ReadableStream<Uint8Array>;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Fetch from Stream CDN timed out after 30 seconds');
      }
      throw err;
    }

    // 3. Stream upload to MinIO using @aws-sdk/lib-storage
    const client = getS3Client();
    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET,
        Key: destinationKey,
        Body: body,
        ContentType: 'video/mp4',
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`[Archiver] Uploading ${destinationKey}: ${Math.round((progress.loaded || 0) / 1024 / 1024)}MB / ${Math.round((progress.total || 0) / 1024 / 1024)}MB`);
    });

    await upload.done();
    console.log(`[Archiver] Successfully uploaded ${destinationKey} to MinIO.`);

    // 4. Update the Database
    await updateDbFileKey(adminDb, recordingId, destinationKey);
    console.log(`[Archiver] Database updated for recording ${recordingId} (Now permanently archived)`);

  } catch (err: any) {
    console.error(`[Archiver] Failed to archive recording ${recordingId}:`, err);
    // Even if it fails, the recording remains playable via stream CDN since the DB file_key was already set to the stream URL.
  }
}

async function updateDbFileKey(adminDb: any, recordingId: string, minioKey: string) {
  const { error } = await adminDb
    .from('recordings')
    .update({ file_key: minioKey }) // Changing from http:// stream URL to MinIO S3 key
    .eq('id', recordingId);

  if (error) {
    throw new Error(`DB update failed after archival: ${error.message}`);
  }
}
