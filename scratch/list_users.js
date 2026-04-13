const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  const users = data?.users ?? [];

  if (users.length === 0) {
    console.log('No users found in the database. You can sign up a new account on the /sign-up page.');
  } else {
    console.log('Found the following users:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.user_metadata?.role || 'N/A'}`);
    });
    console.log('\nNote: Passwords are encrypted. If you don\'t know the password, please sign up for a new account.');
  }
}

listUsers();
