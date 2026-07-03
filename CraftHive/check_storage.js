const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDU4ODYsImV4cCI6MjA5NTcyMTg4Nn0.NsLtaJAcwJMg8Y3UfC2ZFwtucNrAbbrqk_xlCtAef6c";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data, error } = await supabase.storage.from('avatars').list('', { limit: 100 });
    if (error) {
      console.error("Error listing:", error.message);
      return;
    }
    console.log("Files directly in root of avatars bucket:", data);

    // Let's list files in the folder of Kyeremaa Leticia's ID
    const userId = "ea3663c5-cf07-4f14-a362-8c4955d02d62";
    const { data: folderData, error: folderErr } = await supabase.storage.from('avatars').list(userId, { limit: 100 });
    if (folderErr) {
      console.error("Error listing folder:", folderErr.message);
      return;
    }
    console.log(`Files in folder ${userId}:`, folderData.map(f => ({ name: f.name, size: f.metadata?.size })));
  } catch (e) {
    console.error("Exception:", e);
  }
}

check();
