'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase, supabase as publicSupabase, getImageUrl } from '@/lib/supabase'
import { Ico } from '../icons'
import { Badge, PageHeader, EmptyState } from '../ui'
import { toast } from '../Toaster'
import { ViewProfileModal, EditProfileModal, AddProfileModal } from '../ProfileModal'

interface Artisan {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  trade_category: string
  rating: number
  total_reviews: number
  status: string
  location: string
  bio: string
  created_at: string
  avatar_url?: string | null
  email?: string
  job_count: number
  total_earnings: number
  portfolio_images?: string[] | null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const hasRating = (reviewCount ?? 0) > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={14} height={14} viewBox="0 0 24 24"
        fill={hasRating ? '#FFB800' : '#CBD5E1'} stroke={hasRating ? '#FFB800' : '#CBD5E1'} strokeWidth={1}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span style={{ fontWeight: 600, color: hasRating ? '#1B2B6B' : '#94A3B8', fontSize: 13 }}>
        {hasRating ? rating.toFixed(1) : '—'}
      </span>
    </div>
  )
}

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Artisan | null>(null)
  const [editing, setEditing] = useState<Artisan | null>(null)
  const [addVisible, setAddVisible] = useState(false)
  const [search, setSearch] = useState('')

  const fetchArtisans = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('artisan_profiles')
      .select(`
        id, user_id, trade_category, rating, total_reviews,
        status, location, bio, portfolio_images,
        profiles ( full_name, phone, created_at, avatar_url, email )
      `)
      .order('rating', { ascending: false })

    if (!data) { setLoading(false); return }

    const ids = data.map((a: any) => a.user_id)

    // Batch fetch completed bookings — no N+1
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('artisan_id')
      .in('artisan_id', ids)
      .eq('status', 'completed')

    const jobCountMap: Record<string, number> = {}
    completedBookings?.forEach((b: any) => {
      jobCountMap[b.artisan_id] = (jobCountMap[b.artisan_id] || 0) + 1
    })

    // Batch fetch earnings — no N+1
    const { data: payments } = await supabase
      .from('payments')
      .select('artisan_id, amount')
      .in('artisan_id', ids)
      .in('status', ['held', 'released'])

    const earningsMap: Record<string, number> = {}
    payments?.forEach((p: any) => {
      // Display true Net Earnings (90% of gross)
      earningsMap[p.artisan_id] = (earningsMap[p.artisan_id] || 0) + ((p.amount || 0) * 0.90)
    })

    // Batch fetch reviews to compute live rating — artisan_profiles.rating is not auto-synced
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('artisan_id, rating')
      .in('artisan_id', ids)

    const reviewSumMap: Record<string, number> = {}
    const reviewCountMap: Record<string, number> = {}
    allReviews?.forEach((r: any) => {
      reviewSumMap[r.artisan_id] = (reviewSumMap[r.artisan_id] || 0) + (r.rating || 0)
      reviewCountMap[r.artisan_id] = (reviewCountMap[r.artisan_id] || 0) + 1
    })

    setArtisans(data.map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      full_name: (a.profiles as any)?.full_name || '—',
      phone: (a.profiles as any)?.phone || null,
      trade_category: a.trade_category || '—',
      rating: reviewCountMap[a.user_id]
        ? parseFloat((reviewSumMap[a.user_id] / reviewCountMap[a.user_id]).toFixed(1))
        : 0,
      total_reviews: reviewCountMap[a.user_id] || 0,
      status: a.status,
      location: a.location || '—',
      bio: a.bio || '',
      created_at: (a.profiles as any)?.created_at || '',
      avatar_url: (a.profiles as any)?.avatar_url || null,
      email: (a.profiles as any)?.email || '—',
      job_count: jobCountMap[a.user_id] || 0,
      total_earnings: earningsMap[a.user_id] || 0,
      portfolio_images: a.portfolio_images || null,
    })))

    setLoading(false)
  }

  const deleteArtisan = async (userId: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      let token = null
      try {
        const { data } = await publicSupabase.auth.getSession()
        token = data?.session?.access_token
      } catch (e) {
        console.warn('Failed to retrieve session token:', e)
      }

      if (!token) {
        toast('Not authenticated as admin', 'error')
        return
      }

      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      setArtisans(prev => prev.filter(a => a.user_id !== userId))
      toast(`${name} deleted successfully`, 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error')
    }
  }

  const exportToCSV = () => {
    if (artisans.length === 0) {
      toast('No artisans to export', 'error')
      return
    }

    const headers = ['Name', 'Email', 'Phone', 'Trade Category', 'Location', 'Rating', 'Jobs Completed', 'Total Earnings (GHC)', 'Status', 'Joined Date']
    
    const rows = artisans.map(a => [
      `"${(a.full_name || '').replace(/"/g, '""')}"`,
      `"${(a.email || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${(a.trade_category || '').replace(/"/g, '""')}"`,
      `"${(a.location || '').replace(/"/g, '""')}"`,
      a.rating,
      a.job_count,
      a.total_earnings,
      a.status,
      `"${new Date(a.created_at).toLocaleDateString()}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_artisans_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast('Artisans exported successfully', 'success')
  }

  useEffect(() => { fetchArtisans() }, [])

  const updateStatus = async (id: string, newStatus: string, name: string, user_id: string) => {
    const { error } = await supabase
      .from('artisan_profiles')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      // Also update role in profiles
      await supabase.from('profiles').update({ role: newStatus === 'approved' ? 'artisan' : 'customer' }).eq('id', user_id)

      setArtisans(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
      toast(
        `${name} ${newStatus === 'approved' ? 'approved' : 'suspended'}`,
        newStatus === 'approved' ? 'success' : 'warning',
      )
      await supabase.from('notifications').insert({
        user_id: user_id,
        title: newStatus === 'approved' ? 'Profile Approved!' : 'Profile Suspended',
        body: newStatus === 'approved'
          ? 'Congratulations! Your CraftHive profile is now active.'
          : 'Your profile has been suspended. Please contact support.',
        type: newStatus === 'approved' ? 'kyc_approved' : 'account_suspended',
      })
    }
  }

  const filtered = artisans.filter(a =>
    (a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.trade_category || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.location || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 24 }}>
      {viewing && (
        <ViewProfileModal
          profile={{
            id: viewing.id,
            user_id: viewing.user_id,
            full_name: viewing.full_name,
            phone: viewing.phone,
            role: 'artisan',
            created_at: viewing.created_at,
            avatar_url: viewing.avatar_url,
            trade_category: viewing.trade_category,
            bio: viewing.bio,
            location: viewing.location,
            rating: viewing.rating,
            total_reviews: viewing.total_reviews,
            status: viewing.status,
            email: viewing.email,
            portfolio_images: viewing.portfolio_images,
          }}
          onClose={() => setViewing(null)}
        />
      )}
      {editing && (
        <EditProfileModal
          profile={{
            id: editing.id,
            user_id: editing.user_id,
            full_name: editing.full_name,
            phone: editing.phone,
            role: 'artisan',
            created_at: editing.created_at,
            location: editing.location,
            bio: editing.bio,
          }}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            setArtisans(prev =>
              prev.map(a => a.id === editing.id ? { ...a, ...updated } : a)
            )
          }
        />
      )}
      {addVisible && (
        <AddProfileModal
          role="artisan"
          onClose={() => setAddVisible(false)}
          onAdded={(newUser) => setArtisans(prev => [newUser, ...prev])}
        />
      )}

      <PageHeader
        title="Artisans"
        subtitle={`${artisans.length} registered artisans`}
        actions={
          <>
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
                placeholder="Search artisans..."
                style={{
                  background: '#fff',
                  border: '1px solid #E8EDF8',
                  borderRadius: 8,
                  paddingTop: 7,
                  paddingBottom: 7,
                  paddingLeft: 32,
                  paddingRight: 12,
                  fontSize: 13,
                  color: '#1B2B6B',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={exportToCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 14,
                paddingRight: 14,
                background: '#fff',
                border: '1px solid #E8EDF8',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: '#6B7494',
              }}
            >
              {Ico.download} Export
            </button>
            <button
              onClick={() => setAddVisible(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 14,
                paddingRight: 14,
                background: '#1B2B6B',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              + Add Artisan
            </button>
          </>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading artisans...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ico.tool}
          title="No artisans yet"
          message="Artisans will appear here once they register through the mobile app."
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
                {['Artisan', 'Category', 'Location', 'Rating', 'Jobs', 'Earnings', 'Status', 'Actions'].map(h => (
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
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: i === filtered.length - 1 ? 'none' : '1px solid #E8EDF8',
                    background: '#fff',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                >
                  {/* Artisan name + avatar */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 34,
                        background: '#FFB800',
                        color: '#1B2B6B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}>
                        {a.avatar_url
                          ? <img src={getImageUrl(a.avatar_url, 'avatars')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(a.full_name)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1B2B6B' }}>{a.full_name}</span>
                    </div>
                  </td>

                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: '#6B7494', fontSize: 13 }}>{a.trade_category}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: '#6B7494', fontSize: 13 }}>{a.location}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}><StarRating rating={a.rating} reviewCount={a.total_reviews} /></td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontWeight: 700, color: '#1B2B6B' }}>{a.job_count}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1B2B6B' }}>
                    GH₵ {a.total_earnings.toLocaleString()}
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <Badge status={
                      a.status === 'approved' ? 'Approved'
                        : a.status === 'pending' ? 'Pending'
                          : 'Rejected'
                    } />
                  </td>

                  {/* Actions */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        onClick={() => setViewing(a)}
                        title="View profile"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1B2B6B'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {Ico.eye}
                      </button>
                      <button
                        onClick={() => setEditing(a)}
                        title="Edit profile"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFB800'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {Ico.edit}
                      </button>
                      <button
                        onClick={() => {
                          const next = a.status === 'approved' ? 'rejected' : 'approved'
                          if (!window.confirm(`${next === 'approved' ? 'Approve' : 'Suspend'} ${a.full_name}?`)) return
                          updateStatus(a.id, next, a.full_name, a.user_id)
                        }}
                        title={a.status === 'approved' ? 'Suspend' : 'Approve'}
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = a.status === 'approved' ? '#dc2626' : '#16a34a'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {a.status === 'approved' ? Ico.xCircle : Ico.checkCircle}
                      </button>
                      <button
                        onClick={() => deleteArtisan(a.user_id, a.full_name)}
                        title="Delete artisan"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#dc2626'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {Ico.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, borderTop: '1px solid #E8EDF8', fontSize: 12, color: '#6B7494' }}>
            {filtered.length} artisan{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}