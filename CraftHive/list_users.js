const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbjretwmzpyclsgmqaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg'
);

async function listUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('--- EXISTING USERS ---');
    users.forEach(u => {
      console.log(`Email: ${u.email} | Name: ${u.user_metadata?.full_name} | Role: ${u.user_metadata?.role}`);
    });
  }
}

listUsers();
