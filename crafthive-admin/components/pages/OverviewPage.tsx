'use client'
import { useEffect, useState, useRef } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Ico } from '../icons'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface DBStats {
  totalCustomers: number
  totalArtisans: number
  approvedArtisans: number
  pendingArtisans: number
  activeBookings: number
  openDisputes: number
  newReviews: number
  completedJobs: number
  totalBookings: number
  revenueToday: number
  todayTxCount: number
}

interface RevenuePoint { label: string; revenue: number }
interface GrowthPoint { month: string; customers: number; artisans: number }
interface CategoryPoint { name: string; value: number; color: string }
interface ActivityItem { type: string; text: string; sub: string; time: string }

const CATEGORY_COLORS = [
  '#1B2B6B', '#FFB800', '#4CAF50',
  '#FF6B35', '#7C3AED', '#94A3B8',
]

const activityStyle: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  booking: { bg: '#dbeafe', color: '#1d4ed8', icon: Ico.calendar },
  kyc: { bg: '#fef9c3', color: '#a16207', icon: Ico.shield },
  payment: { bg: '#dcfce7', color: '#15803d', icon: Ico.card },
  dispute: { bg: '#fee2e2', color: '#dc2626', icon: Ico.scale },
  user: { bg: '#f3e8ff', color: '#7c3aed', icon: Ico.users },
  review: { bg: '#fef3c7', color: '#d97706', icon: Ico.star },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TrendArrow({ dir }: { dir: 'up' | 'down' }) {
  return dir === 'up' ? (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ) : (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
    }}>
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none"
        stroke="#E8EDF8" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>No data yet</p>
      <p style={{ fontSize: 12, color: '#6B7494', textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  )
}

