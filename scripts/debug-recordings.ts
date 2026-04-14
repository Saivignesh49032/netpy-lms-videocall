import { StreamClient } from '@stream-io/node-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

async function check() {
  if (!apiKey || !apiSecret) {
    console.error('❌ Keys missing');
    return;
  }

  const client = new StreamClient(apiKey, apiSecret);
  
  try {
    console.log('🔍 Fetching latest calls and their recording status...');
    
    const { calls } = await client.video.queryCalls({
      sort: [{ field: 'created_at', direction: -1 }],
      limit: 5
    });

    for (const callState of calls) {
      const callId = callState.call.id;
      const title = callState.call.custom?.title || 'Untitled';
      console.log(`\n📺 Call: ${title} (${callId})`);
      
      const recordings = await client.video.call('default', callId).listRecordings();
      
      if (recordings.recordings.length === 0) {
        console.log('   📭 No recordings found for this call.');
      } else {
        recordings.recordings.forEach(rec => {
          console.log(`   📹 Recording: ${rec.filename}`);
          console.log(`      Status: ${rec.url ? 'READY' : 'PENDING'}`);
          console.log(`      URL: ${rec.url || 'N/A'}`);
        });
      }
    }
  } catch (err: any) {
    console.error('❌ Error checking recordings:', err.message);
  }
}

check();
