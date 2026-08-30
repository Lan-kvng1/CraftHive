'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase, supabase as publicSupabase, getImageUrl } from '@/lib/supabase'
import { Ico } from '../icons'
import { Badge, PageHeader, EmptyState } from '../ui'
import { toast } from '../Toaster'
import { ViewProfileModal, EditProfileModal, AddProfileModal } from '../ProfileModal'

interface Customer {
  id: string
  full_name: string
  phone: string | null
  created_at: string
  email?: string
  location?: string
  booking_count: number
  status: string
  avatar_url?: string | null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<Customer | null>(null)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [addVisible, setAddVisible] = useState(false)
  const PER_PAGE = 10

  const fetchCustomers = async () => {
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, created_at, avatar_url, email, location')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (!profiles) { setLoading(false); return }

    // Batch fetch all booking counts in one query — no N+1
    const ids = profiles.map(p => p.id)
    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('customer_id')
      .in('customer_id', ids)

    const countMap: Record<string, number> = {}
    bookingRows?.forEach((b: any) => {
      countMap[b.customer_id] = (countMap[b.customer_id] || 0) + 1
    })

    setCustomers(profiles.map(p => ({
      ...p,
      booking_count: countMap[p.id] || 0,
      status: 'Active',
    })))

    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  const suspend = async (id: string, name: string, currentStatus: string) => {
    const next = currentStatus === 'Suspended' ? 'Active' : 'Suspended'
    if (!window.confirm(`${next === 'Suspended' ? 'Suspend' : 'Reactivate'} ${name}?`)) return
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: next } : c))
    toast(
      `${name} ${next === 'Suspended' ? 'suspended' : 'reactivated'}`,
      next === 'Suspended' ? 'warning' : 'success',
    )
  }

  const deleteCustomer = async (id: string, name: string) => {
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

      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      setCustomers(prev => prev.filter(c => c.id !== id))
      toast(`${name} deleted successfully`, 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error')
    }
  }

  const exportToCSV = () => {
    if (customers.length === 0) {
      toast('No customers to export', 'error')
      return
    }

    const headers = ['Name', 'Email', 'Phone', 'Location', 'Total Bookings', 'Status', 'Joined Date']
    
    const rows = customers.map(c => [
      `"${(c.full_name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      c.booking_count,
      c.status,
      `"${new Date(c.created_at).toLocaleDateString()}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_customers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast('Customers exported successfully', 'success')
  }

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' })

  return (
    <div style={{ padding: 24 }}>
      {viewing && (
        <ViewProfileModal
          profile={{ ...viewing, role: 'customer' }}
          onClose={() => setViewing(null)}
        />
      )}
      {editing && (
        <EditProfileModal
          profile={{ ...editing, role: 'customer' }}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            setCustomers(prev =>
              prev.map(c => c.id === editing.id ? { ...c, ...updated } : c)
            )
          }
        />
      )}
      {addVisible && (
        <AddProfileModal
          role="customer"
          onClose={() => setAddVisible(false)}
          onAdded={(newUser) => setCustomers(prev => [newUser, ...prev])}
        />
      )}

      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
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
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search customers..."
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
              + Add Customer
            </button>
          </>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading customers...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No customers found"
          message={search ? 'Try a different search term.' : 'No customers have registered yet.'}
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
                {['Customer', 'Phone', 'Bookings', 'Since', 'Status', 'Actions'].map(h => (
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
              {paged.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i === paged.length - 1 ? 'none' : '1px solid #E8EDF8',
                    background: '#fff',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                >
                  {/* Customer name + avatar */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 34,
                        background: '#1B2B6B',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}>
                        {c.avatar_url
                          ? <img src={getImageUrl(c.avatar_url, 'avatars')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(c.full_name || '')}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1B2B6B' }}>{c.full_name || '—'}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontFamily: 'monospace', fontSize: 12, color: '#6B7494' }}>
                    {c.phone || '—'}
                  </td>

                  {/* Booking count */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontWeight: 700, color: '#1B2B6B' }}>
                    {c.booking_count}
                  </td>

                  {/* Since */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, fontSize: 12, color: '#6B7494' }}>
                    {formatDate(c.created_at)}
                  </td>

                  {/* Status */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <Badge status={c.status} />
                  </td>

                  {/* Actions */}
                  <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        onClick={() => setViewing(c)}
                        title="View profile"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1B2B6B'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {Ico.eye}
                      </button>
                      <button
                        onClick={() => setEditing(c)}
                        title="Edit profile"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFB800'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {Ico.edit}
                      </button>
                      <button
                        onClick={() => suspend(c.id, c.full_name || '', c.status)}
                        title={c.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#d97706'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7494'}
                      >
                        {c.status === 'Suspended' ? Ico.checkCircle : Ico.xCircle}
                      </button>
                      <button
                        onClick={() => deleteCustomer(c.id, c.full_name || '')}
                        title="Delete customer"
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

          {/* Pagination */}
          <div style={{
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            borderTop: '1px solid #E8EDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6B7494',
          }}>
            <span>
              Showing {Math.min(filtered.length, (page - 1) * PER_PAGE + 1)}–
              {Math.min(filtered.length, page * PER_PAGE)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: p === page ? '#1B2B6B' : 'transparent',
                    color: p === page ? '#fff' : '#6B7494',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}