export default function OverviewPage({ isGuest = false }: { isGuest?: boolean }) {
  const [revRange, setRevRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [dbStats, setDbStats] = useState<DBStats | null>(null)
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([])
  const [growthChart, setGrowthChart] = useState<GrowthPoint[]>([])
  const [categoryChart, setCategoryChart] = useState<CategoryPoint[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  // Prevent double-fetch on mount when revRange useEffect fires
  const mountedRef = useRef(false)

  // ── Activity feed — fixed FK aliases + Promise.all ──────────────────────────
  const fetchActivityFeed = async () => {
    const timeAgo = (d: string) => {
      const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      return `${Math.floor(diff / 86400)}d ago`
    }

    try {
      const [
        { data: bookingsData },
        { data: kycData },
        { data: paymentsData },
        { data: disputesData },
        { data: newArtisansData },
        { data: reviewsData },
      ] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(2),
        supabase.from('artisan_profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(1),
        supabase.from('payments').select('*').eq('status', 'released').order('created_at', { ascending: false }).limit(1),
        supabase.from('disputes').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('artisan_profiles').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('reviews').select('*').eq('rating', 5).order('created_at', { ascending: false }).limit(1),
      ])

      // Gather profile IDs to fetch in one batch
      const profileIds = new Set<string>()
      bookingsData?.forEach((b: any) => {
        if (b.customer_id) profileIds.add(b.customer_id)
        if (b.artisan_id) profileIds.add(b.artisan_id)
      })
      kycData?.forEach((k: any) => { if (k.user_id) profileIds.add(k.user_id) })
      paymentsData?.forEach((p: any) => { if (p.artisan_id) profileIds.add(p.artisan_id) })
      disputesData?.forEach((d: any) => { if (d.raised_by) profileIds.add(d.raised_by) })
      newArtisansData?.forEach((a: any) => { if (a.user_id) profileIds.add(a.user_id) })
      reviewsData?.forEach((r: any) => { if (r.artisan_id) profileIds.add(r.artisan_id) })

      // Gather artisan profile IDs to map trade categories
      const artisanUserIds = new Set<string>()
      bookingsData?.forEach((b: any) => { if (b.artisan_id) artisanUserIds.add(b.artisan_id) })

      const [profilesRes, artisansRes] = await Promise.all([
        profileIds.size > 0 
          ? supabase.from('profiles').select('id, full_name').in('id', [...profileIds])
          : Promise.resolve({ data: [] }),
        artisanUserIds.size > 0 
          ? supabase.from('artisan_profiles').select('user_id, trade_category').in('user_id', [...artisanUserIds])
          : Promise.resolve({ data: [] })
      ])

      const profileMap = (profilesRes.data || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.full_name
        return acc
      }, {})

      const artisanMap = (artisansRes.data || []).reduce((acc: any, a: any) => {
        acc[a.user_id] = a.trade_category
        return acc
      }, {})

      const items: ActivityItem[] = []

      bookingsData?.forEach((b: any) => {
        items.push({
          type: 'booking',
          text: `Booking BK-${b.id.slice(0, 8).toUpperCase()}`,
          sub: `${profileMap[b.customer_id] || '—'} → ${profileMap[b.artisan_id] || '—'} · ${artisanMap[b.artisan_id] || '—'}`,
          time: timeAgo(b.created_at),
        })
      })

      kycData?.forEach((k: any) => {
        items.push({
          type: 'kyc',
          text: `KYC submitted by ${profileMap[k.user_id] || 'Artisan'}`,
          sub: `${k.trade_category || '—'} · Awaiting review`,
          time: timeAgo(k.created_at),
        })
      })

      paymentsData?.forEach((p: any) => {
        items.push({
          type: 'payment',
          text: `Payment released for BK-${(p.booking_id || '').slice(0, 8).toUpperCase()}`,
          sub: `GH₵ ${(p.amount ?? 0).toLocaleString()} to ${profileMap[p.artisan_id] || '—'}`,
          time: timeAgo(p.created_at),
        })
      })

      disputesData?.forEach((d: any) => {
        items.push({
          type: 'dispute',
          text: `Dispute raised on BK-${(d.booking_id || '').slice(0, 8).toUpperCase()}`,
          sub: `${profileMap[d.raised_by] || '—'} · ${d.reason || '—'}`,
          time: timeAgo(d.created_at),
        })
      })

      newArtisansData?.forEach((a: any) => {
        items.push({
          type: 'user',
          text: 'New artisan registered',
          sub: `${profileMap[a.user_id] || '—'} · ${a.trade_category || '—'}`,
          time: timeAgo(a.created_at),
        })
      })

      reviewsData?.forEach((r: any) => {
        items.push({
          type: 'review',
          text: `${r.rating}-star review posted`,
          sub: `${profileMap[r.artisan_id] || '—'} · BK-${(r.booking_id || '').slice(0, 8).toUpperCase()}`,
          time: timeAgo(r.created_at),
        })
      })

      setActivityFeed(items.slice(0, 6))

    } catch (err) {
      console.warn('fetchActivityFeed error:', err)
      setActivityFeed([])
    }
  }

  // ── Revenue chart ────────────────────────────────────────────────────────────
  const fetchRevenueChart = async (range: '7d' | '30d' | '90d') => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data } = await supabase
      .from('payments')
      .select('amount, created_at')
      .in('status', ['held', 'released'])
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (!data || data.length === 0) { setRevenueChart([]); return }

    const grouped: Record<string, number> = {}
    data.forEach((p: { amount?: number; created_at: string }) => {
      const d = new Date(p.created_at)
      const label = range === '7d'
        ? d.toLocaleDateString('en-GH', { weekday: 'short' })
        : d.toLocaleDateString('en-GH', { month: 'short', day: range === '30d' ? 'numeric' : undefined })
      grouped[label] = (grouped[label] ?? 0) + ((p.amount ?? 0) * 0.10)
    })

    setRevenueChart(Object.entries(grouped).map(([label, revenue]) => ({ label, revenue })))
  }

  // ── User growth chart ────────────────────────────────────────────────────────
  const fetchGrowthChart = async () => {
    const since = new Date(Date.now() - 180 * 86400000).toISOString()

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('role, created_at')
      .in('role', ['customer', 'artisan'])
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (!profileRows || profileRows.length === 0) { setGrowthChart([]); return }

    const grouped: Record<string, { customers: number; artisans: number }> = {}
    profileRows.forEach((p: { role: string; created_at: string }) => {
      const month = new Date(p.created_at).toLocaleDateString('en-GH', { month: 'short' })
      if (!grouped[month]) grouped[month] = { customers: 0, artisans: 0 }
      if (p.role === 'customer') grouped[month].customers++
      else grouped[month].artisans++
    })

    setGrowthChart(
      Object.entries(grouped).map(([month, v]) => ({
        month, customers: v.customers, artisans: v.artisans,
      }))
    )
  }

  // ── Category chart ───────────────────────────────────────────────────────────
  const fetchCategoryChart = async () => {
    const { data } = await supabase
      .from('artisan_profiles')
      .select('trade_category')
      .eq('status', 'approved')

    if (!data || data.length === 0) { setCategoryChart([]); return }

    const counts: Record<string, number> = {}
    data.forEach((r: { trade_category: string }) => {
      if (r.trade_category) counts[r.trade_category] = (counts[r.trade_category] ?? 0) + 1
    })

    const total = Object.values(counts).reduce((s, v) => s + v, 0)
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)

    setCategoryChart(
      sorted.map(([name, count], i) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
    )
  }

  // ── Main stats fetch ─────────────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoading(true)
    try {
      const [
        { count: customers },
        { count: artisans },
        { count: approvedArtisans },
        { count: pendingArtisans },
        { count: activeBookings },
        { count: openDisputes },
        { count: newReviews },
        { count: completedJobs },
        { count: totalBookings },
        { data: todayPayments },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'artisan'),
        supabase.from('artisan_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('artisan_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').in('status', ['held', 'released']).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ])

      setDbStats({
        totalCustomers: customers ?? 0,
        totalArtisans: artisans ?? 0,
        approvedArtisans: approvedArtisans ?? 0,
        pendingArtisans: pendingArtisans ?? 0,
        activeBookings: activeBookings ?? 0,
        openDisputes: openDisputes ?? 0,
        newReviews: newReviews ?? 0,
        completedJobs: completedJobs ?? 0,
        totalBookings: totalBookings ?? 0,
        revenueToday: (todayPayments ?? []).reduce((s: number, p: { amount?: number }) => s + ((p.amount ?? 0) * 0.10), 0),
        todayTxCount: (todayPayments ?? []).length,
      })

      // Fire all chart fetches in parallel
      await Promise.all([
        fetchRevenueChart(revRange),
        fetchGrowthChart(),
        fetchCategoryChart(),
        fetchActivityFeed(),
      ])

    } catch (e) {
      console.error('OverviewPage stats error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch revenue chart when range tab changes (not on mount — fetchStats handles that)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    fetchRevenueChart(revRange)
  }, [revRange])

  // Initial load
  useEffect(() => { fetchStats() }, [])

  // Live refresh — activity feed every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { fetchActivityFeed() }, 30000)
    return () => clearInterval(interval)
  }, [])

  const completionRate =
    dbStats && dbStats.totalBookings > 0
      ? ((dbStats.completedJobs / dbStats.totalBookings) * 100).toFixed(1)
      : '0.0'

  // ── Primary stat card ─────────────────────────────────────────────────────────
  const PrimaryCard = ({
    label, value, sub, trend, icon, accent,
  }: {
    label: string; value: string; sub: string
    trend: { dir: 'up' | 'down'; val: string }
    icon: React.ReactNode; accent?: boolean
  }) => (
    <div style={{
      background: accent ? '#1B2B6B' : '#fff',
      border: accent ? 'none' : '1px solid #E8EDF8',
      borderRadius: 14,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 20,
      paddingRight: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: accent ? 'rgba(255,255,255,0.12)' : '#EEF1FB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent ? '#FFB800' : '#1B2B6B',
        }}>
          {icon}
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: trend.dir === 'up' ? '#16a34a' : '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <TrendArrow dir={trend.dir} />
          {trend.val}
        </span>
      </div>
      <div>
        <p style={{
          fontSize: 28,
          fontWeight: 800,
          color: accent ? '#fff' : '#1B2B6B',
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}>
          {value}
        </p>
        <p style={{
          fontSize: 13,
          color: accent ? 'rgba(255,255,255,0.65)' : '#6B7494',
          marginTop: 6,
          fontWeight: 500,
        }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.45)' : '#6B7494' }}>
        {sub}
      </p>
    </div>
  )

  return (
    <div style={{
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>

      {/* ── Row 1: Primary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <PrimaryCard
          label="Total Users"
          value={loading ? '—' : (dbStats ? (dbStats.totalCustomers + dbStats.totalArtisans).toLocaleString() : '0')}
          sub="Customers + Artisans"
          trend={{ dir: 'up', val: '+12.4%' }}
          icon={Ico.users}
          accent
        />
        <PrimaryCard
          label="Total Artisans"
          value={loading ? '—' : String(dbStats?.totalArtisans ?? 0)}
          sub={loading ? '—' : `${dbStats?.approvedArtisans ?? 0} approved · ${dbStats?.pendingArtisans ?? 0} pending`}
          trend={{ dir: 'up', val: '+8.2%' }}
          icon={Ico.tool}
        />
        <PrimaryCard
          label="Active Bookings"
          value={loading ? '—' : String(dbStats?.activeBookings ?? 0)}
          sub="Real-time count"
          trend={{ dir: 'up', val: '+3.1%' }}
          icon={Ico.calendar}
        />
        <PrimaryCard
          label="Revenue Today"
          value={loading ? '—' : `GH₵ ${(dbStats?.revenueToday ?? 0).toLocaleString()}`}
          sub={loading ? '—' : `Across ${dbStats?.todayTxCount ?? 0} transactions`}
          trend={{ dir: 'up', val: '+18.6%' }}
          icon={Ico.card}
        />
      </div>

      {/* ── Row 2: Secondary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          {
            icon: Ico.shield, bg: '#fef9c3', iconColor: '#a16207',
            value: loading ? '—' : String(dbStats?.pendingArtisans ?? 0),
            label: 'Pending KYC',
            badge: 'Action needed', badgeBg: '#fef9c3', badgeColor: '#a16207',
          },
          {
            icon: Ico.scale, bg: '#fee2e2', iconColor: '#dc2626',
            value: loading ? '—' : String(dbStats?.openDisputes ?? 0),
            label: 'Open Disputes',
            badge: 'Urgent', badgeBg: '#fee2e2', badgeColor: '#dc2626',
          },
          {
            icon: Ico.star, bg: '#f3e8ff', iconColor: '#7c3aed',
            value: loading ? '—' : String(dbStats?.newReviews ?? 0),
            label: 'New Reviews',
            badge: 'This week', badgeBg: '#f3e8ff', badgeColor: '#7c3aed',
          },
          {
            icon: Ico.checkCircle, bg: '#dcfce7', iconColor: '#15803d',
            value: loading ? '—' : `${completionRate}%`,
            label: 'Completion Rate',
            badge: null, badgeBg: '', badgeColor: '',
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff',
            border: '1px solid #E8EDF8',
            borderRadius: 14,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: s.bg,
              color: s.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#1B2B6B', lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 12, color: '#6B7494', marginTop: 4 }}>{s.label}</p>
            </div>
            {s.badge ? (
              <span style={{
                fontSize: 11,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 9,
                paddingRight: 9,
                borderRadius: 20,
                background: s.badgeBg,
                color: s.badgeColor,
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {s.badge}
              </span>
            ) : (
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                {Ico.trendUp}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Row 3: Revenue chart + Top Categories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Revenue Overview */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EDF8',
          borderRadius: 14,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15 }}>Revenue Overview</h3>
              <p style={{ fontSize: 12, color: '#6B7494', marginTop: 3 }}>Total earnings across the platform</p>
            </div>
            <div style={{ display: 'flex', gap: 2, background: '#F5F7FF', borderRadius: 8, paddingTop: 3, paddingBottom: 3, paddingLeft: 3, paddingRight: 3 }}>
              {(['7d', '30d', '90d'] as const).map(r => (
                <button key={r} onClick={() => setRevRange(r)} style={{
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: revRange === r ? '#1B2B6B' : 'transparent',
                  color: revRange === r ? '#fff' : '#6B7494',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {revenueChart.length === 0 ? (
            <div style={{ height: 200 }}>
              <EmptyChart message="Revenue data will appear once payments are completed." />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B2B6B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1B2B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7494' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7494' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₵${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12 }} formatter={(v) => [`GH₵ ${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#1B2B6B" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Categories */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EDF8',
          borderRadius: 14,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <h3 style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15, marginBottom: 3 }}>Top Categories</h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 14 }}>Approved artisans by trade</p>

          {categoryChart.length === 0 ? (
            <div style={{ height: 200 }}>
              <EmptyChart message="Approve artisans in KYC Queue to see category breakdown." />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={2} dataKey="value">
                    {categoryChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12 }} formatter={(v) => [`${Number(v ?? 0)}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {categoryChart.slice(0, 4).map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: c.color }} />
                    <span style={{ color: '#6B7494', flex: 1 }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: '#1B2B6B' }}>{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 4: User Growth + Live Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* User Growth */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EDF8',
          borderRadius: 14,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <h3 style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15, marginBottom: 3 }}>User Growth</h3>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 16 }}>New registrations over 6 months</p>

          {growthChart.length === 0 ? (
            <div style={{ height: 180 }}>
              <EmptyChart message="Registration data will appear as users sign up." />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={growthChart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7494' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7494' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: '#6B7494', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="customers" fill="#1B2B6B" radius={[4, 4, 0, 0]} name="customers" />
                <Bar dataKey="artisans" fill="#FFB800" radius={[4, 4, 0, 0]} name="artisans" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Live Activity */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EDF8',
          borderRadius: 14,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15 }}>Live Activity</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: '#16a34a',
                boxShadow: '0 0 0 3px rgba(22,163,74,0.2)',
                display: 'inline-block',
              }} />
              Live
            </div>
          </div>

          {activityFeed.length === 0 ? (
            <div style={{ height: 200 }}>
              <EmptyChart message="Activity will appear as bookings, KYC and payments come in." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activityFeed.map((item, i) => {
                const style = activityStyle[item.type] ?? activityStyle.booking
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: style.bg,
                      color: style.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {style.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#1B2B6B',
                        lineHeight: 1.4,
                        marginBottom: 2,
                      }}>
                        {item.text}
                      </p>
                      <p style={{
                        fontSize: 11,
                        color: '#6B7494',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.sub}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: '#6B7494', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {item.time}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}