'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase, getImageUrl } from '@/lib/supabase'
import { PageHeader, EmptyState, Modal } from '../ui'
import { toast } from '../Toaster'

interface KYCEntry {
  id: string
  user_id: string
  trade_category: string
  bio: string
  location: string
  status: string
  created_at: string
  portfolio_images: string[] | null
  profiles: {
    full_name: string
    phone: string | null
    avatar_url: string | null
  }
  documents?: { name: string; url: string }[]
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function KYCPage() {
  const [queue, setQueue] = useState<KYCEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<KYCEntry | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => { fetchQueue() }, [filter])

  const fetchQueue = async () => {
    setLoading(true)
    const [profilesRes, docsRes] = await Promise.all([
      supabase
        .from('artisan_profiles')
        .select(`
          id, user_id, trade_category, bio, location,
          status, created_at, portfolio_images,
          profiles ( full_name, phone, avatar_url )
        `)
        .eq('status', filter)
        .order('created_at', { ascending: true }),
      supabase
        .from('portfolio_documents')
        .select('artisan_id, name, url')
    ])

    const { data, error } = profilesRes
    const docs = docsRes.data || []

    const docsMap: Record<string, { name: string; url: string }[]> = {}
    docs.forEach((doc: any) => {
      if (!docsMap[doc.artisan_id]) docsMap[doc.artisan_id] = []
      docsMap[doc.artisan_id].push({ name: doc.name, url: doc.url })
    })

    if (error) {
      console.warn('KYC fetch error:', error.message)
      // Fallback without join
      const { data: plain } = await supabase
        .from('artisan_profiles')
        .select('id, user_id, trade_category, bio, location, status, created_at, portfolio_images')
        .eq('status', filter)
        .order('created_at', { ascending: true })
      if (plain) {
        setQueue(plain.map((a: any) => ({
          ...a,
          profiles: null,
          documents: docsMap[a.user_id] || []
        })) as any)
      }
    } else if (data) {
      setQueue(data.map((entry: any) => ({
        ...entry,
        documents: docsMap[entry.user_id] || []
      })) as any)
    }
    setLoading(false)
  }

  const approve = async (entry: KYCEntry) => {
    setProcessing(entry.id)
    const { error } = await supabase
      .from('artisan_profiles')
      .update({ status: 'approved' })
      .eq('id', entry.id)

    if (!error) {
      // Update role to artisan in profiles table
      await supabase.from('profiles').update({ role: 'artisan' }).eq('id', entry.user_id)

      await supabase.from('notifications').insert({
        user_id: entry.user_id,
        title: 'Application Approved! 🎉',
        body: 'Congratulations! Your CraftHive artisan profile has been approved. You can now start receiving bookings.',
        type: 'kyc_approved',
      })
      setQueue(prev => prev.filter(k => k.id !== entry.id))
      toast(`✓ ${(entry.profiles as any)?.full_name} approved and notified`, 'success')
    } else {
      toast('Failed to approve. Try again.', 'error')
    }
    setProcessing(null)
  }

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    setProcessing(rejectModal.id)

