'use client'
import { useState } from 'react'
import { supabase, getImageUrl } from '@/lib/supabase'
import { Ico } from './icons'
import { toast } from './Toaster'

interface ProfileData {
  id: string
  user_id?: string
  full_name: string
  phone: string | null
  role: string
  created_at: string
  email?: string
  avatar_url?: string | null
  // artisan extras
  trade_category?: string
  bio?: string
  location?: string
  rating?: number
  total_reviews?: number
  status?: string
  portfolio_images?: string[] | null
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── shared label style ────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  fontSize:      11,
  fontWeight:    700,
  color:         '#6B7494',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display:       'block',
  marginBottom:  4,
}

// ── shared input style — all longhand, no shorthand conflict ─────────────────
const inp: React.CSSProperties = {
  width:         '100%',
  background:    '#F5F7FF',
  border:        '1px solid #E8EDF8',
  borderRadius:  8,
  paddingTop:    9,
  paddingBottom: 9,
  paddingLeft:   12,
  paddingRight:  12,
  fontSize:      14,
  color:         '#1B2B6B',
  outline:       'none',
  marginTop:     6,
  fontFamily:    'inherit',
}

// ── View modal ────────────────────────────────────────────────────────────────
export function ViewProfileModal({
  profile,
  onClose,
}: {
  profile: ProfileData
  onClose: () => void
}) {
  const isArtisan = profile.role === 'artisan'

  const fields = [
    { label: 'Phone',         value: profile.phone || '—' },
    {
      label: 'Member Since',
      value: new Date(profile.created_at).toLocaleDateString('en-GH', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    },
    ...(isArtisan ? [
      { label: 'Trade Category', value: profile.trade_category || '—' },
      { label: 'Location',       value: profile.location       || '—' },
      {
        label: 'Rating',
        value: (profile.total_reviews ?? 0) > 0
          ? `${(profile.rating ?? 0).toFixed(1)} ★  (${profile.total_reviews} review${profile.total_reviews === 1 ? '' : 's'})`
          : 'No reviews yet',
      },
      { label: 'Bio', value: profile.bio || '—' },
    ] : []),
  ]

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.45)',
        zIndex:         9000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:    '#fff',
          borderRadius:  20,
          paddingTop:    28,
          paddingBottom: 28,
          paddingLeft:   28,
          paddingRight:  28,
          width:         '100%',
          maxWidth:      500,
          boxShadow:     '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B' }}>
            {isArtisan ? 'Artisan Profile' : 'Customer Profile'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#6B7494',
              display: 'flex', alignItems: 'center',
            }}
          >
            {Ico.x}
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width:          64,
            height:         64,
            borderRadius:   64,
            background:     isArtisan ? '#FFB800' : '#1B2B6B',
            color:          isArtisan ? '#1B2B6B' : '#fff',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       22,
            fontWeight:     700,
            fontFamily:     'monospace',
            overflow:       'hidden',
            flexShrink:     0,
          }}>
            {profile.avatar_url ? (
              <img
                src={getImageUrl(profile.avatar_url, 'avatars')}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : getInitials(profile.full_name || '')}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#1B2B6B', fontSize: 18 }}>
              {profile.full_name || '—'}
            </p>
            <p style={{ fontSize: 13, color: '#6B7494', marginTop: 3 }}>
              {profile.email || '—'}
            </p>
            {isArtisan && profile.status && (
              <span style={{
                display:       'inline-block',
                marginTop:     6,
                fontSize:      11,
                paddingTop:    2,
                paddingBottom: 2,
                paddingLeft:   10,
                paddingRight:  10,
                borderRadius:  20,
                fontWeight:    600,
                background:
                  profile.status === 'approved' ? '#dcfce7'
                  : profile.status === 'pending'  ? '#fef9c3'
                  : '#fee2e2',
                color:
                  profile.status === 'approved' ? '#15803d'
                  : profile.status === 'pending'  ? '#a16207'
                  : '#dc2626',
              }}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fields.map(f => (
            <div
              key={f.label}
              style={{
                background:    '#F5F7FF',
                borderRadius:  10,
                paddingTop:    10,
                paddingBottom: 10,
                paddingLeft:   14,
                paddingRight:  14,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7494', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {f.label}
              </p>
              <p style={{ fontSize: 13, color: '#1B2B6B', fontWeight: 500 }}>
                {f.value}
              </p>
            </div>
          ))}
        </div>

        {/* Portfolio Images */}
        {isArtisan && profile.portfolio_images && profile.portfolio_images.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={lbl}>Portfolio / Uploaded Images</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {profile.portfolio_images.map((url, idx) => {
                const resolvedUrl = getImageUrl(url, 'portfolios')
                return (
                  <a
                    key={idx}
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid #E8EDF8',
                      display: 'block',
                    }}
                  >
                    <img
                      src={resolvedUrl}
                      alt=""
                      style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop:     20,
            width:         '100%',
            paddingTop:    10,
            paddingBottom: 10,
            paddingLeft:   0,
            paddingRight:  0,
            background:    '#F5F7FF',
            color:         '#6B7494',
            border:        'none',
            borderRadius:  10,
            cursor:        'pointer',
            fontSize:      14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: ProfileData
  onClose: () => void
  onSaved: (updated: Partial<ProfileData>) => void
}) {
  const [name,    setName]    = useState(profile.full_name || '')
  const [phone,   setPhone]   = useState(profile.phone    || '')
  const [location, setLocation] = useState(profile.location || '')
  const [bio,     setBio]     = useState(profile.bio      || '')
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    setSaving(true)

    const targetUserId = profile.role === 'artisan' && profile.user_id ? profile.user_id : profile.id

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() })
      .eq('id', targetUserId)

    if (error) {
      toast('Failed to save changes', 'error')
      setSaving(false)
      return
    }

    if (profile.role === 'artisan') {
      const artisanUpdates: Record<string, string> = {}
      if (location.trim()) artisanUpdates.location = location.trim()
      if (bio.trim())      artisanUpdates.bio      = bio.trim()
      if (Object.keys(artisanUpdates).length > 0) {
        await supabase
          .from('artisan_profiles')
          .update(artisanUpdates)
          .eq('id', profile.id)
      }
    }

    toast(`${name} updated successfully`, 'success')
    onSaved({ full_name: name, phone, location, bio })
    setSaving(false)
    onClose()
  }

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.45)',
        zIndex:         9000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:    '#fff',
          borderRadius:  20,
          paddingTop:    28,
          paddingBottom: 28,
          paddingLeft:   28,
          paddingRight:  28,
          width:         '100%',
          maxWidth:      480,
          boxShadow:     '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B' }}>
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#6B7494',
              display: 'flex', alignItems: 'center',
            }}
          >
            {Ico.x}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Full Name */}
          <div>
            <label style={lbl}>Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inp}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={lbl}>Phone Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={inp}
            />
          </div>

          {/* Artisan-only fields */}
          {profile.role === 'artisan' && (
            <>
              <div>
                <label style={lbl}>Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Bio</label>
                {/* textarea — all longhand padding, no shorthand conflict */}
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  style={{
                    width:         '100%',
                    background:    '#F5F7FF',
                    border:        '1px solid #E8EDF8',
                    borderRadius:  8,
                    paddingTop:    9,
                    paddingBottom: 9,
                    paddingLeft:   12,
                    paddingRight:  12,
                    fontSize:      14,
                    color:         '#1B2B6B',
                    outline:       'none',
                    marginTop:     6,
                    resize:        'none',
                    verticalAlign: 'top',
                    fontFamily:    'inherit',
                    display:       'block',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex:          1,
              paddingTop:    10,
              paddingBottom: 10,
              paddingLeft:   0,
              paddingRight:  0,
              background:    '#1B2B6B',
              color:         '#fff',
              border:        'none',
              borderRadius:  10,
              cursor:        saving ? 'not-allowed' : 'pointer',
              fontSize:      14,
              fontWeight:    600,
              opacity:       saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            style={{
              paddingTop:    10,
              paddingBottom: 10,
              paddingLeft:   20,
              paddingRight:  20,
              background:    '#F5F7FF',
              color:         '#6B7494',
              border:        'none',
              borderRadius:  10,
              cursor:        'pointer',
              fontSize:      14,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add modal ────────────────────────────────────────────────────────────────
export function AddProfileModal({
  role,
  onClose,
  onAdded,
}: {
  role: 'customer' | 'artisan'
  onClose: () => void
  onAdded: (newUser: any) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast('Please fill all required fields', 'error')
      return
    }
    setSaving(true)

    try {
      let token = null
      try {
        const { data } = await supabase.auth.getSession()
        token = data?.session?.access_token
      } catch (e) {
        console.warn('Failed to retrieve session token:', e)
      }

      if (!token) {
        toast('Not authenticated as admin', 'error')
        setSaving(false)
        return
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          full_name: name.trim(),
          phone: phone.trim() || null,
          role,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast(`${name} created successfully`, 'success')
      onAdded({
        id: result.userId,
        user_id: result.userId,
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        created_at: new Date().toISOString(),
        role,
        booking_count: 0,
        job_count: 0,
        total_earnings: 0,
        rating: 0,
        status: role === 'artisan' ? 'approved' : 'Active',
      })
      onClose()
    } catch (err: any) {
      toast(err.message || 'Failed to add user', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.45)',
        zIndex:         9000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:    '#fff',
          borderRadius:  20,
          paddingTop:    28,
          paddingBottom: 28,
          paddingLeft:   28,
          paddingRight:  28,
          width:         '100%',
          maxWidth:      480,
          boxShadow:     '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B6B' }}>
            Add New {role === 'artisan' ? 'Artisan' : 'Customer'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#6B7494',
              display: 'flex', alignItems: 'center',
            }}
          >
            {Ico.x}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full Name */}
          <div>
            <label style={lbl}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
              style={inp}
            />
          </div>

          {/* Email */}
          <div>
            <label style={lbl}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              style={inp}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={lbl}>Phone Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +233241234567"
              style={inp}
            />
          </div>

          {/* Password */}
          <div>
            <label style={lbl}>Password <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={inp}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex:          1,
              paddingTop:    10,
              paddingBottom: 10,
              paddingLeft:   0,
              paddingRight:  0,
              background:    '#1B2B6B',
              color:         '#fff',
              border:        'none',
              borderRadius:  10,
              cursor:        saving ? 'not-allowed' : 'pointer',
              fontSize:      14,
              fontWeight:    600,
              opacity:       saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Creating...' : `Create ${role === 'artisan' ? 'Artisan' : 'Customer'}`}
          </button>
          <button
            onClick={onClose}
            style={{
              paddingTop:    10,
              paddingBottom: 10,
              paddingLeft:   20,
              paddingRight:  20,
              background:    '#F5F7FF',
              color:         '#6B7494',
              border:        'none',
              borderRadius:  10,
              cursor:        'pointer',
              fontSize:      14,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}