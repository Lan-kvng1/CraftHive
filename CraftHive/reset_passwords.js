const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbjretwmzpyclsgmqaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg'
);

async function resetPasswords() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error('Error:', error);

  for (const user of users) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'password123'
    });
    if (updateError) {
      console.log(`Failed to update ${user.email}`);
    } else {
      console.log(`Successfully reset password for ${user.email} to 'password123'`);
    }
  }
}

resetPasswords();
