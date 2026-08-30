'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Avatar, Badge, PageHeader, EmptyState } from '../ui'
import { toast } from '../Toaster'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  booking_id: string
  status?: string
  customer: { full_name: string }
  artisan: { full_name: string }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all')

  useEffect(() => { fetchReviews() }, [])

  const fetchReviews = async () => {
    setLoading(true)
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Reviews fetch error:', error.message)
      setReviews([])
      setLoading(false)
      return
    }

    if (reviewsData && reviewsData.length > 0) {
      const userIds = [...new Set([
        ...reviewsData.map((r: any) => r.reviewer_id),
        ...reviewsData.map((r: any) => r.artisan_id)
      ].filter(Boolean))]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.full_name
        return acc
      }, {})

      const enriched = reviewsData.map((r: any) => ({
        ...r,
        customer: { full_name: profileMap[r.reviewer_id] || '—' },
        artisan: { full_name: profileMap[r.artisan_id] || '—' },
      }))
      setReviews(enriched)
    } else {
      setReviews([])
    }
    setLoading(false)
  }

  const approveReview = async (id: string) => {
    const { error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', id)
    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
      toast('Review approved ✓', 'success')
    } else if (error.message.includes('column') && error.message.includes('status')) {
      toast('Run this SQL first: ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT \'approved\'', 'error')
    } else {
      toast(`Failed to approve: ${error.message}`, 'error')
    }
  }

  const flagReview = async (id: string) => {
    const { error } = await supabase.from('reviews').update({ status: 'flagged' }).eq('id', id)
    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'flagged' } : r))
      toast('Review flagged 🚩', 'warning')
    } else if (error.message.includes('column') && error.message.includes('status')) {
      toast('Run this SQL first: ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT \'approved\'', 'error')
    } else {
      toast(`Failed to flag: ${error.message}`, 'error')
    }
  }

  const deleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) {
      setReviews(prev => prev.filter(r => r.id !== id))
      toast('Review deleted', 'error')
    }
  }

  const exportToCSV = () => {
    if (reviews.length === 0) { toast('No reviews to export', 'error'); return }

    const source = filter === 'all' ? reviews
      : filter === 'positive' ? reviews.filter(r => r.rating >= 4)
      : reviews.filter(r => r.rating <= 2)

    const headers = ['Review ID', 'Rating', 'Customer', 'Artisan', 'Booking Ticket', 'Comment', 'Status', 'Date']
    const rows = source.map(r => [
      r.id.slice(0, 8).toUpperCase(),
      r.rating,
      `"${((r.customer as any)?.full_name || '').replace(/"/g, '""')}"`,
      `"${((r.artisan as any)?.full_name || '').replace(/"/g, '""')}"`,
      r.booking_id?.slice(0, 8).toUpperCase() || '—',
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      r.status || 'approved',
      `"${new Date(r.created_at).toLocaleDateString()}"`
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_reviews_${filter}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`${source.length} review(s) exported`, 'success')
  }

  const filtered = filter === 'all' ? reviews
    : filter === 'positive' ? reviews.filter(r => r.rating >= 4)
    : reviews.filter(r => r.rating <= 2)

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < rating ? '#FFB800' : '#E8EDF8', fontSize: 14 }}>★</span>
    ))

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })

  const getBorderColor = (rating: number) => {
    if (rating >= 4) return '#16a34a'
    if (rating <= 2) return '#dc2626'
    return '#FFB800'
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Review Moderation"
        subtitle={`${reviews.length} total reviews`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #E8EDF8', borderRadius: 10, padding: 4 }}>
              {(['all', 'positive', 'negative'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none',
                  background: filter === f ? '#1B2B6B' : 'transparent',
                  color: filter === f ? '#fff' : '#6B7494',
                  cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
                }}>
                  {f} ({f === 'all' ? reviews.length : f === 'positive' ? reviews.filter(r => r.rating >= 4).length : reviews.filter(r => r.rating <= 2).length})
                </button>
              ))}
            </div>
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
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews found" message="Reviews from customers will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: '#fff', borderRadius: 14,
              border: `1px solid #E8EDF8`,
              borderLeft: `4px solid ${getBorderColor(r.rating)}`,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex' }}>{renderStars(r.rating)}</div>
                    <span style={{ fontSize: 12, color: '#6B7494' }}>{formatDate(r.created_at)}</span>
                    {r.status && (
                      <Badge status={r.status.charAt(0).toUpperCase() + r.status.slice(1)} />
                    )}
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7494', marginLeft: 'auto' }}>
                      {r.booking_id?.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: '#1B2B6B', lineHeight: 1.6, marginBottom: 12 }}>
                    {r.comment || 'No comment provided.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={getInitials((r.customer as any)?.full_name || '')} size="sm" />
                      <span style={{ color: '#6B7494' }}>{(r.customer as any)?.full_name || '—'}</span>
                    </div>
                    <span style={{ color: '#E8EDF8' }}>→</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={getInitials((r.artisan as any)?.full_name || '')} size="sm" color="gold" />
                      <span style={{ color: '#6B7494' }}>{(r.artisan as any)?.full_name || '—'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => approveReview(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', background: '#dcfce7', color: '#15803d',
                      border: '1px solid #bbf7d0', borderRadius: 8,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => flagReview(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', background: '#fee2e2', color: '#dc2626',
                      border: '1px solid #fecaca', borderRadius: 8,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    🚩 Flag
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', background: '#F5F7FF', color: '#6B7494',
                      border: 'none', borderRadius: 8,
                      cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}