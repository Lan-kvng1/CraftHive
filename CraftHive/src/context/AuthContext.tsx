// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: 'customer' | 'artisan' | 'admin'
  avatar_url?: string
  phone?: string
  location?: string
}

interface AuthCtx {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (u: User): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single()

      if (error || !data) {
        const meta = u.user_metadata || {}
        const fallback: any = {
          id: u.id,
          full_name: meta.full_name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          role: meta.role || 'customer',
        }
        await supabase.from('profiles').upsert(fallback)
        return fallback as Profile
      }

      return data as Profile
    } catch {
      return {
        id: u.id,
        full_name: u.email?.split('@')[0] || 'User',
        email: u.email || '',
        role: (u.user_metadata?.role as any) || 'customer',
      }
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user)
        if (mounted) setProfile(p)
        if (session?.user) registerForPushNotifications(session.user.id).catch(() => { })
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await fetchProfile(session.user)
          if (mounted) setProfile(p)
        } else {
          setProfile(null)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession?.user) return
    const p = await fetchProfile(currentSession.user)
    setProfile(p)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}