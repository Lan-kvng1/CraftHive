// run_migration.js — runs the ALTER TABLE reviews ADD COLUMN status migration
// Uses Supabase Management API authenticated with your dashboard credentials

async function main() {
  const email    = 'franklanking69@gmail.com'
  const password = 'Alu_tHE&Guest.3601@'
  const projectRef = 'nbjretwmzpyclsgmqaqe'
  const sql = `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';`

  console.log('Step 1: Authenticating with Supabase platform…')

  // ── 1. Get platform access token ──────────────────────────────────────────
  const authRes = await fetch('https://api.supabase.com/v1/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'password', email, password }),
  })

  const authBody = await authRes.text()
  console.log('Auth status:', authRes.status)

  let token = null
  try {
    const authJson = JSON.parse(authBody)
    token = authJson.access_token
    if (token) {
      console.log('✓ Got access token')
    } else {
      console.log('Auth response:', JSON.stringify(authJson, null, 2))
    }
  } catch {
    console.log('Auth raw response:', authBody)
  }

  if (!token) {
    console.log('\nFalling back: trying service-role key direct SQL…')
    await tryServiceRoleSQL(projectRef, sql)
    return
  }

  // ── 2. Run SQL via Management API ─────────────────────────────────────────
  console.log('\nStep 2: Running SQL migration…')
  const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  const sqlBody = await sqlRes.text()
  console.log('SQL status:', sqlRes.status)
  try {
    console.log('SQL response:', JSON.stringify(JSON.parse(sqlBody), null, 2))
  } catch {
    console.log('SQL raw:', sqlBody)
  }

  if (sqlRes.status >= 200 && sqlRes.status < 300) {
    console.log('\n✅  Migration successful! The status column now exists.')
    console.log('    Approve / Flag buttons in the admin Reviews page are now active.')
  } else {
    console.log('\n⚠️  Management API returned an error. Try the fallback below.')
    await tryServiceRoleSQL(projectRef, sql)
  }
}

// ── Fallback: call a custom Supabase RPC or REST endpoint ──────────────────
async function tryServiceRoleSQL(projectRef, sql) {
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTg4NiwiZXhwIjoyMDk1NzIxODg2fQ.uQF5dmy4lOML8yf8th3YiEWSlUsxosillRs4CI7I7Xg'

  console.log('Trying Management API with service-role JWT…')
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  const body = await res.text()
  console.log('Fallback status:', res.status)
  try { console.log('Fallback response:', JSON.stringify(JSON.parse(body), null, 2)) }
  catch { console.log('Fallback raw:', body) }

  if (res.status >= 200 && res.status < 300) {
    console.log('\n✅  Migration successful via service key!')
  } else {
    console.log('\n❌  Both attempts failed.')
    console.log('    Please run this SQL manually in your Supabase SQL Editor:')
    console.log('    https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
    console.log('\n    SQL to run:')
    console.log('    ' + sql)
  }
}

main().catch(console.error)
