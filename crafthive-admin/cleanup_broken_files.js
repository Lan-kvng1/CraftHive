const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanZeroByteFiles() {
  console.log("Starting cleanup of 0-byte files...");

  // 1. Get all folders (artisan UUIDs) in the 'portfolios' bucket
  const { data: folders, error: folderError } = await supabase.storage.from('portfolios').list();
  
  if (folderError) {
    console.error("Error fetching folders:", folderError);
    return;
  }

  const zeroBytePaths = [];
  const zeroByteFilenames = [];

  // 2. Iterate through each folder and find 0-byte files
  for (const folder of folders) {
    // Skip if it's a file at the root, we only want folders
    if (!folder.id) continue;

    const folderName = folder.name;
    const { data: files, error: fileError } = await supabase.storage.from('portfolios').list(folderName);
    
    if (fileError) {
      console.warn(`Could not list files in folder ${folderName}`);
      continue;
    }

    for (const file of files) {
      if (file.name !== '.emptyFolderPlaceholder') {
        const fullPath = `${folderName}/${file.name}`;
        console.log(`Checking file: ${fullPath} | Size: ${file.metadata?.size} bytes`);
        if (file.metadata && (file.metadata.size === 0 || file.metadata.size < 50)) {
          zeroBytePaths.push(fullPath);
          zeroByteFilenames.push(file.name);
          console.log(`>>> Marking for deletion: ${fullPath}`);
        }
      }
    }
  }

  if (zeroBytePaths.length === 0) {
    console.log("No 0-byte files found! Database is already clean.");
    return;
  }

  console.log(`\nFound ${zeroBytePaths.length} broken files. Deleting from storage...`);

  // 3. Delete from Storage
  const { error: deleteError } = await supabase.storage.from('portfolios').remove(zeroBytePaths);
  if (deleteError) {
    console.error("Error deleting from storage:", deleteError);
  } else {
    console.log("Successfully deleted broken files from storage.");
  }

  // 4. Delete corresponding records from database tables
  console.log("\nCleaning up database references...");
  
  for (const filename of zeroByteFilenames) {
    // Delete from portfolio_items
    const { data: itemData, error: itemError } = await supabase
      .from('portfolio_items')
      .delete()
      .like('image_url', `%${filename}%`)
      .select();
      
    if (!itemError && itemData && itemData.length > 0) {
      console.log(`Deleted ${itemData.length} records from portfolio_items for ${filename}`);
    }

    // Delete from portfolio_documents
    const { data: docData, error: docError } = await supabase
      .from('portfolio_documents')
      .delete()
      .like('url', `%${filename}%`)
      .select();
      
    if (!docError && docData && docData.length > 0) {
      console.log(`Deleted ${docData.length} records from portfolio_documents for ${filename}`);
    }
  }

  console.log("\nCleanup completely finished! You can now re-upload safely.");
}

cleanZeroByteFiles();
