'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Ico } from '../icons'
import { Badge, EmptyState } from '../ui'
import { toast } from '../Toaster'

interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  booking_id: string
  customer_name: string
  customer_avatar?: string
  artisan_name: string
  artisan_avatar?: string
  ticket_number: string
  platform_fee: number
  artisan_payout: number
}

interface Stats {
  totalRevenue: number
  totalPayouts: number
  pendingPayouts: number
  refundsIssued: number
  pendingCount: number
  refundCount: number
}

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    refundsIssued: 0,
    pendingCount: 0,
    refundCount: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchPayments = async () => {
    setLoading(true)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at, booking_id, customer_id, artisan_id, platform_fee, artisan_payout')
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Batch fetch profiles — no N+1
    const userIds = Array.from(new Set([
      ...data.map((p: any) => p.customer_id),
      ...data.map((p: any) => p.artisan_id),
    ].filter(Boolean)))

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap: Record<string, { name: string, avatar: string }> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = { name: p.full_name || '—', avatar: p.avatar_url } })

    // Batch fetch booking ticket numbers
    const bookingIds = [...new Set(data.map((p: any) => p.booking_id).filter(Boolean))]
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .in('id', bookingIds)

    const bookingMap: Record<string, string> = {}
    bookings?.forEach((b: any) => { bookingMap[b.id] = b.id.slice(0,8).toUpperCase() })

    const enriched: Payment[] = data.map((p: any) => ({
      id: p.id,
      amount: p.amount || 0,
      status: p.status,
      payment_method: p.payment_method || '—',
      created_at: p.created_at,
      booking_id: p.booking_id,
      customer_name: profileMap[p.customer_id]?.name || '—',
      customer_avatar: profileMap[p.customer_id]?.avatar,
      artisan_name: profileMap[p.artisan_id]?.name || '—',
      artisan_avatar: profileMap[p.artisan_id]?.avatar,
      ticket_number: 'BK-' + bookingMap[p.booking_id] || '—',
      platform_fee: p.platform_fee || 0,
      artisan_payout: p.artisan_payout || 0,
    }))

    setPayments(enriched)

    const thisMonth = data.filter((p: any) => new Date(p.created_at) >= monthStart)

    setStats({
      totalRevenue: thisMonth.reduce((s: number, p: any) => s + (p.platform_fee || 0), 0),
      totalPayouts: data.filter((p: any) => p.status === 'released').reduce((s: number, p: any) => s + (p.artisan_payout || 0), 0),
      pendingPayouts: data.filter((p: any) => p.status === 'held').reduce((s: number, p: any) => s + (p.artisan_payout || 0), 0),
      refundsIssued: data.filter((p: any) => p.status === 'refunded').reduce((s: number, p: any) => s + (p.amount || 0), 0),
      pendingCount: data.filter((p: any) => p.status === 'held').length,
      refundCount: data.filter((p: any) => p.status === 'refunded').length,
    })

    setLoading(false)
  }

  useEffect(() => { fetchPayments() }, [])

  const exportToCSV = () => {
    if (payments.length === 0) { toast('No transactions to export', 'error'); return }

    const headers = ['TXN ID', 'Booking Ticket', 'Customer', 'Artisan', 'Total Paid (GHC)', 'Commission 10% (GHC)', 'Artisan Payout (GHC)', 'Payment Method', 'Status', 'Date']
    const rows = payments.map(p => [
      p.id.slice(0, 8).toUpperCase(),
      p.ticket_number,
      `"${(p.customer_name || '').replace(/"/g, '""')}"`,
      `"${(p.artisan_name || '').replace(/"/g, '""')}"`,
      p.amount,
      p.platform_fee,
      p.artisan_payout,
      p.payment_method,
      p.status,
      `"${new Date(p.created_at).toLocaleDateString()}"`
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_transactions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`${payments.length} transaction(s) exported`, 'success')
  }

  const formatMethod = (m: string) => {
    const map: Record<string, string> = {
      mtn_momo: 'MoMo',
      telecel_cash: 'Telecel',
      card: 'Card',
      stripe: 'Stripe',
    }
    return map[m] || m
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      completed: 'Success',
      held: 'Pending',
      released: 'Released',
      refunded: 'Refunded',
      failed: 'Failed',
    }
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Revenue (Month)',
            value: `GH₵ ${stats.totalRevenue.toLocaleString()}`,
            sub: 'This month (Commissions)',
            valColor: '#1B2B6B',
            subColor: '#16a34a',
          },
          {
            label: 'Total Payouts',
            value: `GH₵ ${stats.totalPayouts.toLocaleString()}`,
            sub: 'Released to artisans',
            valColor: '#1B2B6B',
            subColor: '#6B7494',
          },
          {
            label: 'Pending Payouts',
            value: `GH₵ ${stats.pendingPayouts.toLocaleString()}`,
            sub: `${stats.pendingCount} artisans waiting`,
            valColor: '#a16207',
            subColor: '#a16207',
          },
          {
            label: 'Refunds Issued',
            value: `GH₵ ${stats.refundsIssued.toLocaleString()}`,
            sub: `${stats.refundCount} refunds`,
            valColor: '#dc2626',
            subColor: '#6B7494',
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff',
            border: '1px solid #E8EDF8',
            borderRadius: 12,
            padding: 16,
          }}>
            <p style={{ fontSize: 12, color: '#6B7494', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.valColor, letterSpacing: '-0.5px' }}>
              {s.value}
            </p>
            <p style={{ fontSize: 12, marginTop: 4, color: s.subColor }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1B2B6B' }}>
          Transactions
        </h2>
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
          ⬇ Export CSV
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading transactions...
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No transactions yet"
          message="Transactions will appear once customers complete bookings and payments."
        />
      ) : (
        <div style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F5F7FF', borderBottom: '1px solid #E8EDF8' }}>
                {['TXN ID', 'Booking', 'Customer', 'Artisan', 'Total Paid', 'Commission (10%)', 'Artisan Payout', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 16,
                    paddingRight: 16,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7494',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: i === payments.length - 1 ? 'none' : '1px solid #E8EDF8',
                      background: '#fff',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1B2B6B' }}>
                      {p.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 11, color: '#6B7494' }}>
                      {p.ticket_number}
                    </td>
                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.customer_avatar ? (
                          <img src={p.customer_avatar} alt={p.customer_name} style={{ width: 32, height: 32, borderRadius: 32, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: 32,
                            background: '#111D4A', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600, fontFamily: 'monospace', flexShrink: 0,
                          }}>
                            {getInitials(p.customer_name)}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                          {p.customer_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.artisan_avatar ? (
                          <img src={p.artisan_avatar} alt={p.artisan_name} style={{ width: 32, height: 32, borderRadius: 32, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: 32,
                            background: '#FFB800', color: '#1B2B6B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600, fontFamily: 'monospace', flexShrink: 0,
                          }}>
                            {getInitials(p.artisan_name)}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                          {p.artisan_name}
                        </span>
                      </div>
                    </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#6B7494' }}>
                    GH₵ {p.amount.toLocaleString()}
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 12, color: '#dc2626' }}>
                    GH₵ {p.platform_fee.toLocaleString()}
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                    GH₵ {p.artisan_payout.toLocaleString()}
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <span style={{
                      fontSize: 11,
                      background: '#EEF1FB',
                      color: '#1B2B6B',
                      paddingTop: 2,
                      paddingBottom: 2,
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderRadius: 6,
                      fontFamily: 'monospace',
                    }}>
                      {formatMethod(p.payment_method)}
                    </span>
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <Badge status={getStatusLabel(p.status)} />
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontSize: 12, color: '#6B7494' }}>
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, borderTop: '1px solid #E8EDF8', fontSize: 12, color: '#6B7494' }}>
            {payments.length} transaction{payments.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}