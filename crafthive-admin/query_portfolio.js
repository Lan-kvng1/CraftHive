const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nbjretwmzpyclsgmqaqe.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  const { data: bookings, error } = await supabase.from('bookings').select('*');
  console.log("Bookings:", JSON.stringify(bookings, null, 2));

  if (bookings && bookings.length > 0) {
    const booking = bookings[0];
    const row = {
      artisan_id: booking.artisan_id,
      booking_id: booking.id,
      latitude: 5.6037,
      longitude: -0.1870,
      heading: 90,
      speed: 0,
      updated_at: new Date().toISOString()
    };
    const { data, error: err } = await supabase.from('artisan_locations').upsert(row, { onConflict: 'artisan_id,booking_id' });
    console.log("Upsert with real booking result:", { data, error: err });
  } else {
    console.log("No bookings found in database.");
  }
}

check();
