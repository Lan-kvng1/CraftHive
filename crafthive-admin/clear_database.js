const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg";
const ADMIN_USER_ID = "655d9ce3-9fef-43f7-a813-344b97bd08e9";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const tables = [
  'reviews',
  'messages',
  'payments',
  'bookings',
  'artisan_profiles',
  'portfolio_items',
  'portfolio_documents',
  'notifications',
  'kyc_documents'
];

async function clearDb() {
  console.log("Starting database purge...");

  // 1. Delete rows in dependent tables
  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.warn(`Could not delete from ${t}: ${error.message}`);
      } else {
        console.log(`Cleared table: ${t}`);
      }
    } catch (e) {
      console.warn(`Exception clearing ${t}:`, e.message);
    }
  }

  // 2. Delete profiles except admin
  try {
    const { error: pErr } = await supabase.from('profiles').delete().neq('id', ADMIN_USER_ID);
    if (pErr) {
      console.warn(`Could not clear profiles table: ${pErr.message}`);
    } else {
      console.log("Cleared profiles (except admin)");
    }
  } catch (e) {
    console.warn("Exception clearing profiles:", e.message);
  }

  // 3. Delete auth users except admin
  try {
    const { data, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr) {
      console.error("Could not list auth users:", uErr.message);
      return;
    }
    const toDelete = data.users.filter(u => u.id !== ADMIN_USER_ID);
    console.log(`Found ${toDelete.length} auth users to delete.`);
    for (const u of toDelete) {
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error) {
        console.error(`Failed to delete user ${u.email} (${u.id}): ${error.message}`);
      } else {
        console.log(`Deleted auth user: ${u.email}`);
      }
    }
  } catch (e) {
    console.error("Exception clearing auth users:", e.message);
  }

  console.log("Purge complete!");
}

clearDb();
