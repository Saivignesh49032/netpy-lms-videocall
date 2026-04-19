import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { archiveRecording } from './lib/archiver';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncOldRecordings() {
  console.log('🔄 Fetching old recordings hosted on Stream CDN...');

  // Fetch recordings where file_key starts with "http" (meaning it hasn't been moved to MinIO)
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .ilike('file_key', 'http%');

  if (error) {
    console.error('Failed to fetch recordings:', error);
    return;
  }

  if (!recordings || recordings.length === 0) {
    console.log('✅ All recordings are already synced to MinIO!');
    return;
  }

  console.log(`📦 Found ${recordings.length} recordings that need to be moved to MinIO.`);

  for (const record of recordings) {
    console.log(`\n⏳ Migrating recording: ${record.id}`);
    try {
      if (record.file_key) {
        // Stream format generates an ID usually, we can mock the session ID if it doesn't exist
        const streamSessionId = record.stream_record_id || `session_${Math.random().toString(36).substring(7)}`;
        await archiveRecording(record.id, record.file_key, streamSessionId, record.meeting_id);
      }
    } catch (err) {
      console.error(`❌ Failed to migrate ${record.id}:`, err);
    }
  }

  console.log('\n🎉 Archival sync complete!');
}

syncOldRecordings();
