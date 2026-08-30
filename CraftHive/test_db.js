const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbjretwmzpyclsgmqaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg'
);

async function testDB() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  if (error) {
    console.error('DB READ ERROR:', error);
  } else {
    console.log('DB READ SUCCESS. Updating a record...');
    if (data.length > 0) {
       const { error: updateError } = await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', data[0].id);
       if (updateError) {
         console.error('DB WRITE ERROR:', updateError);
       } else {
         console.log('DB WRITE SUCCESS!');
       }
    } else {
       console.log('No profiles found to update.');
    }
  }
}

testDB();
