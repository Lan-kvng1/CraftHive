const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function wipeBrokenFiles() {
  console.log("Wiping broken database records and files...");

  // 1. Delete from database tables
  await supabase.from('portfolio_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('portfolio_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Wiped portfolio_items and portfolio_documents tables.");

  // 2. Delete the broken files from storage
  const pathsToDelete = [
    '8f80c169-c9d9-4ba7-a9fa-5146eb2d97f3/portfolio_1782335891545_0.jpg',
    '8f80c169-c9d9-4ba7-a9fa-5146eb2d97f3/portfolio_1782335892177_1.jpg',
    '8f80c169-c9d9-4ba7-a9fa-5146eb2d97f3/id_1782335893460.jpg',
    '8f80c169-c9d9-4ba7-a9fa-5146eb2d97f3/cert_1782335894259.jpg'
  ];

  const { error } = await supabase.storage.from('portfolios').remove(pathsToDelete);
  
  if (error) {
    console.error("Storage delete error:", error);
  } else {
    console.log("Successfully wiped the 0-byte images from the portfolios storage bucket!");
  }
}

wipeBrokenFiles();
