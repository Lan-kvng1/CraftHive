'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Avatar, Badge, PageHeader, EmptyState } from '../ui'
import { Ico } from '../icons'
import { toast } from '../Toaster'

interface Dispute {
  id: string
  reason: string
  description: string
  status: string
  created_at: string
  raised_by: string
  booking: {
    ticket_number: string
    service_description: string
    customer: { full_name: string }
    artisan: { full_name: string }
  }
  raised_by_profile: { full_name: string }
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [notes, setNotes] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => { fetchDisputes() }, [])

  const exportToCSV = () => {
    if (disputes.length === 0) { toast('No disputes to export', 'error'); return }

    const headers = ['Case ID', 'Status', 'Raised By', 'Customer', 'Artisan', 'Booking Ticket', 'Reason', 'Description', 'Date']
    const rows = disputes.map(d => [
      d.id.slice(0, 8).toUpperCase(),
      d.status,
      `"${((d as any).raised_by_profile?.full_name || '').replace(/"/g, '""')}"`,
      `"${((d.booking as any)?.customer?.full_name || '').replace(/"/g, '""')}"`,
      `"${((d.booking as any)?.artisan?.full_name || '').replace(/"/g, '""')}"`,
      (d.booking as any)?.ticket_number || '—',
      `"${(d.reason || '').replace(/"/g, '""')}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
      `"${new Date(d.created_at).toLocaleDateString()}"`
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_disputes_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`${disputes.length} dispute(s) exported`, 'success')
  }

  const fetchDisputes = async () => {
    setLoading(true)
    const { data: disputesData, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Disputes fetch error:', error.message)
      setDisputes([])
      setLoading(false)
      return
    }

    if (disputesData && disputesData.length > 0) {
      // Get all booking IDs
      const bookingIds = [...new Set(disputesData.map((d: any) => d.booking_id).filter(Boolean))]
      
      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, title, description, customer_id, artisan_id')
        .in('id', bookingIds)

      const bookingsMap = (bookingsData || []).reduce((acc: any, b: any) => {
        acc[b.id] = b
        return acc
      }, {})

      // Collect all user/profile IDs to batch fetch
      const profileIds = [...new Set([
        ...disputesData.map((d: any) => d.raised_by),
        ...(bookingsData || []).map((b: any) => b.customer_id),
        ...(bookingsData || []).map((b: any) => b.artisan_id)
      ].filter(Boolean))]

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.full_name
        return acc
      }, {})

      const enriched = disputesData.map((d: any) => {
        const b = bookingsMap[d.booking_id] || {}
        return {
          ...d,
          booking: {
            id: b.id || '',
            ticket_number: b.id ? b.id.slice(0, 8).toUpperCase() : '—',
            service_description: b.title || b.description || '—',
            customer: { full_name: profileMap[b.customer_id] || '—' },
            artisan: { full_name: profileMap[b.artisan_id] || '—' }
          },
          raised_by_profile: { full_name: profileMap[d.raised_by] || '—' }
        }
      })
      setDisputes(enriched)
    } else {
      setDisputes([])
    }
    setLoading(false)
  }

  const resolveDispute = async () => {
    if (!active || !resolution) return
    setResolving(true)
    const { error } = await supabase
      .from('disputes')
      .update({ status: 'resolved' })
      .eq('id', active.id)
    if (!error) {
      setDisputes(prev => prev.map(d => d.id === active.id ? { ...d, status: 'resolved' } : d))
      toast(`Dispute ${active.id.slice(0, 8)} resolved: ${resolution}`, 'success')
      setActive(null)
      setResolution('')
      setNotes('')
    }
    setResolving(false)
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const RESOLUTIONS = [
    { label: 'Full Refund to Customer', icon: '↩️' },
    { label: 'Release Payment to Artisan', icon: '💸' },
    { label: 'Partial Refund', icon: '⚖️' },
    { label: 'Request More Info', icon: '💬' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Disputes Resolution"
        subtitle={`${disputes.filter(d => d.status === 'open').length} open disputes`}
        actions={
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
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <EmptyState icon={Ico.scale} title="No disputes" message="All disputes will appear here when raised by customers or artisans." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: active ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Dispute list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disputes.map(d => (
              <div
                key={d.id}
                onClick={() => { setActive(active?.id === d.id ? null : d); setResolution(''); setNotes('') }}
                style={{
                  background: '#fff',
                  border: `2px solid ${active?.id === d.id ? '#1B2B6B' : '#E8EDF8'}`,
                  borderRadius: 14, padding: 20, cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#1B2B6B' }}>
                      #{d.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge status={d.status === 'open' ? 'Open' : d.status === 'resolved' ? 'Resolved' : 'In Progress'} />
                  </div>
                  <span style={{ fontSize: 12, color: '#6B7494' }}>{formatDate(d.created_at)}</span>
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={getInitials((d.booking as any)?.customer?.full_name || '')} size="sm" />
                    <div>
                      <p style={{ fontSize: 11, color: '#6B7494' }}>Customer</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                        {(d.booking as any)?.customer?.full_name || '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={getInitials((d.booking as any)?.artisan?.full_name || '')} size="sm" color="gold" />
                    <div>
                      <p style={{ fontSize: 11, color: '#6B7494' }}>Artisan</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                        {(d.booking as any)?.artisan?.full_name || '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#6B7494' }}>
                      {(d.booking as any)?.id?.slice(0,8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B', marginBottom: 4 }}>
                  {d.reason}
                </p>
                <p style={{ fontSize: 13, color: '#6B7494', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {d.description}
                </p>
              </div>
            ))}
          </div>

          {/* Resolution panel */}
          {active && (
            <div style={{
              background: '#fff', border: '1px solid #E8EDF8',
              borderRadius: 14, padding: 20, alignSelf: 'flex-start',
              position: 'sticky', top: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B' }}>Resolve Dispute</h3>
                <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7494' }}>✕</button>
              </div>

              <div style={{ background: '#F5F7FF', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7494', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Case</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1B2B6B' }}>#{active.id.slice(0, 8).toUpperCase()}</p>
                <p style={{ fontSize: 13, color: '#6B7494', marginTop: 2 }}>{active.reason}</p>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7494', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Resolution Options
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {RESOLUTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setResolution(opt.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
                      border: `2px solid ${resolution === opt.label ? '#1B2B6B' : '#E8EDF8'}`,
                      background: resolution === opt.label ? '#EEF1FB' : '#fff',
                      color: '#1B2B6B', fontWeight: resolution === opt.label ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{opt.label}</span>
                    {resolution === opt.label && <span style={{ color: '#16a34a' }}>✓</span>}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7494', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Admin Notes
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes..."
                style={{
                  width: '100%', background: '#F5F7FF', border: '1px solid #E8EDF8',
                  borderRadius: 8, padding: '10px 12px', fontSize: 14,
                  color: '#1B2B6B', outline: 'none', resize: 'none', marginBottom: 16,
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={resolveDispute}
                  disabled={!resolution || resolving}
                  style={{
                    flex: 1, padding: '10px', background: '#1B2B6B',
                    color: '#fff', border: 'none', borderRadius: 8,
                    cursor: resolution ? 'pointer' : 'not-allowed',
                    fontSize: 14, fontWeight: 600,
                    opacity: resolution ? 1 : 0.4,
                  }}
                >
                  {resolving ? 'Submitting...' : 'Submit Resolution'}
                </button>
                <button
                  onClick={() => toast('Draft saved', 'info')}
                  style={{
                    padding: '10px 16px', background: '#F5F7FF',
                    color: '#6B7494', border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontSize: 14,
                  }}
                >
                  Save Draft
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}