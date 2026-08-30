'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Ico } from '../icons'
import { toast } from '../Toaster'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface MonthlyPoint { month: string; commission: number }
interface Stats {
  monthlyCommission: number
  totalBookings: number
  avgPerBooking: number
  rate: number
}

export default function CommissionsPage() {
  const [stats, setStats] = useState<Stats>({
    monthlyCommission: 0, totalBookings: 0, avgPerBooking: 0, rate: 10,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRate, setEditingRate] = useState(false)
  const [newRate, setNewRate] = useState('10')

  const fetchData = async () => {
    setLoading(true)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, platform_fee, created_at')
      .eq('status', 'released')

    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (payments) {
      const monthlyPayments = payments.filter(p =>
        new Date(p.created_at) >= monthStart
      )
      const monthlyCommission = monthlyPayments.reduce(
        (s, p) => s + (p.platform_fee || 0), 0
      )
      const bookingCount = totalBookings || 0
      const totalCommission = payments.reduce((s, p) => s + (p.platform_fee || 0), 0)

      setStats({
        monthlyCommission,
        totalBookings: bookingCount,
        avgPerBooking: bookingCount > 0 ? totalCommission / bookingCount : 0,
        rate: stats.rate,
      })

      // Group by month for chart (last 6 months)
      const grouped: Record<string, number> = {}
      payments.forEach(p => {
        const month = new Date(p.created_at)
          .toLocaleDateString('en-GH', { month: 'short' })
        grouped[month] = (grouped[month] || 0) + (p.platform_fee || 0)
      })

      const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const sorted = Object.entries(grouped)
        .sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
        .slice(-6)
        .map(([month, commission]) => ({ month, commission: Math.round(commission) }))

      setMonthlyData(sorted)
    }

    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveRate = () => {
    const r = parseFloat(newRate)
    if (isNaN(r) || r < 0 || r > 100) { toast('Invalid rate — must be between 0 and 100', 'error'); return }
    setStats(prev => ({ ...prev, rate: r }))
    setEditingRate(false)
    toast(`Commission rate updated to ${r}%`, 'success')
  }

  const exportToCSV = () => {
    if (monthlyData.length === 0) { toast('No commission data to export', 'error'); return }

    const headers = ['Month', 'Commission Earned (GHC)']
    const rows = monthlyData.map(m => [
      m.month,
      m.commission,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_commissions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Commission data exported', 'success')
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B' }}>Commission Settings</h2>
        <button
          onClick={exportToCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px',
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 8, cursor: 'pointer', fontSize: 13,
            color: '#6B7494', fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {Ico.download} Export CSV
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {/* Current rate card — navy border */}
        <div style={{
          background: '#fff', border: '2px solid #1B2B6B',
          borderRadius: 16, padding: 24,
          boxShadow: '0 4px 20px rgba(27,43,107,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: '#6B7494' }}>Current Rate</p>
              {editingRate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <input
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    type="number" min="0" max="100"
                    style={{
                      width: 72, background: '#F5F7FF', border: '1px solid #E8EDF8',
                      borderRadius: 8, padding: '6px 10px', fontSize: 28,
                      fontWeight: 800, color: '#1B2B6B', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#1B2B6B' }}>%</span>
                </div>
              ) : (
                <p style={{ fontSize: 40, fontWeight: 800, color: '#1B2B6B', marginTop: 4, lineHeight: 1 }}>
                  {stats.rate}%
                </p>
              )}
            </div>
            {editingRate ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={saveRate}
                  style={{
                    padding: '6px 14px', background: '#1B2B6B', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingRate(false)}
                  style={{
                    padding: '6px 12px', background: '#F5F7FF', color: '#6B7494',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingRate(true); setNewRate(String(stats.rate)) }}
                style={{
                  padding: '6px 14px', background: '#1B2B6B', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                Edit Rate
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6B7494' }}>
            Effective since 1 Jan 2026 · Requires Superadmin
          </p>
        </div>

        {/* Commission this month */}
        <div style={{ background: '#fff', border: '1px solid #E8EDF8', borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 6 }}>
            Commission Earned (This Month)
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#1B2B6B', letterSpacing: '-0.5px' }}>
            GH₵ {loading ? '—' : Math.round(stats.monthlyCommission).toLocaleString()}
          </p>
          <p style={{ fontSize: 12, color: '#16a34a', marginTop: 6 }}>
            Based on {stats.rate}% rate
          </p>
        </div>

        {/* Avg per booking */}
        <div style={{ background: '#fff', border: '1px solid #E8EDF8', borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 6 }}>
            Avg Commission / Booking
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#1B2B6B', letterSpacing: '-0.5px' }}>
            GH₵ {loading ? '—' : stats.avgPerBooking.toFixed(2)}
          </p>
          <p style={{ fontSize: 12, color: '#6B7494', marginTop: 6 }}>
            Based on {stats.totalBookings} completed bookings
          </p>
        </div>
      </div>

      {/* Monthly Commission chart */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 16 }}>
          Monthly Commission
        </h3>
        {monthlyData.length === 0 ? (
          <div style={{
            height: 220, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ color: '#E8EDF8' }}>{Ico.barChart}</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2B6B' }}>No commission data yet</p>
            <p style={{ fontSize: 13, color: '#6B7494' }}>
              Commission data will appear once payments are completed.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7494' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `₵${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E8EDF8', fontSize: 12 }}
                formatter={(v) => [`GH₵ ${Number(v ?? 0).toLocaleString()}`, 'Commission (GH₵)']}
              />
              <Bar dataKey="commission" fill="#FFB800" radius={[4, 4, 0, 0]} name="Commission (GH₵)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}