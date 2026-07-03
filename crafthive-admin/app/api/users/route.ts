import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to verify that the request is made by a logged-in Admin
async function isAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false

    const token = authHeader.split(' ')[1]
    
    // Create a temporary client with the user's JWT token to check their identity
    const client = createClient(supabaseUrl, token)
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) return false

    // Check the role of this user in the profiles table
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) return false
    return profile.role === 'admin'
  } catch (e) {
    console.error('isAdmin check failed:', e)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })
    }

    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, full_name, phone, role } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, password, full_name, and role are required' }, { status: 400 })
    }

    if (role !== 'customer' && role !== 'artisan') {
      return NextResponse.json({ error: 'Invalid role. Must be either customer or artisan' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authErr || !authData.user) {
      return NextResponse.json({ error: `Auth creation failed: ${authErr?.message || 'Unknown error'}` }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Create the profile in the profiles table
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email,
        phone: phone || null,
        role: role,
        created_at: new Date().toISOString()
      })

    if (profileErr) {
      // Cleanup the auth user to maintain sync
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Profile creation failed: ${profileErr.message}` }, { status: 500 })
    }

    // 3. Create the artisan profile entry if role is artisan
    if (role === 'artisan') {
      const { error: artisanErr } = await supabaseAdmin
        .from('artisan_profiles')
        .insert({
          user_id: userId,
          trade_category: 'General',
          status: 'approved',
          rating: 0,
          total_reviews: 0
        })
      if (artisanErr) {
        console.warn('Failed to create default artisan profile entry:', artisanErr.message)
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    console.error('API POST users exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })
    }

    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID parameter is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Delete from auth.users (cascade should handle profiles, but we delete manually to be safe)
    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthErr) {
      return NextResponse.json({ error: `Auth deletion failed: ${deleteAuthErr.message}` }, { status: 500 })
    }

    // 2. Delete from profiles
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (err: any) {
    console.error('API DELETE users exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
