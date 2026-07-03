'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Avatar, Badge, Table, TR, TD, PageHeader, Btn, EmptyState, Modal } from '../ui'
import { toast } from '../Toaster'

interface Booking {
  id: string
  status: string
  title: string
  description: string
  scheduled_at: string
  address: string
  created_at: string
  customer: { full_name: string }
  artisan: { full_name: string }
  artisan_profile: { trade_category: string }
}

const STATUS_TABS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const lbl: React.CSSProperties = {
  fontSize:      11,
  fontWeight:    700,
  color:         '#6B7494',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display:       'block',
  marginBottom:  4,
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>('all')
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Bookings fetch error:', error.message)
      setBookings([])
      setLoading(false)
      return
    }

    if (bookingsData && bookingsData.length > 0) {
      const userIds = [...new Set([
        ...bookingsData.map((b: any) => b.customer_id),
        ...bookingsData.map((b: any) => b.artisan_id)
      ].filter(Boolean))]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.full_name
        return acc
      }, {})

      const enriched = bookingsData.map((b: any) => ({
        ...b,
        customer: { full_name: profileMap[b.customer_id] || '—' },
        artisan: { full_name: profileMap[b.artisan_id] || '—' },
        artisan_profile: null
      }))
      setBookings(enriched)
    } else {
      setBookings([])
    }
    setLoading(false)
  }

  const cancelBooking = async (id: string, ticket: string) => {
    if (!window.confirm(`Cancel booking ${ticket}?`)) return
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      toast(`Booking ${ticket} cancelled`, 'error')
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const getStatusLabel = (s: string) =>
    s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab)

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Bookings Management"
        subtitle={`${bookings.length} total bookings`}
        actions={
          <Btn variant="secondary" onClick={() => toast('Exporting bookings…', 'info')}>
            ⬇ Export
          </Btn>
        }
      />

      {/* Status tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        background: '#fff',
        border: '1px solid #E8EDF8',
        borderRadius: 10,
        padding: 4,
        width: 'fit-content',
        overflowX: 'auto',
      }}>
        {STATUS_TABS.map(tab => {
          const count = tab === 'all'
            ? bookings.length
            : bookings.filter(b => b.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 14,
                paddingRight: 14,
                borderRadius: 7,
                border: 'none',
                background: activeTab === tab ? '#1B2B6B' : 'transparent',
                color: activeTab === tab ? '#fff' : '#6B7494',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {getStatusLabel(tab)}
              <span style={{
                fontSize: 11,
                paddingTop: 1,
                paddingBottom: 1,
                paddingLeft: 7,
                paddingRight: 7,
                borderRadius: 20,
                background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#F5F7FF',
                color: activeTab === tab ? '#fff' : '#6B7494',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading bookings...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📅" title="No bookings found" message="No bookings in this category yet." />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8EDF8', borderRadius: 12, overflow: 'hidden' }}>
          <Table headers={['Ticket', 'Customer', 'Artisan', 'Service', 'Scheduled', 'Status', 'Actions']}>
            {filtered.map(b => (
              <TR key={b.id}>
                <TD mono>
                  <span style={{ color: '#1B2B6B', fontWeight: 700 }}>
                    {b.id.slice(0, 8).toUpperCase()}
                  </span>
                </TD>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={getInitials((b.customer as any)?.full_name || '')} size="sm" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                      {(b.customer as any)?.full_name || '—'}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={getInitials((b.artisan as any)?.full_name || '')} size="sm" color="gold" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                      {(b.artisan as any)?.full_name || '—'}
                    </span>
                  </div>
                </TD>
                <TD style={{ color: '#6B7494', fontSize: 13 }}>
                  {(b as any).title || '—'}
                </TD>
                <TD style={{ color: '#6B7494', fontSize: 12 }}>
                  {formatDate(b.scheduled_at)}
                </TD>
                <TD>
                  <Badge status={getStatusLabel(b.status)} />
                </TD>
                <TD>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setViewingBooking(b)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                    >
                      👁
                    </button>
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        onClick={() => cancelBooking(b.id, b.id.slice(0,8).toUpperCase())}
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
          <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, borderTop: '1px solid #E8EDF8', fontSize: 12, color: '#6B7494' }}>
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        </div>
      )}

      {viewingBooking && (
        <Modal
          title={`Booking Details — ${viewingBooking.id.slice(0, 8).toUpperCase()}`}
          onClose={() => setViewingBooking(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={lbl}>Service / Title</span>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B' }}>
                {viewingBooking.title}
              </p>
            </div>

            {viewingBooking.description && (
              <div>
                <span style={lbl}>Description</span>
                <p style={{ fontSize: 14, color: '#6B7494', lineHeight: 1.5 }}>
                  {viewingBooking.description}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#F5F7FF', borderRadius: 10, padding: 12 }}>
                <span style={lbl}>Customer</span>
                <p style={{ fontSize: 13, color: '#1B2B6B', fontWeight: 600 }}>
                  {viewingBooking.customer.full_name}
                </p>
              </div>
              <div style={{ background: '#F5F7FF', borderRadius: 10, padding: 12 }}>
                <span style={lbl}>Artisan</span>
                <p style={{ fontSize: 13, color: '#1B2B6B', fontWeight: 600 }}>
                  {viewingBooking.artisan.full_name}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#F5F7FF', borderRadius: 10, padding: 12 }}>
                <span style={lbl}>Scheduled Date</span>
                <p style={{ fontSize: 13, color: '#1B2B6B', fontWeight: 600 }}>
                  {formatDate(viewingBooking.scheduled_at)}
                </p>
              </div>
              <div style={{ background: '#F5F7FF', borderRadius: 10, padding: 12 }}>
                <span style={lbl}>Status</span>
                <div style={{ marginTop: 2 }}>
                  <Badge status={getStatusLabel(viewingBooking.status)} />
                </div>
              </div>
            </div>

            <div>
              <span style={lbl}>Service Address / Location</span>
              <p style={{ fontSize: 13, color: '#1B2B6B', fontWeight: 500 }}>
                📍 {viewingBooking.address || '—'}
              </p>
            </div>

            <button
              onClick={() => setViewingBooking(null)}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '10px 0',
                background: '#F5F7FF',
                color: '#6B7494',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}