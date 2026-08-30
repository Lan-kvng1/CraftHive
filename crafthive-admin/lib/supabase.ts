import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

if (!url || !anon) {
    throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

// Public client — uses anon key, respects RLS
export const supabase = createClient(url, anon, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,       // needed for password reset callback URL
        storageKey: 'crafthive-admin-auth',
    },
})

// Admin client — uses service role key, bypasses RLS (for admin dashboard only)
export const supabaseAdmin = createClient(url, serviceRole || anon, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

// Safe helper — reads from local storage, no network request
export async function getCurrentUser() {
    try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
            console.warn('getCurrentUser getSession error:', error.message)
            return null
        }
        return data?.session?.user ?? null
    } catch (e) {
        console.warn('getCurrentUser failed to fetch session:', e)
        return null
    }
}

// Safely resolves relative image paths or full URLs from Supabase Storage
export function getImageUrl(path: string | null | undefined, bucket: string = 'avatars'): string {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path
    }
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nbjretwmzpyclsgmqaqe.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}
