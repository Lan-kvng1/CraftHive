// src/context/NotificationContext.tsx — FINAL
// Loads and exposes user notification preferences from DB
// Other screens import useNotifications() to check prefs before inserting
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface NotifPrefs {
    bookings: boolean
    messages: boolean
    promos: boolean
    payments: boolean
}

interface NotifCtx {
    prefs: NotifPrefs
    unreadCount: number
    setPrefs: (p: Partial<NotifPrefs>) => Promise<void>
    refreshUnread: () => void
}

const DEFAULT: NotifPrefs = { bookings: true, messages: true, promos: false, payments: true }

const NotificationContext = createContext<NotifCtx>({
    prefs: DEFAULT,
    unreadCount: 0,
    setPrefs: async () => { },
    refreshUnread: () => { },
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null)
    const [prefs, setPrefsState] = useState<NotifPrefs>(DEFAULT)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id)
                loadPrefs(session.user.id)
                loadUnread(session.user.id)
            }
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            const uid = session?.user?.id || null
            setUserId(uid)
            if (uid) { loadPrefs(uid); loadUnread(uid) }
            else { setPrefsState(DEFAULT); setUnreadCount(0) }
        })
        return () => subscription.unsubscribe()
    }, [])

    const loadPrefs = async (uid: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('notif_bookings, notif_messages, notif_promos, notif_payments')
            .eq('id', uid).single()
        if (data) {
            setPrefsState({
                bookings: data.notif_bookings ?? true,
                messages: data.notif_messages ?? true,
                promos: data.notif_promos ?? false,
                payments: data.notif_payments ?? true,
            })
        }
    }

    const loadUnread = async (uid: string) => {
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('read', false)
        setUnreadCount(count || 0)
    }

    const setPrefs = async (p: Partial<NotifPrefs>) => {
        if (!userId) return
        const updated = { ...prefs, ...p }
        setPrefsState(updated)
        await supabase.from('profiles').update({
            notif_bookings: updated.bookings,
            notif_messages: updated.messages,
            notif_promos: updated.promos,
            notif_payments: updated.payments,
        }).eq('id', userId)
    }

    const refreshUnread = () => { if (userId) loadUnread(userId) }

    return (
        <NotificationContext.Provider value={{ prefs, unreadCount, setPrefs, refreshUnread }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => useContext(NotificationContext)