    const { error } = await supabase
      .from('artisan_profiles')
      .update({ status: 'rejected' })
      .eq('id', rejectModal.id)

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: rejectModal.user_id,
        title: 'Application Not Approved',
        body: `Your CraftHive artisan application was not approved. Reason: ${rejectReason}. Please update your profile and resubmit.`,
        type: 'kyc_rejected',
      })
      setQueue(prev => prev.filter(k => k.id !== rejectModal.id))
      toast(`${(rejectModal.profiles as any)?.full_name}'s application rejected`, 'error')
    } else {
      toast('Failed to reject. Try again.', 'error')
    }

    setProcessing(null)
    setRejectModal(null)
    setRejectReason('')
  }

  const pendingCount = filter === 'pending' ? queue.length : 0

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 }}>

      {/* ── Document viewer modal ── */}
      {viewingDoc && (
        <div
          onClick={() => setViewingDoc(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={viewingDoc}
              alt="Document"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }}
            />
            <button
              onClick={() => setViewingDoc(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#1B2B6B',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {rejectModal && (
        <Modal
          title="Reject KYC Application"
          onClose={() => { setRejectModal(null); setRejectReason('') }}
        >
          <p style={{ fontSize: 14, color: '#6B7494', marginBottom: 16 }}>
            Rejecting{' '}
            <strong style={{ color: '#1B2B6B' }}>
              {(rejectModal.profiles as any)?.full_name}
            </strong>.
            This reason will be sent to the artisan via notification.
          </p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            placeholder="e.g. Documents are unclear. Please resubmit with better quality photos of your ID and certifications."
            style={{
              width: '100%',
              background: '#F5F7FF',
              border: '1px solid #E8EDF8',
              borderRadius: 8,
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 14,
              color: '#1B2B6B',
              outline: 'none',
              resize: 'none',
              marginBottom: 16,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={reject}
              disabled={!rejectReason.trim() || !!processing}
              style={{
                flex: 1,
                paddingTop: 10,
                paddingBottom: 10,
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                fontSize: 14,
                fontWeight: 600,
                opacity: rejectReason.trim() ? 1 : 0.5,
              }}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => { setRejectModal(null); setRejectReason('') }}
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 20,
                paddingRight: 20,
                background: '#F5F7FF',
                color: '#6B7494',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      <PageHeader
        title="KYC Verification Queue"
        subtitle={`${queue.length} application${queue.length !== 1 ? 's' : ''} ${filter}`}
        actions={
          pendingCount > 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fef9c3',
              color: '#a16207',
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 8,
              border: '1px solid #fde68a',
              fontSize: 13,
              fontWeight: 600,
            }}>
              ⚠️ {pendingCount} pending — action required
            </div>
          ) : undefined
        }
      />

      {/* Status filter tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        background: '#fff',
        border: '1px solid #E8EDF8',
        borderRadius: 10,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 4,
        paddingRight: 4,
        width: 'fit-content',
      }}>
        {(['pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 7,
              border: 'none',
              background: filter === f ? '#1B2B6B' : 'transparent',
              color: filter === f ? '#fff' : '#6B7494',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60, color: '#6B7494' }}>
          Loading KYC queue...
        </div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={filter === 'pending' ? '✅' : filter === 'approved' ? '🏅' : '❌'}
          title={
            filter === 'pending' ? 'All caught up!' :
              filter === 'approved' ? 'No approved artisans yet' :
                'No rejected applications'
          }
          message={
            filter === 'pending'
              ? 'No pending KYC applications. Check back later.'
              : `No ${filter} applications to show.`
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {queue.map(entry => {
            const profile = entry.profiles as any
            
            const docs = entry.documents || []
            const idDoc = docs.find((d: any) => d.name?.toLowerCase().includes('id'))?.url
            const certDoc = docs.find((d: any) => d.name?.toLowerCase().includes('cert') || d.name?.toLowerCase().includes('trade') || d.name?.toLowerCase().includes('certification'))?.url

            const photos: string[] = []
            if (idDoc) photos.push(idDoc)
            if (certDoc) photos.push(certDoc)

            docs.forEach((d: any) => {
              if (d.url !== idDoc && d.url !== certDoc) {
                photos.push(d.url)
              }
            })

            if (entry.portfolio_images) {
              entry.portfolio_images.forEach((url: string) => {
                if (!photos.includes(url)) {
                  photos.push(url)
                }
              })
            }

            const isProcessing = processing === entry.id

            return (
              <div
                key={entry.id}
                style={{
                  background: '#fff',
                  border: '2px solid #E8EDF8',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* ── Card header ── */}
                <div style={{
                  paddingTop: 20,
                  paddingBottom: 16,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderBottom: '1px solid #F5F7FF',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  {/* Avatar — real photo if available */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 48,
                    background: '#FFB800',
                    color: '#1B2B6B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '2px solid #E8EDF8',
                  }}>
                    {profile?.avatar_url ? (
                      <img
                        src={getImageUrl(profile.avatar_url, 'avatars')}
                        alt={profile.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          const img = e.currentTarget as HTMLImageElement
                          img.style.display = 'none'
                          if (img.parentElement) {
                            img.parentElement.innerText = getInitials(profile?.full_name || '')
                          }
                        }}
                      />
                    ) : getInitials(profile?.full_name || '')}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15, lineHeight: 1 }}>
                      {profile?.full_name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7494', marginTop: 4 }}>
                      {entry.trade_category}
                    </p>
                    {entry.location && (
                      <p style={{ fontSize: 12, color: '#6B7494', marginTop: 2 }}>
                        📍 {entry.location}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#6B7494' }}>{timeAgo(entry.created_at)}</p>
                    {/* Status badge for approved/rejected tabs */}
                    {filter !== 'pending' && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 11,
                        paddingTop: 2,
                        paddingBottom: 2,
                        paddingLeft: 8,
                        paddingRight: 8,
                        borderRadius: 20,
                        fontWeight: 600,
                        background: filter === 'approved' ? '#dcfce7' : '#fee2e2',
                        color: filter === 'approved' ? '#15803d' : '#dc2626',
                      }}>
                        {filter}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Details ── */}
                <div style={{ paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 }}>

                  {/* Verification checklist */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    {[
                      { label: 'Phone', ok: !!profile?.phone },
                      { label: 'Photo', ok: !!profile?.avatar_url },
                      { label: 'ID Doc', ok: photos.length >= 1 },
                      { label: 'Bio', ok: !!entry.bio },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: item.ok ? '#dcfce7' : '#fee2e2',
                          color: item.ok ? '#15803d' : '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {item.ok ? '✓' : '✕'}
                        </span>
                        <span style={{ color: '#6B7494' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Phone number */}
                  {profile?.phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#F5F7FF',
                      borderRadius: 8,
                      paddingTop: 8,
                      paddingBottom: 8,
                      paddingLeft: 12,
                      paddingRight: 12,
                      marginBottom: 12,
                      fontSize: 13,
                    }}>
                      <span>📱</span>
                      <span style={{ fontFamily: 'monospace', color: '#1B2B6B', fontWeight: 500 }}>
                        {profile.phone}
                      </span>
                    </div>
                  )}

                  {/* Bio preview */}
                  {entry.bio && (
                    <div style={{
                      background: '#F5F7FF',
                      borderRadius: 8,
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: 12,
                      paddingRight: 12,
                      marginBottom: 14,
                    }}>
                      <p style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#1B2B6B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}>
                        Bio
                      </p>
                      <p style={{
                        fontSize: 13,
                        color: '#6B7494',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {entry.bio}
                      </p>
                    </div>
                  )}

                  {/* Submitted documents */}
                  {photos.length > 0 ? (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#1B2B6B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 8,
                      }}>
                        Submitted Documents ({photos.length})
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {photos.map((url, i) => {
                          const resolvedUrl = getImageUrl(url, 'portfolios')
                          return (
                            <div
                              key={i}
                              onClick={() => setViewingDoc(resolvedUrl)}
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '2px solid #E8EDF8',
                                transition: 'border-color 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1B2B6B'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E8EDF8'}
                            >
                              <img
                                src={resolvedUrl}
                                alt={`Document ${i + 1}`}
                                style={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }}
                              />
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(27,43,107,0)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                transition: 'background 0.15s',
                              }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(27,43,107,0.4)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(27,43,107,0)'}
                              >
                              </div>
                              <div style={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: 4,
                                paddingTop: 2,
                                paddingBottom: 2,
                                paddingLeft: 4,
                                paddingRight: 4,
                                fontSize: 10,
                                color: '#fff',
                              }}>
                                {i === 0 ? 'ID' : i === 1 ? 'Cert' : `Doc ${i + 1}`}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p style={{ fontSize: 11, color: '#6B7494', marginTop: 6 }}>
                        Click any document to view full size
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      background: '#fff8ed',
                      border: '1px dashed #fbbf24',
                      borderRadius: 8,
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: 12,
                      paddingRight: 12,
                      marginBottom: 14,
                      fontSize: 13,
                      color: '#92400e',
                    }}>
                      ⚠️ No documents submitted
                    </div>
                  )}

                  {/* Action buttons — only on pending tab */}
                  {filter === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => approve(entry)}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          paddingTop: 9,
                          paddingBottom: 9,
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: isProcessing ? 0.7 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {isProcessing ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => { setRejectModal(entry); setRejectReason('') }}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          paddingTop: 9,
                          paddingBottom: 9,
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 8,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: isProcessing ? 0.7 : 1,
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}