'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Card } from '../ui'
import { Ico } from '../icons'
import { toast } from '../Toaster'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

interface Stats {
  totalCustomers: number
  totalArtisans: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  pendingBookings: number
  totalPayments: number
  totalRevenue: number
  openDisputes: number
  resolvedDisputes: number
  totalReviews: number
  avgRating: number
}

// Placeholder monthly trend data — replace with real time-series once you
// add a created_at index or a reporting view in Supabase
const MONTHLY_PLACEHOLDER = [
  { month: 'Jan', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
  { month: 'Feb', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
  { month: 'Mar', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
  { month: 'Apr', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
  { month: 'May', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
  { month: 'Jun', customers: 0, artisans: 0, bookings: 0, revenue: 0 },
]

const EXPORT_ITEMS = [
  { label: 'All Users',    icon: Ico.users,    key: 'users'    },
  { label: 'All Artisans', icon: Ico.tool,     key: 'artisans' },
  { label: 'All Bookings', icon: Ico.calendar, key: 'bookings' },
  { label: 'Transactions', icon: Ico.receipt,  key: 'payments' },
  { label: 'Dispute Log',  icon: Ico.scale,    key: 'disputes' },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalArtisans: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    totalPayments: 0,
    totalRevenue: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    totalReviews: 0,
    avgRating: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [
        { count: totalCustomers },
        { count: totalArtisans },
        { count: totalBookings },
        { count: completedBookings },
        { count: cancelledBookings },
        { count: pendingBookings },
        { count: openDisputes },
        { count: resolvedDisputes },
        { count: totalReviews },
        { data: payments },
        { data: reviews },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'artisan'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').in('status', ['held', 'released']),
        supabase.from('reviews').select('rating'),
      ])

      const totalRevenue = (payments || []).reduce(
        (sum: number, p: any) => sum + ((p.amount || 0) * 0.10), 0
      )
      const totalVolume = (payments || []).reduce(
        (sum: number, p: any) => sum + (p.amount || 0), 0
      )
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : 0

      setStats({
        totalCustomers:   totalCustomers   || 0,
        totalArtisans:    totalArtisans    || 0,
        totalBookings:    totalBookings    || 0,
        completedBookings:completedBookings|| 0,
        cancelledBookings:cancelledBookings|| 0,
        pendingBookings:  pendingBookings  || 0,
        totalPayments:    totalVolume, // Re-use totalPayments field as totalVolume
        totalRevenue,
        openDisputes:     openDisputes     || 0,
        resolvedDisputes: resolvedDisputes || 0,
        totalReviews:     totalReviews     || 0,
        avgRating:        Math.round(avgRating * 10) / 10,
      })
    } catch (e) {
      console.error('ReportsPage fetchStats error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const exportDataset = async (key: string, label: string) => {
    toast(`Preparing ${label} export…`, 'info')
    try {
      let headers: string[] = []
      let rows: (string | number)[][] = []

      if (key === 'users') {
        const { data } = await supabase.from('profiles').select('id, full_name, email, phone, role, created_at').order('created_at', { ascending: false })
        headers = ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Joined']
        rows = (data || []).map((u: any) => [u.id, `"${(u.full_name||'').replace(/"/g,'""')}"`, `"${(u.email||'')}"`, u.phone||'—', u.role, `"${new Date(u.created_at).toLocaleDateString()}"`])
      } else if (key === 'artisans') {
        const { data } = await supabase.from('artisan_profiles').select('user_id, trade_category, status, location, rating, created_at').order('created_at', { ascending: false })
        headers = ['User ID', 'Trade Category', 'Status', 'Location', 'Rating', 'Since']
        rows = (data || []).map((a: any) => [a.user_id, `"${(a.trade_category||'').replace(/"/g,'""')}"`, a.status, `"${(a.location||'').replace(/"/g,'""')}"`, a.rating||0, `"${new Date(a.created_at).toLocaleDateString()}"`])
      } else if (key === 'bookings') {
        const { data } = await supabase.from('bookings').select('id, title, status, address, scheduled_at, created_at').order('created_at', { ascending: false })
        headers = ['Ticket ID', 'Title', 'Status', 'Address', 'Scheduled', 'Created']
        rows = (data || []).map((b: any) => [b.id.slice(0,8).toUpperCase(), `"${(b.title||'').replace(/"/g,'""')}"`, b.status, `"${(b.address||'').replace(/"/g,'""')}"`, `"${new Date(b.scheduled_at).toLocaleString()}"`, `"${new Date(b.created_at).toLocaleDateString()}"`])
      } else if (key === 'payments') {
        const { data } = await supabase.from('payments').select('id, amount, platform_fee, artisan_payout, status, payment_method, created_at').order('created_at', { ascending: false })
        headers = ['TXN ID', 'Total (GHC)', 'Commission (GHC)', 'Payout (GHC)', 'Status', 'Method', 'Date']
        rows = (data || []).map((p: any) => [p.id.slice(0,8).toUpperCase(), p.amount||0, p.platform_fee||0, p.artisan_payout||0, p.status, p.payment_method||'—', `"${new Date(p.created_at).toLocaleDateString()}"`])
      } else if (key === 'disputes') {
        const { data } = await supabase.from('disputes').select('id, reason, description, status, created_at').order('created_at', { ascending: false })
        headers = ['Case ID', 'Reason', 'Description', 'Status', 'Date']
        rows = (data || []).map((d: any) => [d.id.slice(0,8).toUpperCase(), `"${(d.reason||'').replace(/"/g,'""')}"`, `"${(d.description||'').replace(/"/g,'""')}"`, d.status, `"${new Date(d.created_at).toLocaleDateString()}"`])
      }

      if (rows.length === 0) { toast('No data found to export', 'warning'); return }

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `crafthive_${key}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast(`${rows.length} ${label} record(s) exported`, 'success')
    } catch (err: any) {
      toast(`Export failed: ${err.message}`, 'error')
    }
  }

  const completionRate = stats.totalBookings > 0
    ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
    : 0

  const disputeResolutionRate = (stats.openDisputes + stats.resolvedDisputes) > 0
    ? Math.round((stats.resolvedDisputes / (stats.openDisputes + stats.resolvedDisputes)) * 100)
    : 0

  // ── Summary stat cards ───────────────────────────────────────────────────
  const summaryStats = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      delta: 'All time',
      deltaUp: true,
      bg: '#EEF1FB', color: '#1B2B6B',
      icon: Ico.users,
    },
    {
      label: 'Total Artisans',
      value: stats.totalArtisans.toLocaleString(),
      delta: 'All time',
      deltaUp: true,
      bg: '#fef9c3', color: '#a16207',
      icon: Ico.tool,
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      delta: 'All time',
      deltaUp: true,
      bg: '#dcfce7', color: '#15803d',
      icon: Ico.calendar,
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      delta: `${stats.completedBookings} completed`,
      deltaUp: completionRate >= 70,
      bg: '#dbeafe', color: '#1d4ed8',
      icon: Ico.checkCircle,
    },
  ]

  // ── Booking breakdown ────────────────────────────────────────────────────
  const bookingBreakdown = [
    { label: 'Completed', value: stats.completedBookings, color: '#15803d', bg: '#dcfce7' },
    { label: 'Pending',   value: stats.pendingBookings,   color: '#a16207', bg: '#fef9c3' },
    { label: 'Cancelled', value: stats.cancelledBookings, color: '#dc2626', bg: '#fee2e2' },
  ]

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E8EDF8',
    borderRadius: 12,
    padding: 20,
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B' }}>
            Reports & Analytics
          </h2>
          <p style={{ fontSize: 13, color: '#6B7494', marginTop: 2 }}>
            Platform performance overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Period toggle */}
          <div style={{
            display: 'flex', gap: 4, background: '#fff',
            border: '1px solid #E8EDF8', borderRadius: 10, padding: 4,
          }}>
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none',
                background: period === p ? '#1B2B6B' : 'transparent',
                color: period === p ? '#fff' : '#6B7494',
                cursor: 'pointer', fontSize: 12,
                fontWeight: period === p ? 600 : 400,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}>
                {p}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={fetchStats}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: '#fff',
              border: '1px solid #E8EDF8', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, color: '#1B2B6B',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.refresh}</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {summaryStats.map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: s.deltaUp ? '#15803d' : '#dc2626',
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                {s.deltaUp
                  ? <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.trendUp}</span>
                  : <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.trendDown}</span>
                }
              </span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#1B2B6B', lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </p>
            <p style={{ fontSize: 12, color: '#6B7494', marginTop: 4 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: '#6B7494', marginTop: 2 }}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          {
            label: 'Total Revenue',
            value: `GH₵ ${stats.totalRevenue.toLocaleString()}`,
            sub: 'Platform commission',
            color: '#15803d',
            icon: Ico.dollar,
            bg: '#dcfce7',
          },
          {
            label: 'Avg Rating',
            value: stats.avgRating > 0 ? `${stats.avgRating} / 5` : 'N/A',
            sub: `From ${stats.totalReviews} reviews`,
            color: '#a16207',
            icon: Ico.star,
            bg: '#fef9c3',
          },
          {
            label: 'Open Disputes',
            value: stats.openDisputes.toString(),
            sub: `${disputeResolutionRate}% resolution rate`,
            color: '#dc2626',
            icon: Ico.scale,
            bg: '#fee2e2',
          },
          {
            label: 'Transacted Volume',
            value: `GH₵ ${stats.totalPayments.toLocaleString()}`,
            sub: 'Total bookings paid',
            color: '#1d4ed8',
            icon: Ico.card,
            bg: '#dbeafe',
          },
        ].map(s => (
          <div key={s.label} style={{
            ...cardStyle,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: s.bg, color: s.color,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1B2B6B', lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </p>
              <p style={{ fontSize: 12, color: '#6B7494', marginTop: 3 }}>{s.label}</p>
              <p style={{ fontSize: 11, color: '#6B7494', marginTop: 1 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Booking trends */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B2B6B', marginBottom: 4 }}>
            Booking Trends
          </h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 20 }}>
            Monthly booking activity (projected)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_PLACEHOLDER}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
                borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12,
              }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="bookings" stroke="#1B2B6B"
                strokeWidth={2} dot={false} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* User growth */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B2B6B', marginBottom: 4 }}>
            User Growth
          </h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 20 }}>
            New registrations over time (projected)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_PLACEHOLDER}>
              <defs>
                <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B2B6B" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1B2B6B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="artGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB800" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
                borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12,
              }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="customers" stroke="#1B2B6B"
                fill="url(#custGrad)" strokeWidth={2} name="Customers" />
              <Area type="monotone" dataKey="artisans" stroke="#FFB800"
                fill="url(#artGrad)" strokeWidth={2} name="Artisans" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Booking breakdown + dispute summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Booking status breakdown */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B2B6B', marginBottom: 4 }}>
            Booking Breakdown
          </h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 20 }}>
            Status distribution of all {stats.totalBookings} bookings
          </p>

          {stats.totalBookings === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px 0', gap: 10,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: '#F5F7FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#D1D5DB',
              }}>
                {Ico.calendar}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2B6B' }}>No bookings yet</p>
              <p style={{ fontSize: 12, color: '#6B7494', textAlign: 'center' }}>
                Booking data will appear once customers start using the app.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookingBreakdown.map(b => {
                const pct = stats.totalBookings > 0
                  ? Math.round((b.value / stats.totalBookings) * 100)
                  : 0
                return (
                  <div key={b.label}>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-block', width: 10, height: 10,
                          borderRadius: 3, background: b.color, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 13, color: '#1B2B6B' }}>{b.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2B6B' }}>
                          {b.value}
                        </span>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: b.bg, color: b.color, fontWeight: 600,
                        }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      height: 6, borderRadius: 3,
                      background: '#F5F7FF', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: b.color,
                        width: `${pct}%`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Dispute summary */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B2B6B', marginBottom: 4 }}>
            Dispute Summary
          </h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 20 }}>
            Resolution performance
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Resolution rate ring placeholder */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 24,
            }}>
              {/* Simple donut */}
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <svg width={100} height={100} viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="38"
                    fill="none" stroke="#F5F7FF" strokeWidth="12" />
                  {/* Progress arc */}
                  <circle
                    cx="50" cy="50" r="38"
                    fill="none"
                    stroke={disputeResolutionRate >= 70 ? '#15803d' : '#dc2626'}
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - disputeResolutionRate / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B', lineHeight: 1 }}>
                    {disputeResolutionRate}%
                  </p>
                  <p style={{ fontSize: 9, color: '#6B7494', marginTop: 2, textAlign: 'center' }}>
                    Resolved
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Open',     value: stats.openDisputes,     bg: '#fee2e2', color: '#dc2626' },
                  { label: 'Resolved', value: stats.resolvedDisputes, bg: '#dcfce7', color: '#15803d' },
                  { label: 'Total',    value: stats.openDisputes + stats.resolvedDisputes, bg: '#EEF1FB', color: '#1B2B6B' },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 20,
                      background: d.bg, color: d.color, fontWeight: 600, minWidth: 70,
                      textAlign: 'center',
                    }}>
                      {d.label}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B' }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review stats */}
            <div style={{
              background: '#F5F7FF', borderRadius: 10,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#FFB800', display: 'flex', alignItems: 'center' }}>
                  {Ico.star}
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                    Average Rating
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7494', marginTop: 2 }}>
                    Across {stats.totalReviews} reviews
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#1B2B6B' }}>
                {stats.avgRating > 0 ? `${stats.avgRating}` : 'N/A'}
                {stats.avgRating > 0 && (
                  <span style={{ fontSize: 13, color: '#6B7494', fontWeight: 400 }}> / 5</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Export Centre ── */}
      <div style={cardStyle}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B2B6B' }}>
              Export Centre
            </h3>
            <p style={{ fontSize: 12, color: '#6B7494', marginTop: 2 }}>
              Download platform data as CSV or Excel
            </p>
          </div>
          <span style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20,
            background: '#EEF1FB', color: '#1B2B6B', fontWeight: 600,
          }}>
            {EXPORT_ITEMS.length} datasets
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {EXPORT_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => exportDataset(item.key, item.label)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 10,
                padding: '20px 12px', borderRadius: 12,
                border: '1px solid #E8EDF8',
                background: '#fff', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = '#1B2B6B'
                el.style.background = '#F5F7FF'
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = '0 4px 16px rgba(27,43,107,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = '#E8EDF8'
                el.style.background = '#fff'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#EEF1FB', color: '#1B2B6B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: 12, textAlign: 'center',
                color: '#1B2B6B', fontWeight: 600, lineHeight: 1.3,
              }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['CSV', 'Excel'].map(fmt => (
                  <span key={fmt} style={{
                    fontSize: 10, background: '#F5F7FF',
                    padding: '2px 7px', borderRadius: 20, color: '#6B7494',
                    border: '1px solid #E8EDF8',
                  }}>
                    {fmt}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}