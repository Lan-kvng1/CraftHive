const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listUsers() {
  try {
    // List profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email, role');
    if (pErr) {
      console.error("Profiles query error:", pErr);
    } else {
      console.log("Database profiles:", profiles);
    }

    // List auth users
    const { data: authData, error: aErr } = await supabase.auth.admin.listUsers();
    if (aErr) {
      console.error("Auth users query error:", aErr);
    } else {
      console.log("Auth users list:", authData.users.map(u => ({ id: u.id, email: u.email, role: u.role, created_at: u.created_at })));
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

listUsers();
