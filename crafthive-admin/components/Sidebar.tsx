'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Page } from '@/lib/types'
import { Ico } from './icons'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badgeKey?: 'kyc' | 'disputes'
  guestDisabled?: boolean
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: Ico.home },
    ],
  },
  {
    label: 'Users',
    items: [
      { id: 'customers', label: 'Customers', icon: Ico.users, guestDisabled: true },
      { id: 'artisans', label: 'Artisans', icon: Ico.tool },
      { id: 'kyc', label: 'KYC Queue', icon: Ico.shield, badgeKey: 'kyc', guestDisabled: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'bookings', label: 'Bookings', icon: Ico.calendar, guestDisabled: true },
      { id: 'transactions', label: 'Transactions', icon: Ico.receipt, guestDisabled: true },
      { id: 'commissions', label: 'Commissions', icon: Ico.dollar },
    ],
  },
  {
    label: 'Support',
    items: [
      { id: 'disputes', label: 'Disputes', icon: Ico.scale, badgeKey: 'disputes', guestDisabled: true },
      { id: 'reviews', label: 'Reviews', icon: Ico.star },
      { id: 'promotions', label: 'Promotions', icon: Ico.tag },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'reports', label: 'Reports', icon: Ico.barChart },
      { id: 'settings', label: 'Settings', icon: Ico.settings },
    ],
  },
]

export default function Sidebar({
  current,
  onNavigate,
  collapsed,
  onToggle,
  isGuest,
  onSignOut,
}: {
  current: Page
  onNavigate: (p: Page) => void
  collapsed: boolean
  onToggle: () => void
  isGuest: boolean
  onSignOut: () => void
}) {
  const [badges, setBadges] = useState<{ kyc: number; disputes: number }>({
    kyc: 0, disputes: 0,
  })
  const [hoverArrow, setHoverArrow] = useState(false)
  const [hoverSignOut, setHoverSignOut] = useState(false)
  // Track which badge pages have been visited this session so badge clears on visit
  const [visited, setVisited] = useState<Set<string>>(new Set())

  const fetchBadges = async () => {
    if (isGuest) return
    const [{ count: kyc }, { count: disputes }] = await Promise.all([
      supabase
        .from('artisan_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
    ])
    setBadges({ kyc: kyc ?? 0, disputes: disputes ?? 0 })
  }

  useEffect(() => {
    if (!isGuest) {
      fetchBadges()
      // Refresh badge counts every 60 seconds
      const interval = setInterval(fetchBadges, 60000)
      return () => clearInterval(interval)
    }
  }, [isGuest])

  // When user navigates to a badge page, mark it visited so badge clears
  useEffect(() => {
    if (current === 'kyc' || current === 'disputes') {
      setVisited(prev => new Set([...prev, current]))
    }
  }, [current])

  const getBadgeCount = (key?: 'kyc' | 'disputes') => {
    if (!key) return 0
    // If user has visited this page since last refresh, hide the badge
    if (visited.has(key === 'kyc' ? 'kyc' : 'disputes')) return 0
    return badges[key]
  }

  return (
    <aside style={{
      width: collapsed ? 68 : 232,
      minWidth: collapsed ? 68 : 232,
      height: '100vh',
      background: '#0A1628',
      backdropFilter: 'blur(30px)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.04)',
      position: 'relative',
      zIndex: 40,
    }}>

      {/* ── Logo + collapse toggle ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0, minHeight: 68,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,184,0,0.12)',
          border: '1px solid rgba(255,184,0,0.2)',
          flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/logo.png" alt="CraftHive"
            style={{ width: 24, height: 24, objectFit: 'contain' }} />
        </div>

        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1, letterSpacing: '-0.3px' }}>
              CraftHive
            </p>
            <p style={{ color: isGuest ? '#FFB800' : 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isGuest ? '● Guest' : 'Admin Panel'}
            </p>
          </div>
        )}

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute', top: 36, right: -14,
            background: hoverArrow ? '#FFB800' : '#1E2A3A',
            border: `1px solid ${hoverArrow ? '#FFB800' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14,
            color: hoverArrow ? '#0A1628' : 'rgba(255,255,255,0.7)',
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            width: 28, height: 28,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 50,
          }}
          onMouseEnter={() => setHoverArrow(true)}
          onMouseLeave={() => setHoverArrow(false)}
        >
          {collapsed ? Ico.chevronR : Ico.chevronL}
        </button>
      </div>

      {/* ── Guest banner ── */}
      {isGuest && !collapsed && (
        <div style={{
          background: 'rgba(255,184,0,0.08)',
          borderBottom: '1px solid rgba(255,184,0,0.12)',
          padding: '7px 14px',
          fontSize: 11, color: '#FFB800', lineHeight: 1.4, flexShrink: 0,
          fontWeight: 600,
        }}>
          Limited guest access
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            {group.label && !collapsed && (
              <p style={{
                color: 'rgba(255,255,255,0.22)',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                paddingLeft: 10,
                paddingRight: 10,
                marginBottom: 4,
              }}>
                {group.label}
              </p>
            )}

            {group.items.map((item: NavItem) => {
              const active = current === item.id
              const disabled = isGuest && item.guestDisabled
              const count = getBadgeCount(item.badgeKey)

              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && onNavigate(item.id as Page)}
                  title={
                    collapsed
                      ? item.label + (disabled ? ' (sign in required)' : '')
                      : disabled ? 'Sign in required' : undefined
                  }
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: active ? 'rgba(255,184,0,0.12)' : 'transparent',
                    color: disabled
                      ? 'rgba(255,255,255,0.15)'
                      : active ? '#FFB800' : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    textAlign: 'left', marginBottom: 2, position: 'relative',
                    transition: 'all 0.2s',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                  onMouseOver={e => { if (!disabled && !active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                  onMouseOut={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; } }}
                >
                  {/* Active left bar */}
                  {active && !disabled && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: 20,
                      background: '#FFB800',
                      borderRadius: '0 2px 2px 0',
                    }} />
                  )}

                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: active ? '#FFB800' : 'rgba(255,255,255,0.35)' }}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>

                      {/* Live count badge */}
                      {count > 0 && !disabled && (
                        <span style={{
                          background: '#EF4444',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          minWidth: 18,
                          height: 18,
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          paddingLeft: 4,
                          paddingRight: 4,
                        }}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}

                      {disabled && (
                        <span style={{
                          color: 'rgba(15,23,42,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          {Ico.lock}
                        </span>
                      )}
                    </>
                  )}

                  {/* Collapsed badge dot */}
                  {collapsed && count > 0 && !disabled && (
                    <span style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: '#EF4444',
                      border: '1.5px solid #fff',
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom sign out ── */}
      <div style={{
        padding: '10px 8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        {isGuest && !collapsed && (
          <button onClick={onSignOut} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid rgba(255,184,0,0.2)',
            background: 'rgba(255,184,0,0.08)',
            color: '#FFB800', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 6,
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.login}</span>
            Sign In
          </button>
        )}
        <button
          onClick={onSignOut}
          title={collapsed ? (isGuest ? 'Exit Guest Mode' : 'Sign out') : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, border: 'none',
            background: hoverSignOut ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: hoverSignOut ? '#ef4444' : 'rgba(255,255,255,0.35)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s',
          }}
          onMouseEnter={() => setHoverSignOut(true)}
          onMouseLeave={() => setHoverSignOut(false)}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.logout}</span>
          {!collapsed && <span>{isGuest ? 'Exit Guest Mode' : 'Sign out'}</span>}
        </button>
      </div>
    </aside>
  )
}