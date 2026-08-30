'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Ico } from '../icons'
import { Badge, EmptyState } from '../ui'
import { toast } from '../Toaster'

interface Payout {
  id: string
  amount: number
  platform_fee: number
  artisan_payout: number
  status: string
  payment_method: string
  created_at: string
  processed_at: string | null
  artisan_id: string
  artisan_name: string
  artisan_avatar?: string
  artisan_phone: string | null
  payout_ref: string
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchPayouts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at, artisan_id, platform_fee, artisan_payout')
      .in('status', ['held', 'released', 'refunded', 'failed'])
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const artisanIds = [...new Set(data.map((p: any) => p.artisan_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .in('id', artisanIds)

    const profileMap: Record<string, { name: string; phone: string | null; avatar?: string }> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = { name: p.full_name || '—', phone: p.phone, avatar: p.avatar_url } })

    const enriched: Payout[] = data.map((p: any, i: number) => ({
      id: p.id,
      payout_ref: `PO-${String(441 - i).padStart(3, '0')}`,
      amount: p.amount || 0,
      platform_fee: p.platform_fee || 0,
      artisan_payout: p.artisan_payout || 0,
      status: p.status,
      payment_method: p.payment_method || 'mtn_momo',
      created_at: p.created_at,
      processed_at: p.status === 'released' ? p.created_at : null,
      artisan_id: p.artisan_id,
      artisan_name: profileMap[p.artisan_id]?.name || '—',
      artisan_avatar: profileMap[p.artisan_id]?.avatar,
      artisan_phone: profileMap[p.artisan_id]?.phone || null,
    }))

    setPayouts(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchPayouts() }, [])

  const processOne = async (id: string, name: string, currentStatus: string) => {
    if (currentStatus === 'released') { toast(`${name} already completed`, 'info'); return }
    setProcessing(id)
    const { error } = await supabase
      .from('payments')
      .update({ status: 'released' })
      .eq('id', id)
    if (!error) {
      setPayouts(prev => prev.map(p =>
        p.id === id
          ? { ...p, status: 'released', processed_at: new Date().toISOString() }
          : p
      ))
      toast(`Payment released to ${name}`, 'success')
      await supabase.from('notifications').insert({
        user_id: payouts.find(p => p.id === id)?.artisan_id,
        title: 'Payment Released',
        body: `Your payment has been released to your account.`,
        type: 'payment',
      })
    }
    setProcessing(null)
  }

  const processAll = async () => {
    const pending = payouts.filter(p => p.status === 'held')
    if (!pending.length) { toast('No pending payouts', 'info'); return }
    if (!window.confirm(`Process ${pending.length} pending payouts?`)) return
    for (const p of pending) {
      await supabase.from('payments').update({ status: 'released' }).eq('id', p.id)
    }
    setPayouts(prev => prev.map(p =>
      p.status === 'held'
        ? { ...p, status: 'released', processed_at: new Date().toISOString() }
        : p
    ))
    toast(`${pending.length} payouts processed`, 'success')
  }

  const exportToCSV = () => {
    if (payouts.length === 0) { toast('No payouts to export', 'error'); return }

    const headers = ['Payout Ref', 'Artisan', 'MoMo Number', 'Total Paid (GHC)', 'Commission (GHC)', 'Artisan Payout (GHC)', 'Payment Method', 'Status', 'Requested Date', 'Processed Date']
    const rows = payouts.map(p => [
      p.payout_ref,
      `"${(p.artisan_name || '').replace(/"/g, '""')}"`,
      p.artisan_phone || '—',
      p.amount,
      p.platform_fee,
      p.artisan_payout,
      p.payment_method,
      p.status,
      `"${new Date(p.created_at).toLocaleDateString()}"`,
      p.processed_at ? `"${new Date(p.processed_at).toLocaleDateString()}"` : '—',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_payouts_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`${payouts.length} payout record(s) exported`, 'success')
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      held: 'Pending', released: 'Completed',
      refunded: 'Refunded', failed: 'Failed',
    }
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1)
  }

  const pendingTotal = payouts
    .filter(p => p.status === 'held')
    .reduce((s, p) => s + p.artisan_payout, 0)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B6B' }}>Artisan Payouts</h2>
          <p style={{ fontSize: 13, color: '#6B7494', marginTop: 2 }}>
            {payouts.filter(p => p.status === 'held').length} pending payouts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={exportToCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', background: '#fff',
              border: '1px solid #E2E8F0', borderRadius: 10,
              cursor: 'pointer', fontSize: 13, color: '#6B7494', fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={processAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', background: '#1B2B6B', color: '#fff',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            {Ico.refresh} Process All Pending
          </button>
        </div>
      </div>

      {pendingTotal > 0 && (
        <div style={{
          background: '#fef9c3', border: '1px solid #fde68a',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#a16207', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {Ico.warning}
          GH₵ {pendingTotal.toLocaleString()} in escrow pending release to artisans
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading payouts...
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No payouts yet"
          message="Artisan payouts will appear here once jobs are completed."
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
                {['Payout ID', 'Artisan', 'Total Paid', 'Commission (10%)', 'Payout Amount', 'MoMo Number', 'Status', 'Requested', 'Processed', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: 11, fontWeight: 700, color: '#6B7494',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: i === payouts.length - 1 ? 'none' : '1px solid #E8EDF8',
                    background: '#fff',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1B2B6B' }}>
                    {p.payout_ref}
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                          {p.artisan_avatar ? (
                            <img src={p.artisan_avatar} alt={p.artisan_name} style={{ width: 34, height: 34, borderRadius: 34, objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: 34, height: 34, borderRadius: 34,
                              background: '#FFB800', color: '#1B2B6B',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                            }}>
                              {getInitials(p.artisan_name)}
                            </div>
                          )}
                          <div style={{
                            position: 'absolute', bottom: -2, right: -2,
                            width: 12, height: 12, borderRadius: 12,
                            background: p.status === 'released' ? '#16a34a' : p.status === 'held' ? '#FFB800' : '#dc2626',
                            border: '2px solid #fff',
                          }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B6B', letterSpacing: '-0.3px' }}>
                            {p.artisan_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7494', marginTop: 1 }}>
                            {p.artisan_phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#6B7494' }}>
                    GH₵ {p.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                    GH₵ {p.platform_fee.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                    GH₵ {p.artisan_payout.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#6B7494' }}>
                    {p.artisan_phone || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge status={getStatusLabel(p.status)} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7494' }}>
                    {formatDate(p.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7494' }}>
                    {formatDate(p.processed_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => processOne(p.id, p.artisan_name, p.status)}
                        disabled={processing === p.id || p.status === 'released'}
                        style={{
                          padding: '5px 14px', background: p.status === 'released' ? '#F5F7FF' : '#1B2B6B',
                          color: p.status === 'released' ? '#6B7494' : '#fff',
                          border: 'none', borderRadius: 7,
                          cursor: p.status === 'released' ? 'not-allowed' : 'pointer',
                          fontSize: 12, fontWeight: 600,
                          opacity: processing === p.id ? 0.7 : 1,
                        }}
                      >
                        {processing === p.id ? '...' : 'Process'}
                      </button>
                      <button
                        onClick={() => {
                          fetchPayouts()
                          toast('Refreshed', 'info')
                        }}
                        style={{
                          padding: 6, background: '#F5F7FF', border: 'none',
                          borderRadius: 7, cursor: 'pointer', color: '#6B7494',
                          display: 'flex', alignItems: 'center',
                        }}
                        title="Refresh"
                      >
                        {Ico.refresh}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}