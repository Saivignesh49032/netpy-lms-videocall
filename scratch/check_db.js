const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking auth.users...");
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) console.error("Auth err:", authErr);
  else console.log("Auth users:", authUsers.users.map(u => ({ id: u.id, email: u.email })));

  console.log("Checking public.users...");
  const { data: publicUsers, error: pubErr } = await supabase.from('users').select('*');
  if (pubErr) console.error("Pub err:", pubErr);
  else console.log("Public users:", publicUsers);
  
  console.log("Checking public.organisations...");
  const { data: orgs, error: orgErr } = await supabase.from('organisations').select('*');
  if (orgErr) console.error("Org err:", orgErr);
  else console.log("Organisations:", orgs);
}

check();
