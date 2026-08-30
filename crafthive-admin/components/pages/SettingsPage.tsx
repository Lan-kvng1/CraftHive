'use client'
import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, getImageUrl } from '@/lib/supabase'
import { Ico } from '../icons'
import { toast } from '../Toaster'

interface AdminUser {
  id: string
  full_name: string
  role: string
  created_at: string
  phone?: string | null
  avatar_url?: string | null
}

interface CurrentAdmin {
  id: string
  full_name: string
  email: string
  role: string
  phone?: string | null
  avatar_url?: string | null
}

const SECURITY = [
  { label: 'Require 2FA for all admins', enabled: true },
  { label: 'Session timeout (30 minutes)', enabled: true },
  { label: 'IP whitelist enforcement', enabled: false },
  { label: 'Audit log recording', enabled: true },
]

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: '#f3e8ff', color: '#7c3aed' },
  admin: { bg: '#dbeafe', color: '#1d4ed8' },
  finance: { bg: '#dcfce7', color: '#15803d' },
  support: { bg: '#fef9c3', color: '#a16207' },
  moderator: { bg: '#f3f4f6', color: '#6b7280' },
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  finance: 'Finance',
  support: 'Support Agent',
  moderator: 'Moderator',
}

const inp: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 14,
  color: '#0F172A',
  outline: 'none',
  marginTop: 8,
  fontFamily: 'inherit',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

const lbl: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  display: 'block',
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  display: 'block',
}

