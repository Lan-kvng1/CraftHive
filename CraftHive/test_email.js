const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbjretwmzpyclsgmqaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg'
);

async function testEmail() {
  console.log('Invoking send-email edge function...');
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { 
      type: 'welcome', 
      data: { email: 'franklanking69@gmail.com', name: 'Frank', role: 'customer' } 
    },
  });

  if (error) {
    console.error('EDGE FUNCTION ERROR:', error);
  } else {
    console.log('EDGE FUNCTION RESPONSE:', data);
  }
}

testEmail();
