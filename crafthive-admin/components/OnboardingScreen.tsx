'use client'
import { useState, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { supabase } from '@/lib/supabase'
import { Ico } from './icons'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

const SLIDES = [
  {
    tag: 'Welcome',
    headline: 'One dashboard to run CraftHive',
    body: 'Manage every artisan, booking, payment, and dispute across Ghana — all from a single, powerful admin panel.',
    image: '/onboard1.jpg',
  },
  {
    tag: 'Operations',
    headline: 'KYC, bookings & disputes — handled',
    body: 'Verify artisan identities, track every job from booking to completion, and resolve disputes with a full evidence trail.',
    image: '/onboard2.jpg',
  },
  {
    tag: 'Analytics',
    headline: 'Real-time insights on every metric',
    body: 'Revenue trends, user growth, artisan performance, and commission breakdowns — updated live so you always know the full picture.',
    image: '/onboard3.jpg',
  },
  {
    tag: 'Get Started',
    headline: 'Ready to take control?',
    body: 'Sign in to your existing admin account, register a new one, or browse as a guest to explore the dashboard.',
    image: '/onboard4.jpg',
  },
]

const ADMIN_ROLES = ['Admin', 'Finance', 'Support Agent', 'Moderator']
const ID_TYPES = ['Ghana Card', 'Passport', 'NHIS Card', 'Voter ID']

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: (guest?: boolean) => void
}) {
  const [current, setCurrent] = useState(0)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regStep, setRegStep] = useState(1) // 1 = account, 2 = profile
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regRole, setRegRole] = useState('Admin')
  const [regIdType, setRegIdType] = useState('Ghana Card')
  const [regIdImage, setRegIdImage] = useState<string | null>(null)
  const [regIdFile, setRegIdFile] = useState<File | null>(null)
  const [regAvatar, setRegAvatar] = useState<string | null>(null)
  const [regAvatarFile, setRegAvatarFile] = useState<File | null>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isLast = current === SLIDES.length - 1
  const slide = SLIDES[current]

  const resetForm = () => {
    setLoginEmail(''); setLoginPassword('')
    setRegName(''); setRegEmail(''); setRegPassword('')
    setRegPhone(''); setRegRole('Admin'); setRegIdType('Ghana Card')
    setRegIdImage(null); setRegIdFile(null)
    setRegAvatar(null); setRegAvatarFile(null)
    setRegStep(1); setError('')
    setCaptchaToken(null)
    recaptchaRef.current?.reset()
  }

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRegAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setRegAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const pickIdCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRegIdFile(file)
    const reader = new FileReader()
    reader.onload = ev => setRegIdImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please fill in all fields'); return
    }
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      setError('Please complete the reCAPTCHA verification'); return
    }
    setLoading(true); setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(), password: loginPassword,
    })
    if (err) {
      setError(err.message.includes('Invalid login credentials')
        ? 'Incorrect email or password. Please try again.'
        : err.message)
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()
    if (!profile || !['admin', 'superadmin', 'support', 'finance', 'moderator'].includes(profile.role)) {
      setError('Access denied. You do not have admin privileges.')
      await supabase.auth.signOut()
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }
    onComplete(false)
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      setError('Please enter your email address first to reset your password.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
      redirectTo: window.location.origin
    })
    
    if (err) {
      setError(err.message)
    } else {
      setError('✓ Password reset link sent to your email. Please check your inbox.')
    }
    setLoading(false)
  }

  const handleRegisterStep1 = () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) {
      setError('Please fill in all fields'); return
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters'); return
    }
    setError(''); setRegStep(2)
  }

  const handleRegisterStep2 = async () => {
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      setError('Please complete the reCAPTCHA verification'); return
    }
    setLoading(true); setError('')

    const roleMap: Record<string, string> = {
      'Admin': 'admin', 'Finance': 'finance',
      'Support Agent': 'support', 'Moderator': 'moderator',
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        data: {
          full_name: regName.trim(),
          role: roleMap[regRole] || 'admin',
          phone: regPhone.trim(),
        },
      },
    })
    if (err) {
      setError(err.message)
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }

    if (data.user) {
      // Update profile with phone and role
      await supabase.from('profiles').update({
        full_name: regName.trim(),
        phone: regPhone.trim(),
        role: roleMap[regRole] || 'admin',
      }).eq('id', data.user.id)

      // Upload avatar if provided
      if (regAvatarFile) {
        const ext = regAvatarFile.name.split('.').pop()
        const path = `avatars/${data.user.id}.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(path, regAvatarFile, { upsert: true })
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(path)
          await supabase.from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', data.user.id)
        }
      }

      // Upload national ID if provided
      if (regIdFile) {
        const ext = regIdFile.name.split('.').pop()
        const path = `national-ids/${data.user.id}.${ext}`
        await supabase.storage
          .from('avatars')
          .upload(path, regIdFile, { upsert: true })
      }
    }

    onComplete(false)
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#fff',
    border: '1px solid #E8EDF8', borderRadius: 10,
    padding: '11px 16px', fontSize: 14,
    color: '#1B2B6B', outline: 'none', marginTop: 6,
  }

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#1B2B6B',
    textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      background: '#1B2B6B', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        width: '50%', position: 'relative', overflow: 'hidden',
        flexShrink: 0, background: '#0f1d47',
        display: 'flex', flexDirection: 'column',
      }}>
        <img src={slide.image} alt={slide.tag} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: isLast ? 0.4 : 0.55,
          transition: 'opacity 0.4s',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(11,29,71,0.97) 0%, rgba(11,29,71,0.5) 50%, rgba(11,29,71,0.15) 100%)',
        }} />

        {/* Logo */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '32px 36px',
        }}>
          <div style={{
            width: 38, height: 38, background: '#FFB800',
            borderRadius: 10, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo.png" alt="CraftHive" style={{ width: 30, objectFit: 'contain' }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>CraftHive</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 3 }}>Admin Platform</p>
          </div>
        </div>

        {/* Feature grid on last slide */}
        {isLast && (
          <div style={{
            position: 'relative', zIndex: 2, flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 36px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
              {[
                { icon: Ico.lock,     label: 'Secure Login',        sub: 'JWT + 2FA protection' },
                { icon: Ico.shield,   label: 'Role-based Access',   sub: 'Admin, Finance, Support' },
                { icon: Ico.bell,     label: 'Live Notifications',  sub: 'Real-time alerts' },
                { icon: Ico.barChart, label: 'Ghana-first Platform', sub: 'Built for local artisans' },
              ].map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                  borderRadius: 14, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: i === 0 ? '#FFB800' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i === 0 ? '#1B2B6B' : '#fff',
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{f.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dots */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 36px 36px',
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); if (i !== SLIDES.length - 1) setAuthMode(null) }}
              style={{
                border: 'none', cursor: 'pointer', padding: 0,
                borderRadius: 10, flexShrink: 0,
                width: i === current ? 28 : 8, height: 8,
                background: i === current ? '#FFB800' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
              }} />
          ))}
          <span style={{
            marginLeft: 'auto', color: 'rgba(255,255,255,0.35)',
            fontSize: 12, fontFamily: 'monospace',
          }}>
            {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, background: '#F5F7FF',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '32px 52px',
        overflowY: 'auto',
      }}>
        {!isLast || !authMode ? (
          /* ── Slide content ── */
          <div style={{ maxWidth: 420, width: '100%' }}>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              color: '#FFB800', background: 'rgba(255,184,0,0.12)',
              padding: '4px 14px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20,
            }}>
              {slide.tag}
            </span>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#1B2B6B', lineHeight: 1.2, marginBottom: 14 }}>
              {slide.headline}
            </h1>
            <p style={{ color: '#6B7494', lineHeight: 1.75, marginBottom: 36, fontSize: 15 }}>
              {slide.body}
            </p>

            {isLast ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => { setAuthMode('login'); resetForm() }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', background: '#1B2B6B', color: '#fff',
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB800',
                    }}>
                      {Ico.lock}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Sign in to your account</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Existing admin credentials</p>
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Ico.arrowR}</span>
                </button>

                <button onClick={() => { setAuthMode('register'); resetForm() }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', background: '#fff', color: '#1B2B6B',
                  border: '2px solid #E8EDF8', borderRadius: 14, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: '#EEF1FB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B2B6B',
                    }}>
                      {Ico.users}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Register as new admin</p>
                      <p style={{ color: '#6B7494', fontSize: 12, marginTop: 4 }}>Create a new admin account</p>
                    </div>
                  </div>
                  <span style={{ color: '#6B7494' }}>{Ico.arrowR}</span>
                </button>

                <button onClick={() => onComplete(true)} style={{
                  padding: '13px 20px', background: 'transparent',
                  color: '#6B7494', border: '1.5px dashed #D1D5DB',
                  borderRadius: 14, cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>{Ico.eye}</span>
                  Continue as guest (limited access)
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                {current > 0 && (
                  <button onClick={() => setCurrent(c => c - 1)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '11px 20px', background: '#fff',
                    border: '1px solid #E8EDF8', borderRadius: 10,
                    color: '#1B2B6B', cursor: 'pointer', fontSize: 14,
                  }}>
                    {Ico.chevronL} Back
                  </button>
                )}
                <button onClick={() => setCurrent(c => c + 1)} style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  padding: '11px 24px', background: '#1B2B6B', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700,
                }}>
                  Next {Ico.chevronR}
                </button>
              </div>
            )}

            {!isLast && (
              <button onClick={() => onComplete(true)} style={{
                marginTop: 22, background: 'none', border: 'none',
                color: '#6B7494', cursor: 'pointer', fontSize: 13,
                width: '100%', textAlign: 'center',
              }}>
                Skip — browse as guest
              </button>
            )}
          </div>
        ) : authMode === 'login' ? (
          /* ── Login form ── */
          <div style={{ maxWidth: 420, width: '100%' }}>
            <button onClick={() => { setAuthMode(null); resetForm() }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: '#6B7494',
              cursor: 'pointer', fontSize: 14, marginBottom: 28,
            }}>
              {Ico.chevronL} Back
            </button>

            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              color: '#FFB800', background: 'rgba(255,184,0,0.12)',
              padding: '4px 14px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18,
            }}>
              Sign In
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1B2B6B', marginBottom: 8 }}>
              Welcome back
            </h2>
            <p style={{ color: '#6B7494', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Enter your admin credentials to access the dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="franklanking65@gmail.com" type="email" style={inp} />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••" type="password" style={inp} />
              </div>
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button 
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                  background: 'none', border: 'none', color: '#1B2B6B',
                  fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}>
                  Forgot password?
                </button>
              </div>

              {/* reCAPTCHA */}
              <div>
                <label style={{ ...lbl, marginBottom: 8 }}>Human Verification</label>
                <div style={{
                  background: '#fff', border: '1px solid #E8EDF8',
                  borderRadius: 10, padding: '10px 14px', display: 'inline-flex',
                }}>
                  {RECAPTCHA_SITE_KEY ? (
                    <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY}
                      onChange={t => setCaptchaToken(t)}
                      onExpired={() => setCaptchaToken(null)} theme="light" />
                  ) : (
                    <div style={{
                      padding: '8px 12px', background: '#dcfce7',
                      borderRadius: 8, fontSize: 12, color: '#15803d', lineHeight: 1.5,
                    }}>
                      ✓ Human verification bypassed (No Site Key configured)
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{
                  color: error.startsWith('✓') ? '#15803d' : '#dc2626', 
                  fontSize: 13, 
                  background: error.startsWith('✓') ? '#dcfce7' : '#fee2e2',
                  padding: '10px 14px', borderRadius: 8, lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button onClick={handleLogin} disabled={loading}
                style={{
                  padding: '13px', background: '#1B2B6B', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#6B7494', textAlign: 'center', marginTop: 20 }}>
              No account yet?{' '}
              <button onClick={() => { setAuthMode('register'); resetForm() }} style={{
                background: 'none', border: 'none', color: '#1B2B6B',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}>
                Register
              </button>
            </p>
            <button onClick={() => onComplete(true)} style={{
              width: '100%', marginTop: 12, background: 'none', border: 'none',
              color: '#6B7494', cursor: 'pointer', fontSize: 13, textAlign: 'center',
            }}>
              Or continue as guest →
            </button>
          </div>
        ) : (
          /* ── Register form — 2 steps ── */
          <div style={{ maxWidth: 480, width: '100%' }}>
            <button onClick={() => {
              if (regStep === 2) { setRegStep(1); setError('') }
              else { setAuthMode(null); resetForm() }
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: '#6B7494',
              cursor: 'pointer', fontSize: 14, marginBottom: 24,
            }}>
              {Ico.chevronL} {regStep === 2 ? 'Back to account details' : 'Back'}
            </button>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: regStep >= s ? '#1B2B6B' : '#E8EDF8',
                    color: regStep >= s ? '#fff' : '#6B7494',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {s}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: regStep === s ? 600 : 400,
                    color: regStep === s ? '#1B2B6B' : '#6B7494',
                  }}>
                    {s === 1 ? 'Account Details' : 'Identity & Role'}
                  </span>
                  {s < 2 && (
                    <div style={{
                      width: 32, height: 2, borderRadius: 1,
                      background: regStep > s ? '#1B2B6B' : '#E8EDF8',
                      marginRight: 4,
                    }} />
                  )}
                </div>
              ))}
            </div>

            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              color: '#FFB800', background: 'rgba(255,184,0,0.12)',
              padding: '4px 14px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16,
            }}>
              Register — Step {regStep} of 2
            </span>

            {regStep === 1 ? (
              /* Step 1 — account details */
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2B6B', marginBottom: 6 }}>
                  Create your account
                </h2>
                <p style={{ color: '#6B7494', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                  Fill in your basic details to get started.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Avatar upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      style={{
                        width: 72, height: 72, borderRadius: 72,
                        background: regAvatar ? 'transparent' : '#EEF1FB',
                        border: '2px dashed #1B2B6B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                      }}
                    >
                      {regAvatar ? (
                        <img src={regAvatar} alt="Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#1B2B6B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {Ico.user}
                          <span style={{ fontSize: 9, fontWeight: 600 }}>PHOTO</span>
                        </span>
                      )}
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*"
                      onChange={pickAvatar} style={{ display: 'none' }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                        Profile Photo
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7494', marginTop: 3 }}>
                        Click to upload. JPG or PNG.
                      </p>
                      {regAvatar && (
                        <button
                          onClick={() => { setRegAvatar(null); setRegAvatarFile(null) }}
                          style={{
                            marginTop: 4, background: 'none', border: 'none',
                            color: '#dc2626', fontSize: 12, cursor: 'pointer', padding: 0,
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Full Name *</label>
                    <input value={regName} onChange={e => setRegName(e.target.value)}
                      placeholder="Serena Adu" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email Address *</label>
                    <input value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      placeholder="franklanking65@gmail.com" type="email" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Password *</label>
                    <input value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters" type="password" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Phone Number *</label>
                    <input value={regPhone} onChange={e => setRegPhone(e.target.value)}
                      placeholder="+233 ..." style={inp} />
                  </div>

                  {error && (
                    <div style={{
                      color: '#dc2626', fontSize: 13, background: '#fee2e2',
                      padding: '10px 14px', borderRadius: 8,
                    }}>
                      {error}
                    </div>
                  )}

                  <button onClick={handleRegisterStep1} style={{
                    padding: '13px', background: '#1B2B6B', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                    Continue →
                  </button>
                </div>
              </>
            ) : (
              /* Step 2 — identity + role */
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2B6B', marginBottom: 6 }}>
                  Identity & Role
                </h2>
                <p style={{ color: '#6B7494', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                  Upload your national ID and select your admin role.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Role selection */}
                  <div>
                    <label style={lbl}>Admin Role *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {ADMIN_ROLES.map(r => (
                        <button key={r} onClick={() => setRegRole(r)} style={{
                          padding: '7px 16px', borderRadius: 20,
                          border: `1.5px solid ${regRole === r ? '#1B2B6B' : '#E8EDF8'}`,
                          background: regRole === r ? '#1B2B6B' : '#fff',
                          color: regRole === r ? '#fff' : '#6B7494',
                          cursor: 'pointer', fontSize: 13, fontWeight: regRole === r ? 600 : 400,
                          transition: 'all 0.15s',
                        }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ID type */}
                  <div>
                    <label style={lbl}>National ID Type *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {ID_TYPES.map(t => (
                        <button key={t} onClick={() => setRegIdType(t)} style={{
                          padding: '7px 16px', borderRadius: 20,
                          border: `1.5px solid ${regIdType === t ? '#1B2B6B' : '#E8EDF8'}`,
                          background: regIdType === t ? '#1B2B6B' : '#fff',
                          color: regIdType === t ? '#fff' : '#6B7494',
                          cursor: 'pointer', fontSize: 13, fontWeight: regIdType === t ? 600 : 400,
                          transition: 'all 0.15s',
                        }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ID upload */}
                  <div>
                    <label style={lbl}>Upload {regIdType} *</label>
                    <div
                      onClick={() => idInputRef.current?.click()}
                      style={{
                        marginTop: 8,
                        border: `2px dashed ${regIdImage ? '#1B2B6B' : '#E8EDF8'}`,
                        borderRadius: 12, padding: regIdImage ? 0 : '20px',
                        background: regIdImage ? 'transparent' : '#F5F7FF',
                        cursor: 'pointer', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {regIdImage ? (
                        <div style={{ position: 'relative', width: '100%' }}>
                          <img src={regIdImage} alt="ID"
                            style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                          <button
                            onClick={e => { e.stopPropagation(); setRegIdImage(null); setRegIdFile(null) }}
                            style={{
                              position: 'absolute', top: 8, right: 8,
                              background: '#dc2626', color: '#fff',
                              border: 'none', borderRadius: 6,
                              padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ color: '#6B7494', display: 'flex', alignItems: 'center' }}>
                            {Ico.eye}
                          </span>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1B2B6B' }}>
                            Click to upload {regIdType}
                          </p>
                          <p style={{ fontSize: 12, color: '#6B7494' }}>
                            Clear photo of the front of your ID
                          </p>
                        </>
                      )}
                    </div>
                    <input ref={idInputRef} type="file" accept="image/*"
                      onChange={pickIdCard} style={{ display: 'none' }} />
                  </div>

                  {/* reCAPTCHA */}
                  <div>
                    <label style={{ ...lbl, marginBottom: 8 }}>Human Verification *</label>
                    <div style={{
                      background: '#fff', border: '1px solid #E8EDF8',
                      borderRadius: 10, padding: '10px 14px', display: 'inline-flex',
                    }}>
                      {RECAPTCHA_SITE_KEY ? (
                        <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY}
                          onChange={t => setCaptchaToken(t)}
                          onExpired={() => setCaptchaToken(null)} theme="light" />
                      ) : (
                        <div style={{
                          padding: '8px 12px', background: '#dcfce7',
                          borderRadius: 8, fontSize: 12, color: '#15803d',
                        }}>
                          ✓ Human verification bypassed (No Site Key configured)
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div style={{
                      color: '#dc2626', fontSize: 13, background: '#fee2e2',
                      padding: '10px 14px', borderRadius: 8,
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleRegisterStep2}
                    disabled={loading}
                    style={{
                      padding: '13px', background: '#1B2B6B', color: '#fff',
                      border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>

                <p style={{ fontSize: 13, color: '#6B7494', textAlign: 'center', marginTop: 16 }}>
                  Already registered?{' '}
                  <button onClick={() => { setAuthMode('login'); resetForm() }} style={{
                    background: 'none', border: 'none', color: '#1B2B6B',
                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                  }}>
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}