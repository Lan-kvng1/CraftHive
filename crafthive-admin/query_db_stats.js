const { createClient } = require('@supabase/supabase-js');

const url = 'https://nbjretwmzpyclsgmqaqe.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg';

const supabase = createClient(url, serviceKey);

async function run() {
  const { data: bookings, error: bErr } = await supabase.from('bookings').select('*');
  const { data: payments, error: pErr } = await supabase.from('payments').select('*');
  const { data: artisanProfiles, error: aErr } = await supabase.from('artisan_profiles').select('*');

  console.log('Bookings status counts:', bookings?.map(b => b.status));
  console.log('Payments status counts:', payments?.map(p => p.status));
  console.log('Bookings data:', bookings);
  console.log('Payments data:', payments);
  console.log('Artisan profiles data:', artisanProfiles);
}

run();
