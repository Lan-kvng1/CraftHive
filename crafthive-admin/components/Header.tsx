'use client'
import { useState, useEffect, useRef } from 'react'
import { Ico } from './icons'
import { supabase, getCurrentUser } from '@/lib/supabase'
import type { Page } from '@/lib/types'

const breadcrumbs: Record<Page, string[]> = {
  overview: ['Dashboard', 'Overview'],
  customers: ['Users', 'Customers'],
  artisans: ['Users', 'Artisans'],
  kyc: ['Users', 'KYC Queue'],
  bookings: ['Operations', 'Bookings'],
  transactions: ['Operations', 'Transactions'],
  payouts: ['Operations', 'Payouts'],
  commissions: ['Operations', 'Commissions'],
  disputes: ['Support', 'Disputes'],
  promotions: ['Support', 'Promotions'],
  reports: ['System', 'Reports'],
  reviews: ['Support', 'Reviews'],
  settings: ['System', 'Settings'],
  'admin-profile': ['Account', 'My Profile'],
}

interface Notification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
  type: string
}

interface AdminInfo {
  full_name: string
  email: string
  role: string
  avatar_url: string | null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  finance: 'Finance',
  support: 'Support Agent',
  moderator: 'Moderator',
}

export default function Header({
  page,
  isGuest,
  onSignInPrompt,
  onNavigate,
  onProfileClick,
}: {
  page: Page
  isGuest: boolean
  onSignInPrompt?: () => void
  onNavigate?: (p: Page) => void
  onProfileClick?: () => void
}) {
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const crumbs = breadcrumbs[page] ?? ['Dashboard']

  // ── Fetch admin profile — uses getSession (no network request) ────────────
  const fetchAdminInfo = async () => {
    if (isGuest) return
    try {
      const user = await getCurrentUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', user.id)
        .single()
      if (profile) {
        setAdminInfo({
          full_name: profile.full_name || user.email || 'Admin',
          email: user.email || '',
          role: profile.role,
          avatar_url: profile.avatar_url || null,
        })
      }
    } catch (err) {
      console.warn('fetchAdminInfo error:', err)
    }
  }

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (isGuest) return
    try {
      const user = await getCurrentUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        setNotifications(data)
        setUnread(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (err) {
      console.warn('fetchNotifications error:', err)
    }
  }

  const markAllRead = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch (err) {
      console.warn('markAllRead error:', err)
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnread(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.warn('markOneRead error:', err)
    }
  }

  const getTimeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  useEffect(() => {
    if (!isGuest) {
      fetchAdminInfo()
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isGuest])

  // Re-fetch admin info when returning from profile/settings (avatar may have changed)
  useEffect(() => {
    if (!isGuest && (page === 'admin-profile' || page === 'settings')) {
      fetchAdminInfo()
    }
  }, [page])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Avatar component ──────────────────────────────────────────────────────
  const AvatarEl = ({ size = 34 }: { size?: number }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: size,
      background: isGuest ? '#E8EDF8' : '#1B2B6B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.35),
      fontWeight: 700,
      color: isGuest ? '#6B7494' : '#fff',
      fontFamily: 'monospace',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {isGuest
        ? '?'
        : adminInfo?.avatar_url && adminInfo.avatar_url.startsWith('http')
          ? (
            <img
              src={adminInfo.avatar_url}
              alt={adminInfo.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                const img = e.currentTarget as HTMLImageElement
                img.style.display = 'none'
                if (img.parentElement) {
                  img.parentElement.innerText = getInitials(adminInfo?.full_name || 'A')
                }
              }}
            />
          )
          : getInitials(adminInfo?.full_name || 'A')
      }
    </div>
  )

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E8EDF8', flexShrink: 0 }}>

      {/* ── Guest warning bar ── */}
      {isGuest && (
        <div style={{
          background: '#fef9c3',
          borderBottom: '1px solid #fde68a',
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 24,
          paddingRight: 24,
          fontSize: 13,
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: '#92400e', display: 'flex', alignItems: 'center' }}>
            {Ico.warning}
          </span>
          You are browsing as a guest. Some data and features are restricted.
          <button
            onClick={onSignInPrompt}
            style={{
              marginLeft: 8,
              background: '#1B2B6B',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign In
          </button>
        </div>
      )}

      {/* ── Main header bar ── */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 24,
        paddingRight: 24,
        gap: 16,
      }}>

        {/* Breadcrumb */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && (
                <span style={{ color: '#D1D5DB', display: 'flex', alignItems: 'center' }}>
                  {Ico.chevronRight}
                </span>
              )}
              <span style={{
                fontSize: 13,
                color: i === crumbs.length - 1 ? '#1B2B6B' : '#6B7494',
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
              }}>
                {c}
              </span>
            </span>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7494',
            display: 'flex',
            alignItems: 'center',
          }}>
            {Ico.search}
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users, bookings..."
            style={{
              background: '#F5F7FF',
              border: '1px solid #E8EDF8',
              borderRadius: 8,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 32,
              paddingRight: 12,
              fontSize: 13,
              color: '#1B2B6B',
              outline: 'none',
              width: 240,
            }}
          />
        </div>

        {/* ── Notifications bell ── */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (isGuest) { onSignInPrompt?.(); return }
              setShowNotifs(v => !v)
              if (!showNotifs) fetchNotifications()
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: showNotifs ? '#EEF1FB' : '#F5F7FF',
              border: '1px solid #E8EDF8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: '#1B2B6B',
            }}
          >
            {Ico.bell}
            {unread > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: '#FF4444',
                border: '1.5px solid #fff',
              }} />
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute',
              top: 44,
              right: 0,
              width: 360,
              background: '#fff',
              border: '1px solid #E8EDF8',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(27,43,107,0.12)',
              zIndex: 1000,
              overflow: 'hidden',
            }}>
              {/* Notif header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                paddingBottom: 14,
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: '1px solid #E8EDF8',
              }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 14 }}>
                    Notifications
                  </p>
                  {unread > 0 && (
                    <p style={{ fontSize: 12, color: '#6B7494', marginTop: 2 }}>
                      {unread} unread
                    </p>
                  )}
                </div>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1B2B6B',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notif list */}
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    paddingTop: 40,
                    paddingBottom: 40,
                    paddingLeft: 20,
                    paddingRight: 20,
                    textAlign: 'center',
                    color: '#6B7494',
                    fontSize: 14,
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: '#F5F7FF',
                      margin: '0 auto',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6B7494',
                    }}>
                      {Ico.bell}
                    </div>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.is_read) markOneRead(n.id) }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: n.is_read ? '#fff' : '#F5F7FF',
                        borderBottom: '1px solid #F5F7FF',
                        cursor: n.is_read ? 'default' : 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: n.is_read ? '#F5F7FF' : '#EEF1FB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#1B2B6B',
                      }}>
                        {Ico.bell}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: n.is_read ? 400 : 600,
                          color: '#1B2B6B',
                          lineHeight: 1.4,
                          marginBottom: 2,
                        }}>
                          {n.title}
                        </p>
                        <p style={{
                          fontSize: 12,
                          color: '#6B7494',
                          lineHeight: 1.4,
                          marginBottom: 4,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {n.body}
                        </p>
                        <p style={{ fontSize: 11, color: '#6B7494' }}>
                          {getTimeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: '#1B2B6B',
                          flexShrink: 0,
                          marginTop: 4,
                        }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile dropdown ── */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 12,
              borderLeft: '1px solid #E8EDF8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <AvatarEl size={34} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B', lineHeight: 1 }}>
                {isGuest ? 'Guest' : (adminInfo?.full_name || 'Loading...')}
              </p>
              <p style={{ fontSize: 11, color: '#6B7494', marginTop: 2 }}>
                {isGuest
                  ? 'Limited access'
                  : ROLE_LABEL[adminInfo?.role || ''] || 'Admin'}
              </p>
            </div>
            <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
              {Ico.chevronD}
            </span>
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute',
              top: 50,
              right: 0,
              width: 240,
              background: '#fff',
              border: '1px solid #E8EDF8',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(27,43,107,0.12)',
              zIndex: 1000,
              overflow: 'hidden',
            }}>
              {/* Dropdown header — avatar + name */}
              <div style={{
                paddingTop: 14,
                paddingBottom: 14,
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: '1px solid #E8EDF8',
                background: isGuest ? '#fef9c3' : '#F5F7FF',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <AvatarEl size={40} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontWeight: 700,
                    color: '#1B2B6B',
                    fontSize: 14,
                    lineHeight: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {isGuest ? 'Guest User' : (adminInfo?.full_name || 'Admin')}
                  </p>
                  <p style={{
                    fontSize: 12,
                    color: '#6B7494',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {isGuest ? 'Browsing as guest' : adminInfo?.email}
                  </p>
                </div>
              </div>

              {isGuest ? (
                <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 12, paddingRight: 12 }}>
                  <button
                    onClick={() => { setShowProfile(false); onSignInPrompt?.() }}
                    style={{
                      width: '100%',
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: 14,
                      paddingRight: 14,
                      background: '#1B2B6B',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {Ico.login} Sign in for full access
                  </button>
                  <p style={{
                    fontSize: 11,
                    color: '#6B7494',
                    textAlign: 'center',
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}>
                    Sign in to access all admin features.
                  </p>
                </div>
              ) : (
                <>
                  {/* My Profile */}
                  <button
                    onClick={() => { setShowProfile(false); onProfileClick?.() }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 11,
                      paddingBottom: 11,
                      paddingLeft: 16,
                      paddingRight: 16,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#1B2B6B',
                      textAlign: 'left',
                      borderBottom: '1px solid #F5F7FF',
                    }}
                  >
                    <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
                      {Ico.user}
                    </span>
                    My Profile
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => { setShowProfile(false); onNavigate?.('settings') }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 11,
                      paddingBottom: 11,
                      paddingLeft: 16,
                      paddingRight: 16,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#1B2B6B',
                      textAlign: 'left',
                      borderBottom: '1px solid #F5F7FF',
                    }}
                  >
                    <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
                      {Ico.settings}
                    </span>
                    Settings
                  </button>

                  {/* Notifications with unread count */}
                  <button
                    onClick={() => { setShowProfile(false); setShowNotifs(true) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 11,
                      paddingBottom: 11,
                      paddingLeft: 16,
                      paddingRight: 16,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#1B2B6B',
                      textAlign: 'left',
                      borderBottom: '1px solid #F5F7FF',
                    }}
                  >
                    <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
                      {Ico.bell}
                    </span>
                    <span style={{ flex: 1 }}>Notifications</span>
                    {unread > 0 && (
                      <span style={{
                        background: '#FF4444',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        paddingTop: 1,
                        paddingBottom: 1,
                        paddingLeft: 6,
                        paddingRight: 6,
                        borderRadius: 10,
                      }}>
                        {unread}
                      </span>
                    )}
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={() => { setShowProfile(false); onSignInPrompt?.() }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 11,
                      paddingBottom: 11,
                      paddingLeft: 16,
                      paddingRight: 16,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#dc2626',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                      {Ico.logout}
                    </span>
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}