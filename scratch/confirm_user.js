const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error("Please provide a user ID as an argument.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser(targetUserId) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUserId,
    { email_confirm: true }
  );

  if (error) {
    console.error('Error confirming user:', error.message);
  } else {
    console.log(`Successfully confirmed user: ${data?.user?.email || targetUserId}`);
  }
}

confirmUser(userId);
