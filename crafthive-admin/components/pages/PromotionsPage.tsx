'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Badge, Table, TR, TD, PageHeader, Btn, Modal, EmptyState } from '../ui'
import { toast } from '../Toaster'

interface Promo {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function PromotionsPage() {
  const [list, setList] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    expires_at: '',
  })

  useEffect(() => { fetchPromos() }, [])

  const fetchPromos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setList(data)
    setLoading(false)
  }

  const create = async () => {
    if (!form.code.trim() || !form.discount_value) {
      toast('Please fill in all required fields', 'warning')
      return
    }
    const code = form.code.toUpperCase().trim()
    if (list.find(p => p.code === code)) {
      toast('Code already exists', 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('promos').insert({
      code,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true,
      current_uses: 0,
    })
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast(`Coupon ${code} created`, 'success')
    setShowCreate(false)
    setForm({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' })
    fetchPromos()
  }

  const toggleActive = async (promo: Promo) => {
    const { error } = await supabase
      .from('promos')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id)
    if (!error) {
      setList(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
      toast(
        `${promo.code} ${!promo.is_active ? 'activated' : 'deactivated'}`,
        'success',
      )
    }
  }

  const deletePromo = async (promo: Promo) => {
    if (!window.confirm(`Delete coupon ${promo.code}?`)) return
    const { error } = await supabase.from('promos').delete().eq('id', promo.id)
    if (!error) {
      setList(prev => prev.filter(p => p.id !== promo.id))
      toast(`Coupon ${promo.code} deleted`, 'error')
    }
  }

  const exportToCSV = () => {
    if (list.length === 0) { toast('No promotions to export', 'error'); return }

    const headers = ['Code', 'Type', 'Discount Value', 'Max Uses', 'Current Uses', 'Expires At', 'Active', 'Created']
    const rows = list.map(p => [
      p.code,
      p.discount_type,
      p.discount_type === 'percentage' ? `${p.discount_value}%` : `GHC ${p.discount_value}`,
      p.max_uses ?? 'Unlimited',
      p.current_uses,
      p.expires_at ? `"${new Date(p.expires_at).toLocaleDateString()}"` : 'No Expiry',
      p.is_active ? 'Yes' : 'No',
      `"${new Date(p.created_at).toLocaleDateString()}"`
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `crafthive_promotions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`${list.length} coupon(s) exported`, 'success')
  }

  const formatDate = (d: string | null) => {
    if (!d) return 'No expiry'
    return new Date(d).toLocaleDateString('en-GH', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#F5F7FF',
    border: '1px solid #E8EDF8',
    borderRadius: 8,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 14,
    color: '#1B2B6B',
    outline: 'none',
    marginTop: 6,
    fontFamily: 'inherit',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7494',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create New Coupon" onClose={() => setShowCreate(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={lbl}>Coupon Code *</label>
              <input
                value={form.code}
                onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER30"
                style={{ ...inp, fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={lbl}>Discount Type</label>
              <select
                value={form.discount_type}
                onChange={e => setForm(prev => ({ ...prev, discount_type: e.target.value }))}
                style={inp}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (GH₵)</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Discount Value *</label>
              <input
                value={form.discount_value}
                onChange={e => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                type="number"
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Max Uses</label>
              <input
                value={form.max_uses}
                onChange={e => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                placeholder="Leave blank for unlimited"
                type="number"
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Expiry Date</label>
              <input
                value={form.expires_at}
                onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                type="date"
                style={inp}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={create}
                disabled={saving}
                style={{
                  flex: 1,
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 0,
                  paddingRight: 0,
                  background: '#FFB800',
                  color: '#1B2B6B',
                  border: 'none',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 16,
                  paddingRight: 16,
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
          </div>
        </Modal>
      )}

      <PageHeader
        title="Promotions & Coupons"
        subtitle={`${list.filter(p => p.is_active).length} active promotions`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
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
            <Btn variant="gold" onClick={() => setShowCreate(true)}>
              + Create Coupon
            </Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7494' }}>
          Loading promotions...
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No promotions yet"
          message="Create your first coupon to attract more customers."
        />
      ) : (
        <div style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          <Table headers={['Code', 'Type', 'Value', 'Usage', 'Expires', 'Status', 'Actions']}>
            {list.map(p => (
              <TR key={p.id}>
                <TD mono>
                  <span style={{ fontWeight: 700, color: '#1B2B6B', letterSpacing: '0.05em' }}>
                    {p.code}
                  </span>
                </TD>
                <TD style={{ color: '#6B7494', fontSize: 13 }}>
                  {p.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                </TD>
                <TD>
                  <span style={{ fontWeight: 700, color: '#FFB800', fontSize: 15 }}>
                    {p.discount_type === 'percentage'
                      ? `${p.discount_value}%`
                      : `GH₵ ${p.discount_value}`}
                  </span>
                </TD>
                <TD mono style={{ color: '#6B7494', fontSize: 12 }}>
                  {p.current_uses} / {p.max_uses ?? '∞'}
                </TD>
                <TD style={{ color: '#6B7494', fontSize: 12 }}>
                  {formatDate(p.expires_at)}
                </TD>
                <TD>
                  <Badge status={p.is_active ? 'Active' : 'Closed'} />
                </TD>
                <TD>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => toggleActive(p)}
                      style={{
                        paddingTop: 5,
                        paddingBottom: 5,
                        paddingLeft: 10,
                        paddingRight: 10,
                        borderRadius: 6,
                        border: '1px solid #E8EDF8',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#6B7494',
                      }}
                    >
                      {p.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deletePromo(p)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                    >
                      🗑️
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
          <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, borderTop: '1px solid #E8EDF8', fontSize: 12, color: '#6B7494' }}>
            {list.length} total coupon{list.length !== 1 ? 's' : ''} · {list.filter(p => p.is_active).length} active
          </div>
        </div>
      )}
    </div>
  )
}