'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { Ico } from '../icons'
import { toast } from '../Toaster'

interface AdminProfile {
  id: string
  full_name: string
  phone: string | null
  role: string
  created_at: string
  email: string
  avatar_url: string | null
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  finance: 'Finance',
  support: 'Support Agent',
  moderator: 'Moderator',
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: '#f3e8ff', color: '#7c3aed' },
  admin: { bg: '#dbeafe', color: '#1d4ed8' },
  finance: { bg: '#dcfce7', color: '#15803d' },
  support: { bg: '#fef9c3', color: '#a16207' },
  moderator: { bg: '#f3f4f6', color: '#6b7280' },
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const fieldBoxBase: React.CSSProperties = {
  fontSize: 14,
  color: '#1B2B6B',
  background: '#F5F7FF',
  border: '1px solid #E8EDF8',
  borderRadius: 10,
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 14,
  paddingRight: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7494',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 6,
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, created_at, avatar_url')
        .eq('id', user.id)
        .single()

      if (prof) {
        const p: AdminProfile = {
          id: prof.id,
          full_name: prof.full_name || '',
          phone: prof.phone || null,
          role: prof.role || 'admin',
          created_at: prof.created_at || '',
          email: user.email || '',
          avatar_url: prof.avatar_url || null,
        }
        setProfile(p)
        setName(p.full_name)
        setPhone(p.phone || '')
        setAvatar(p.avatar_url)
      }
    } catch (err) {
      console.warn('fetchProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5MB', 'error')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!profile) return
    setSaving(true)

    let avatarUrl = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg'
      const path = `avatars/admin-${profile.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

      if (uploadError) {
        toast('Failed to upload photo: ' + uploadError.message, 'error')
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Cache-bust so browser fetches the new image instead of showing old cached one
      avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
      })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev =>
        prev ? { ...prev, full_name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl } : prev
      )
      // Use real Supabase URL — not the local blob preview
      setAvatar(avatarUrl)
      setAvatarFile(null)
      setEditing(false)
      toast('Profile updated successfully', 'success')
    } else {
      toast('Failed to save: ' + error.message, 'error')
    }

    setSaving(false)
  }

  const discard = () => {
    if (!profile) return
    setEditing(false)
    setName(profile.full_name)
    setPhone(profile.phone || '')
    setAvatar(profile.avatar_url)
    setAvatarFile(null)
  }

  const roStyle = ROLE_STYLE[profile?.role || ''] ?? { bg: '#f3f4f6', color: '#6b7280' }

  if (loading) {
    return (
      <div style={{
        paddingTop: 80,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: 'center',
        color: '#6B7494',
      }}>
        Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{
        paddingTop: 80,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: 'center',
        color: '#6B7494',
      }}>
        Profile not found. Please sign in.
      </div>
    )
  }

  return (
    <div style={{
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      maxWidth: 720,
      margin: '0 auto',
    }}>

      {/* ── Hero card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2B6B 0%, #243680 100%)',
        borderRadius: 20,
        paddingTop: 28,
        paddingBottom: 28,
        paddingLeft: 28,
        paddingRight: 28,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>

        {/* Avatar with upload button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: 88,
            background: '#FFB800',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: '#1B2B6B',
            overflow: 'hidden',
          }}>
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  const img = e.currentTarget as HTMLImageElement
                  img.style.display = 'none'
                  if (img.parentElement) {
                    img.parentElement.innerText = getInitials(profile.full_name)
                  }
                }}
              />
            ) : (
              getInitials(profile.full_name)
            )}
          </div>

          {editing && (
            <>
              <button
                onClick={() => avatarRef.current?.click()}
                title="Change profile photo"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 28,
                  background: '#fff',
                  border: '2px solid #1B2B6B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1B2B6B',
                }}
              >
                {Ico.edit}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={pickAvatar}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
            {profile.full_name || '—'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>
            {profile.email}
          </p>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 20,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.15)',
              color: '#FFB800',
            }}>
              {ROLE_LABEL[profile.role] || profile.role}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              Member since{' '}
              {new Date(profile.created_at).toLocaleDateString('en-GH', {
                month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Edit / Cancel button */}
        <button
          onClick={() => editing ? discard() : setEditing(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 18,
            paddingRight: 18,
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {Ico.edit}
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* ── Profile details card ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E8EDF8',
        borderRadius: 16,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 20 }}>
          Profile Information
        </h3>

        {/* New photo pending upload banner */}
        {avatarFile && (
          <div style={{
            background: '#E6F7F2',
            border: '1px solid #A7F3D0',
            borderRadius: 8,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            marginBottom: 16,
            fontSize: 13,
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>📷</span>
            New photo selected: <strong>{avatarFile.name}</strong> — will upload on save
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} style={fieldBoxBase} />
            ) : (
              <div style={{ ...fieldBoxBase, fontWeight: 500 }}>{profile.full_name || '—'}</div>
            )}
          </div>

          {/* Email — always read-only */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <div style={{ ...fieldBoxBase, color: '#6B7494', fontFamily: 'monospace', fontSize: 13 }}>
              {profile.email}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            {editing ? (
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 ..." style={fieldBoxBase} />
            ) : (
              <div style={{ ...fieldBoxBase, fontWeight: 500 }}>{profile.phone || '—'}</div>
            )}
          </div>

          {/* Role — always read-only */}
          <div>
            <label style={labelStyle}>Admin Role</label>
            <div style={{ ...fieldBoxBase, display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontSize: 12,
                paddingTop: 2,
                paddingBottom: 2,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 20,
                fontWeight: 700,
                background: roStyle.bg,
                color: roStyle.color,
              }}>
                {ROLE_LABEL[profile.role] || profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Save / Discard */}
        {editing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 28,
                paddingRight: 28,
                background: '#1B2B6B',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={discard}
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 20,
                paddingRight: 20,
                background: '#F5F7FF',
                color: '#6B7494',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* ── Account info card ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E8EDF8',
        borderRadius: 16,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2B6B', marginBottom: 16 }}>
          Account Information
        </h3>

        {[
          { label: 'Account ID', value: profile.id, mono: true },
          { label: 'Account Type', value: ROLE_LABEL[profile.role] || profile.role, mono: false },
          {
            label: 'Member Since',
            value: new Date(profile.created_at).toLocaleDateString('en-GH', {
              day: 'numeric', month: 'long', year: 'numeric',
            }),
            mono: false,
          },
          { label: 'Status', value: 'Active', mono: false },
        ].map((f, i, arr) => (
          <div
            key={f.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 10,
              paddingBottom: 10,
              borderBottom: i < arr.length - 1 ? '1px solid #F5F7FF' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#6B7494' }}>{f.label}</span>
            <span style={{
              fontSize: 13,
              color: f.label === 'Status' ? '#15803d' : '#1B2B6B',
              fontWeight: 500,
              fontFamily: f.mono ? 'monospace' : 'inherit',
              maxWidth: 260,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}