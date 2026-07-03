const { createClient } = require('@supabase/supabase-js');

const url = 'https://nbjretwmzpyclsgmqaqe.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg';

const supabase = createClient(url, serviceKey);

async function run() {
  const { data, error } = await supabase.from('reviews').select('*').limit(1);
  if (error) {
    console.error('Error fetching reviews:', error);
  } else {
    console.log('Review Row:', data);
  }
}

run();