// ── Add Admin Modal ──────────────────────────────────────────────────────────
function AddAdminModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), role } },
      })

      if (signUpErr) {
        setError(signUpErr.message)
        setLoading(false)
        return
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .upsert({ id: data.user.id, role, full_name: name.trim() })
      }

      toast(`${name} added as ${ROLE_LABEL[role] || role}`, 'success')
      onDone()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B', marginBottom: 20 }}>
          Add New Admin
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Kofi Asante" style={inp} />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="kofi@crafthive.gh" type="email" style={inp} />
          </div>
          <div>
            <label style={lbl}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Temporary password" type="password" style={inp} />
          </div>
          <div>
            <label style={lbl}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
              <option value="admin">Admin</option>
              <option value="finance">Finance</option>
              <option value="support">Support Agent</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          {error && (
            <p style={{
              color: '#dc2626',
              fontSize: 13,
              background: '#fee2e2',
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={handleAdd}
            disabled={loading}
            style={{
              flex: 1,
              paddingTop: 10,
              paddingBottom: 10,
              background: '#1B2B6B',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Add Admin'}
          </button>
          <button
            onClick={onClose}
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
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage({ isGuest = false }: { isGuest?: boolean }) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [security, setSecurity] = useState(SECURITY)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'CraftHive',
    supportEmail: 'franklanking65@gmail.com',
    supportPhone: '0507086487',
    timezone: 'GMT+0 (Accra)',
  })
  const [profileEdits, setProfileEdits] = useState<Partial<CurrentAdmin>>({})
  const [savingProfile, setSavingProfile] = useState(false)

  const fetchData = async () => {
    setLoadingAdmins(true)
    try {
      const user = await getCurrentUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, phone, avatar_url')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCurrentAdmin({
            id: profile.id,
            full_name: profile.full_name || '',
            email: user.email || '',
            role: profile.role,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
          })
        }
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at, phone, avatar_url')
        .in('role', ['admin', 'superadmin', 'support', 'finance', 'moderator'])
        .order('created_at', { ascending: true })

      if (data) setAdmins(data as AdminUser[])
    } catch (err) {
      console.warn('fetchData error:', err)
    } finally {
      setLoadingAdmins(false)
    }
  }

  useEffect(() => {
    if (!isGuest) fetchData()
    else setLoadingAdmins(false)
  }, [isGuest])

  const saveProfile = async () => {
    if (!currentAdmin || Object.keys(profileEdits).length === 0) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileEdits.full_name ?? currentAdmin.full_name,
          phone: profileEdits.phone ?? currentAdmin.phone,
        })
        .eq('id', currentAdmin.id)

      if (!error) {
        setCurrentAdmin(prev => prev ? { ...prev, ...profileEdits } : prev)
        setProfileEdits({})
        toast('Profile updated successfully', 'success')
      } else {
        toast('Failed to save profile', 'error')
      }
    } catch (err) {
      toast('Failed to save profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const removeAdmin = async (id: string, name: string) => {
    if (id === currentAdmin?.id) { toast("You can't remove yourself", 'error'); return }
    if (!window.confirm(`Remove ${name} from admin accounts?`)) return
    const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', id)
    if (!error) {
      setAdmins(prev => prev.filter(a => a.id !== id))
      toast(`${name} removed from admins`, 'error')
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })

  const GuestOverlay = () => (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 12,
      background: 'rgba(245,247,255,0.85)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      gap: 10,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        background: '#EEF1FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1B2B6B',
      }}>
        {Ico.lock}
      </div>
      <p style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 15 }}>Sign in required</p>
      <p style={{ fontSize: 13, color: '#6B7494', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
        Settings are only available to signed-in admins.
      </p>
    </div>
  )

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    paddingBottom: 12,
    paddingRight: 16,
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7494',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E8EDF8',
  }

  return (
    <div style={{
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {showAddAdmin && (
        <AddAdminModal onClose={() => setShowAddAdmin(false)} onDone={fetchData} />
      )}

      {/* ── My Profile ── */}
      <div style={cardStyle}>
        {isGuest && <GuestOverlay />}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 4 }}>
          My Profile
        </h3>
        <p style={{ fontSize: 13, color: '#6B7494', marginBottom: 16 }}>
          Your personal admin account details
        </p>

        {currentAdmin ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 64,
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
                boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)',
                overflow: 'hidden',
              }}>
                {currentAdmin.avatar_url ? (
                  <img
                    src={getImageUrl(currentAdmin.avatar_url, 'avatars')}
                    alt={currentAdmin.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(currentAdmin.full_name)
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 16 }}>
                  {currentAdmin.full_name}
                </p>
                <p style={{ fontSize: 13, color: '#6B7494', marginTop: 2 }}>
                  {currentAdmin.email}
                </p>
                <span style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontSize: 11,
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 20,
                  fontWeight: 600,
                  background: ROLE_STYLE[currentAdmin.role]?.bg || '#f3f4f6',
                  color: ROLE_STYLE[currentAdmin.role]?.color || '#6b7280',
                }}>
                  {ROLE_LABEL[currentAdmin.role] || currentAdmin.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={fieldLabel}>Full Name</label>
                <input
                  value={profileEdits.full_name ?? currentAdmin.full_name}
                  onChange={e => setProfileEdits(p => ({ ...p, full_name: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={fieldLabel}>Email Address</label>
                <input
                  value={currentAdmin.email}
                  disabled
                  style={{ ...inp, color: '#6B7494', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={fieldLabel}>Phone Number</label>
                <input
                  value={profileEdits.phone ?? currentAdmin.phone ?? ''}
                  onChange={e => setProfileEdits(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+233 ..."
                  style={inp}
                />
              </div>
              <div>
                <label style={fieldLabel}>Role</label>
                <input
                  value={ROLE_LABEL[currentAdmin.role] || currentAdmin.role}
                  disabled
                  style={{ ...inp, color: '#6B7494', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {Object.keys(profileEdits).length > 0 && (
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingLeft: 20,
                  paddingRight: 20,
                  background: '#1B2B6B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: savingProfile ? 0.7 : 1,
                }}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </>
        ) : (
          !isGuest && (
            <div style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 20, color: '#6B7494', fontSize: 14 }}>
              Loading profile...
            </div>
          )
        )}
      </div>

      {/* ── General Settings ── */}
      <div style={cardStyle}>
        {isGuest && <GuestOverlay />}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 16 }}>
          General Settings
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { key: 'platformName', label: 'Platform Name' },
            { key: 'supportEmail', label: 'Support Email' },
            { key: 'supportPhone', label: 'Support Phone' },
            { key: 'timezone', label: 'Default Timezone' },
          ].map(f => (
            <div key={f.key}>
              <label style={fieldLabel}>{f.label}</label>
              <input
                value={generalSettings[f.key as keyof typeof generalSettings]}
                onChange={e => setGeneralSettings(s => ({ ...s, [f.key]: e.target.value }))}
                style={inp}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => toast('Settings saved successfully', 'success')}
          style={{
            marginTop: 16,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 20,
            paddingRight: 20,
            background: '#1B2B6B',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Save Changes
        </button>
      </div>

      {/* ── Admin Accounts ── */}
      <div style={cardStyle}>
        {isGuest && <GuestOverlay />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B' }}>Admin Accounts</h3>
            <p style={{ fontSize: 13, color: '#6B7494', marginTop: 2 }}>
              {loadingAdmins ? 'Loading...' : `${admins.length} admin${admins.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowAddAdmin(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 14,
              paddingRight: 14,
              background: '#1B2B6B',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {Ico.plus} Add Admin
          </button>
        </div>

        {loadingAdmins ? (
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40, color: '#6B7494' }}>
            Loading admin accounts...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: '#F5F7FF',
              margin: '0 auto',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7494',
            }}>
              {Ico.users}
            </div>
            <p style={{ fontWeight: 600, color: '#1B2B6B', fontSize: 15, marginBottom: 4 }}>
              No admin accounts yet
            </p>
            <p style={{ fontSize: 13, color: '#6B7494' }}>
              Click "Add Admin" to create the first admin account.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Admin', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a, i) => {
                const isMe = a.id === currentAdmin?.id
                return (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i < admins.length - 1 ? '1px solid #F5F7FF' : 'none',
                      background: isMe ? '#FAFBFF' : 'transparent',
                    }}
                  >
                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 36,
                          background: isMe ? '#FFB800' : '#1B2B6B',
                          color: isMe ? '#1B2B6B' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {a.avatar_url ? (
                            <img
                              src={getImageUrl(a.avatar_url, 'avatars')}
                              alt={a.full_name || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            getInitials(a.full_name || '')
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ fontWeight: 600, color: '#1B2B6B', fontSize: 14 }}>
                              {a.full_name || 'Unknown'}
                            </p>
                            {isMe && (
                              <span style={{
                                fontSize: 10,
                                paddingTop: 1,
                                paddingBottom: 1,
                                paddingLeft: 8,
                                paddingRight: 8,
                                borderRadius: 20,
                                background: '#EEF1FB',
                                color: '#1B2B6B',
                                fontWeight: 700,
                              }}>
                                You
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#6B7494', marginTop: 2 }}>
                            {a.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingRight: 16 }}>
                      <span style={{
                        fontSize: 12,
                        paddingTop: 3,
                        paddingBottom: 3,
                        paddingLeft: 10,
                        paddingRight: 10,
                        borderRadius: 20,
                        fontWeight: 600,
                        background: ROLE_STYLE[a.role]?.bg || '#f3f4f6',
                        color: ROLE_STYLE[a.role]?.color || '#6b7280',
                      }}>
                        {ROLE_LABEL[a.role] || a.role}
                      </span>
                    </td>

                    <td style={{ paddingTop: 12, paddingBottom: 12, paddingRight: 16, fontSize: 12, color: '#6B7494' }}>
                      {formatDate(a.created_at)}
                    </td>

                    <td style={{ paddingTop: 12, paddingBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => toast(`Editing ${a.full_name}`, 'info')}
                          title="Edit"
                          style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 6, paddingRight: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7494', display: 'flex', alignItems: 'center' }}
                        >
                          {Ico.edit}
                        </button>
                        {!isMe && a.role !== 'superadmin' && (
                          <button
                            onClick={() => removeAdmin(a.id, a.full_name || '')}
                            title="Remove"
                            style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 6, paddingRight: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                          >
                            {Ico.trash}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Security Settings ── */}
      <div style={cardStyle}>
        {isGuest && <GuestOverlay />}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 16 }}>
          Security Settings
        </h3>
        <div>
          {security.map((s, idx) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                paddingBottom: 12,
                borderBottom: idx < security.length - 1 ? '1px solid #E8EDF8' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
                  {Ico.lock}
                </span>
                <span style={{ fontSize: 14, color: '#1B2B6B' }}>{s.label}</span>
              </div>
              <button
                onClick={() => {
                  setSecurity(prev =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, enabled: !item.enabled } : item
                    )
                  )
                  toast(`${s.label}: ${s.enabled ? 'disabled' : 'enabled'}`, 'info')
                }}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: s.enabled ? '#1B2B6B' : '#D1D5DB',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: s.enabled ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}