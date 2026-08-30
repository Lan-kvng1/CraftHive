const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbjretwmzpyclsgmqaqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDU4ODYsImV4cCI6MjA5NTcyMTg4Nn0.NsLtaJAcwJMg8Y3UfC2ZFwtucNrAbbrqk_xlCtAef6c'
);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_db_error@example.com',
    password: 'password123',
    options: { data: { full_name: 'Test User', role: 'customer' } },
  });

  if (error) {
    console.error('SIGNUP ERROR:', error.message);
  } else {
    console.log('SIGNUP SUCCESS:', data.user.id);
  }
}

testSignup();
