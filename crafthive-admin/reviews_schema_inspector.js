const email    = 'franklanking69@gmail.com';
const password = 'Alu_tHE&Guest.3601@';
const projectRef = 'nbjretwmzpyclsgmqaqe';
const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews';`;

async function main() {
  const authRes = await fetch('https://api.supabase.com/v1/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'password', email, password }),
  });

  const authJson = await authRes.json();
  const token = authJson.access_token;
  if (!token) {
    console.error("Failed to authenticate:", authJson);
    return;
  }

  const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const sqlJson = await sqlRes.json();
  console.log("Reviews columns:", JSON.stringify(sqlJson, null, 2));
}

main().catch(console.error);
