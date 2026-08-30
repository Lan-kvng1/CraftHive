'use client'
import { useState, useRef, useEffect } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { supabase } from '@/lib/supabase'
import { Ico } from './icons'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
const ADMIN_ROLES = ['Admin', 'Finance', 'Support Agent', 'Moderator']
const ID_TYPES = ['Ghana Card', 'Passport', 'NHIS Card', 'Voter ID']

export default function OnboardingScreen({
  onComplete,
  initialMode = null,
}: {
  onComplete: (guest?: boolean) => void
  initialMode?: 'login' | 'register' | 'forgot' | 'reset' | null
}) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset' | null>(initialMode ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)

  // Register
  const [regStep, setRegStep] = useState(1)
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

  // Forgot / Reset password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showNewPwConfirm, setShowNewPwConfirm] = useState(false)

  // Hero Background Slideshow State
  const HERO_SLIDES = [
    { title: 'Master Plumber', category: 'Plumbing & Pipefitting', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=80' },
    { title: 'Custom Tailor', category: 'Fashion & Apparel', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600&q=80' },
    { title: 'Certified Electrician', category: 'Electrical & Wiring', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80' },
    { title: 'Precision Carpenter', category: 'Woodwork & Furniture', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80' },
    { title: 'Pro Painter', category: 'Interior & Exterior Finish', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1600&q=80' },
    { title: 'Auto Specialist', category: 'Mechanical Services', url: 'https://images.unsplash.com/photo-1592853626048-37d1f7e1d16c?w=1600&q=80' },
  ]
  const [heroSlideIdx, setHeroSlideIdx] = useState(0)

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % HERO_SLIDES.length)
    }, 4500)
    return () => clearInterval(slideTimer)
  }, [])

  const resetForm = () => {
    setLoginEmail(''); setLoginPassword('')
    setRegName(''); setRegEmail(''); setRegPassword(''); setRegPhone('')
    setRegRole('Admin'); setRegIdType('Ghana Card')
    setRegIdImage(null); setRegIdFile(null)
    setRegAvatar(null); setRegAvatarFile(null)
    setRegStep(1); setError(''); setCaptchaToken(null)
    setForgotEmail(''); setForgotSent(false)
    setNewPassword(''); setNewPasswordConfirm('')
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
    if (!loginEmail.trim() || !loginPassword.trim()) { setError('Please fill in all fields'); return }
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError('Please complete the reCAPTCHA verification'); return }
    setLoading(true); setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword })
    if (err) {
      setError(err.message.includes('Invalid login credentials') ? 'Incorrect email or password. Please try again.' : err.message)
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (!profile || !['admin', 'superadmin', 'support', 'finance', 'moderator'].includes(profile.role)) {
      setError('Access denied. You do not have admin privileges.')
      await supabase.auth.signOut()
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }
    onComplete(false)
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}`,
      })
      if (err) {
        setError(err.message)
      } else {
        setForgotSent(true)
      }
    } catch (e: any) {
      // TypeError: Failed to fetch — network error or Supabase project is paused
      if (e?.name === 'TypeError' || e?.message?.includes('fetch')) {
        setError('Network error — cannot reach the server. Your Supabase project may be paused (free tier) or you may be offline. Please visit your Supabase dashboard to wake the project, then try again.')
      } else {
        setError(e?.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword.trim()) { setError('Please enter a new password.'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPassword !== newPasswordConfirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      setError(err.message)
      setLoading(false); return
    }
    // After successful reset, sign in automatically and proceed
    onComplete(false)
  }

  const handleRegisterStep1 = () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) { setError('Please fill in all fields'); return }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setRegStep(2)
  }

  const handleRegisterStep2 = async () => {
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError('Please complete the reCAPTCHA verification'); return }
    setLoading(true); setError('')

    const roleMap: Record<string, string> = { 'Admin': 'admin', 'Finance': 'finance', 'Support Agent': 'support', 'Moderator': 'moderator' }

    const { data, error: err } = await supabase.auth.signUp({
      email: regEmail.trim(), password: regPassword,
      options: { data: { full_name: regName.trim(), role: roleMap[regRole] || 'admin', phone: regPhone.trim() } },
    })
    
    if (err) {
      setError(err.message)
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false); return
    }

    if (data.user) {
      await supabase.from('profiles').update({ full_name: regName.trim(), phone: regPhone.trim(), role: roleMap[regRole] || 'admin' }).eq('id', data.user.id)
      if (regAvatarFile) {
        const ext = regAvatarFile.name.split('.').pop()
        const path = `avatars/${data.user.id}.${ext}`
        const { data: uploadData } = await supabase.storage.from('avatars').upload(path, regAvatarFile, { upsert: true })
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', data.user.id)
        }
      }
      if (regIdFile) {
        const ext = regIdFile.name.split('.').pop()
        const path = `national-ids/${data.user.id}.${ext}`
        await supabase.storage.from('avatars').upload(path, regIdFile, { upsert: true })
      }
    }
    onComplete(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#060F1D', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12,
    padding: '14px 16px', fontSize: 14, color: '#FFFFFF', outline: 'none', marginTop: 6, transition: 'all 0.2s'
  }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#fff', color: '#1B2B6B' }}>
      
      {/* FIXED NAVBAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,22,40,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            background: 'rgba(255,184,0,0.12)',
            border: '1px solid rgba(255,184,0,0.2)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/logo.png" alt="CraftHive" style={{ width: 26, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>CraftHive Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          <button onClick={() => { setAuthMode('login'); resetForm() }}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '8px 16px' }}>Sign In</button>
          <button onClick={() => { setAuthMode('register'); resetForm() }}
            style={{ background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '10px 20px' }}>Register</button>
        </div>
      </header>



      {/* AUTH OVERLAY MODAL */}
      {authMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(16px)', padding: 20 }}>
          <div className="auth-modal-card" style={{ background: '#0A1628', border: '1px solid rgba(255,184,0,0.25)', padding: 40, borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 30px 90px rgba(0,0,0,0.8)', position: 'relative', maxHeight: '90vh', overflowY: 'auto', color: '#fff' }}>
            
            <button onClick={() => setAuthMode(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              {Ico.x}
            </button>

            {authMode === 'forgot' ? (
              <>
                <button onClick={() => { setAuthMode('login'); setError(''); setForgotSent(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20, marginTop: 10, padding: 0 }}>
                  {Ico.chevronL} Back to Sign In
                </button>
                {!forgotSent ? (
                  <>
                    <div style={{ width: 56, height: 56, background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#FFB800' }}>
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Reset Password</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Enter your admin email address and we'll send you a secure link to reset your password.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div><label style={lbl}>Email Address</label><input value={forgotEmail || ''} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} placeholder="admin@crafthive.com" type="email" style={inp} /></div>
                      {error && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', borderRadius: 10 }}>{error}</div>}
                      <button onClick={handleForgotPassword} disabled={loading} style={{ padding: '16px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, color: '#34D399' }}>✓</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Check Your Email</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
                      A password reset link has been sent to<br />
                      <strong style={{ color: '#FFB800' }}>{forgotEmail}</strong>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                      Click the link in the email to be brought back here to set a new password. Check your spam folder if you don't see it.
                    </p>
                    <button onClick={() => { setAuthMode('login'); setForgotSent(false); setForgotEmail('') }} style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Back to Sign In
                    </button>
                  </div>
                )}
              </>
            ) : authMode === 'reset' ? (
              <>
                <div style={{ width: 56, height: 56, background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 10, color: '#FFB800' }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Set New Password</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Choose a strong password for your admin account. You'll be signed in automatically after.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={lbl}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input value={newPassword || ''} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" type={showNewPw ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowNewPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: 4 }}>
                        {showNewPw ? (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input value={newPasswordConfirm || ''} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="Re-enter password" type={showNewPwConfirm ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowNewPwConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: 4 }}>
                        {showNewPwConfirm ? (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {error && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', borderRadius: 10 }}>{error}</div>}
                  <button onClick={handleResetPassword} disabled={loading} style={{ padding: '16px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Saving Password...' : 'Save New Password & Sign In'}
                  </button>
                </div>
              </>
            ) : authMode === 'login' ? (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, marginTop: 10 }}>Welcome Back</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 32 }}>Enter your admin credentials to access the command center.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div><label style={lbl}>Email Address</label><input value={loginEmail || ''} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@crafthive.com" type="email" style={inp} /></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={lbl}>Password</label>
                      <button onClick={() => { setAuthMode('forgot'); setError('') }} style={{ background: 'none', border: 'none', color: '#FFB800', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Forgot?</button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input value={loginPassword || ''} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" type={showLoginPw ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowLoginPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: 4 }} title={showLoginPw ? 'Hide password' : 'Show password'}>
                        {showLoginPw ? (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div style={{ minHeight: 78 }}>
                    {RECAPTCHA_SITE_KEY ? (
                      <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={t => setCaptchaToken(t)} onExpired={() => setCaptchaToken(null)} theme="dark" />
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> reCAPTCHA not configured — add <code>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> to .env.local
                      </div>
                    )}
                  </div>
                  {error && <div style={{ color: error.startsWith('✓') ? '#34D399' : '#ef4444', fontSize: 13, background: error.startsWith('✓') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${error.startsWith('✓') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '12px 16px', borderRadius: 10 }}>{error}</div>}
                  <button onClick={handleLogin} disabled={loading} style={{ padding: '16px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 10 }}>
                  {regStep === 2 && <button onClick={() => setRegStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>{Ico.chevronL}</button>}
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{regStep === 1 ? 'Create Account' : 'Identity & Role'}</h2>
                </div>
                
                {regStep === 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div onClick={() => avatarInputRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 64, background: regAvatar ? 'transparent' : '#060F1D', border: '2px dashed #FFB800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                        {regAvatar ? <img src={regAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#FFB800' }}>{Ico.user}</span>}
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
                      <div><p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Profile Photo</p><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Upload a professional headshot</p></div>
                    </div>
                    <div><label style={lbl}>Full Name *</label><input value={regName || ''} onChange={e => setRegName(e.target.value)} placeholder="e.g. Serena Adu" style={inp} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><label style={lbl}>Email *</label><input value={regEmail || ''} onChange={e => setRegEmail(e.target.value)} placeholder="admin@crafthive.com" type="email" style={inp} /></div>
                      <div><label style={lbl}>Phone *</label><input value={regPhone || ''} onChange={e => setRegPhone(e.target.value)} placeholder="+233 ..." style={inp} /></div>
                    </div>
                    <div>
                      <label style={lbl}>Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input value={regPassword || ''} onChange={e => setRegPassword(e.target.value)} placeholder="Min. 6 characters" type={showRegPw ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} />
                        <button
                          type="button"
                          onClick={() => setShowRegPw(v => !v)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: 4 }}
                          title={showRegPw ? 'Hide password' : 'Show password'}
                        >
                          {showRegPw ? (
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {error && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', borderRadius: 10 }}>{error}</div>}
                    <button onClick={handleRegisterStep1} style={{ padding: '16px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Continue <span>→</span></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={lbl}>Admin Role *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                        {ADMIN_ROLES.map(r => <button key={r} onClick={() => setRegRole(r)} style={{ padding: '12px', borderRadius: 10, border: `1px solid ${regRole === r ? '#FFB800' : 'rgba(255,255,255,0.12)'}`, background: regRole === r ? 'rgba(255,184,0,0.15)' : '#060F1D', color: regRole === r ? '#FFB800' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', textAlign: 'left' }}>{r}</button>)}
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>National ID Type *</label>
                      <select value={regIdType} onChange={e => setRegIdType(e.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none' }}>
                        {ID_TYPES.map(t => <option key={t} value={t} style={{ background: '#0A1628', color: '#fff' }}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Upload {regIdType} *</label>
                      <div onClick={() => idInputRef.current?.click()} style={{ marginTop: 10, border: `2px dashed ${regIdImage ? '#FFB800' : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: regIdImage ? 0 : '32px', background: regIdImage ? 'transparent' : '#060F1D', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {regIdImage ? <img src={regIdImage} alt="ID" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <><div style={{ width: 40, height: 40, background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB800' }}>{Ico.eye}</div><p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Click to browse</p></>}
                      </div>
                      <input ref={idInputRef} type="file" accept="image/*" onChange={pickIdCard} style={{ display: 'none' }} />
                    </div>
                    <div style={{ minHeight: 78 }}>
                      {RECAPTCHA_SITE_KEY ? (
                        <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={t => setCaptchaToken(t)} onExpired={() => setCaptchaToken(null)} theme="dark" />
                      ) : (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> reCAPTCHA not configured — add <code>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> to .env.local
                        </div>
                      )}
                    </div>
                    {error && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', borderRadius: 10 }}>{error}</div>}
                    <button onClick={handleRegisterStep2} disabled={loading} style={{ padding: '16px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}



      {/* HERO SECTION */}
      <section className="hero-section" style={{ padding: '160px 6% 140px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#0A1628' }}>
        {/* ── MOTION BACKGROUND ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          {/* Primary deep blue orb — top left */}
          <div style={{ position: 'absolute', top: '-25%', left: '-20%', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(29,78,216,0.6) 0%, rgba(30,58,138,0.3) 40%, transparent 70%)', filter: 'blur(80px)', animation: 'orbA 22s ease-in-out infinite alternate', borderRadius: '50%' }} />
          {/* Gold orb — bottom right */}
          <div style={{ position: 'absolute', bottom: '-30%', right: '-20%', width: '85vw', height: '85vw', background: 'radial-gradient(circle, rgba(255,184,0,0.18) 0%, rgba(251,191,36,0.08) 40%, transparent 70%)', filter: 'blur(100px)', animation: 'orbB 28s ease-in-out infinite alternate', borderRadius: '50%' }} />
          {/* Purple accent orb — center right */}
          <div style={{ position: 'absolute', top: '15%', right: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(120,40,200,0.15) 0%, transparent 65%)', filter: 'blur(70px)', animation: 'orbC 18s ease-in-out infinite alternate', borderRadius: '50%' }} />
          {/* Cyan cool accent — center left */}
          <div style={{ position: 'absolute', top: '40%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)', filter: 'blur(60px)', animation: 'orbD 32s ease-in-out infinite alternate', borderRadius: '50%' }} />
          {/* Rotating mesh ring */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '140vw', height: '140vw', background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,184,0,0.015) 60deg, transparent 120deg, rgba(29,78,216,0.02) 180deg, transparent 240deg, rgba(255,184,0,0.015) 300deg, transparent 360deg)', animation: 'meshRotate 60s linear infinite', borderRadius: '50%' }} />
          {/* Subtle grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.4, maskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1, height: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1, backgroundColor: i % 3 === 0 ? `rgba(255,184,0,${0.3 + (i % 4) * 0.1})` : `rgba(255,255,255,${0.08 + (i % 5) * 0.04})`, borderRadius: '50%', top: `${(8 + i * 23) % 100}%`, left: `${(3 + i * 31) % 100}%`, animation: `floatUp ${14 + (i % 6) * 3}s ease-in-out infinite`, animationDelay: `-${i * 1.8}s` }} />
          ))}
        </div>

        {/* ── BACKGROUND IMAGE SLIDESHOW ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: idx === heroSlideIdx ? 0.7 : 0,
                transition: 'opacity 1.8s ease-in-out',
                transform: idx === heroSlideIdx ? 'scale(1.05)' : 'scale(1)',
                transitionProperty: 'opacity, transform',
                transitionDuration: '1.8s, 10s',
                transitionTimingFunction: 'ease-in-out, ease-out',
              }}
            >
              <img
                src={slide.url}
                alt={slide.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.05) brightness(1) saturate(0.9)',
                }}
              />
              {/* Premium dark gradient overlay mask */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to bottom, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.4) 40%, rgba(10,22,40,0.7) 100%)',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 22px', background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 40, color: '#FFB800', fontSize: 11, fontWeight: 700, marginBottom: 40, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB800', display: 'inline-block', boxShadow: '0 0 8px #FFB800' }} />
            CraftHive Admin Command Center
          </div>

          <h1 style={{ fontSize: 'clamp(46px, 7vw, 82px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 28, color: '#ffffff', letterSpacing: '-2.5px' }}>
            The future of<br />
            <span style={{ color: 'transparent', backgroundImage: 'linear-gradient(95deg, #FFB800 0%, #FBBF24 60%, #FDE68A 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>artisan work</span>
            {' '}starts here
          </h1>

          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 52px' }}>
            The unified command center for monitoring operations, verifying artisans, resolving disputes, and driving real-time growth across Ghana.
          </p>

          <div className="hero-cta-buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button onClick={() => setAuthMode('login')} style={{ padding: '18px 48px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,184,0,0.35)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(255,184,0,0.45)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,184,0,0.35)'; }}>
              Sign In to Dashboard →
            </button>
            <button onClick={() => onComplete(true)} style={{ padding: '18px 48px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(12px)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}>
              Explore as Guest
            </button>
          </div>


        </div>

        <style>{`
          @keyframes orbA { 0% { transform: translate(0,0) scale(1) rotate(0deg); } 50% { transform: translate(8%,12%) scale(1.08) rotate(5deg); } 100% { transform: translate(4%,20%) scale(1.15) rotate(-3deg); } }
          @keyframes orbB { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-12%,-6%) scale(1.1); } 100% { transform: translate(-6%,-14%) scale(0.95); } }
          @keyframes orbC { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-15%,10%) scale(1.2); } }
          @keyframes orbD { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(10%,-8%) scale(1.15); } }
          @keyframes meshRotate { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
          @keyframes floatUp { 0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; } 50% { transform: translateY(-30px) scale(1.2); opacity: 1; } }
          @keyframes cardDrift1 { 0% { transform: translateY(0px) rotate(-4deg); } 50% { transform: translateY(-28px) rotate(-1deg); } 100% { transform: translateY(-12px) rotate(-5deg); } }
          @keyframes cardDrift2 { 0% { transform: translateY(0px) rotate(3deg); } 50% { transform: translateY(-20px) rotate(6deg); } 100% { transform: translateY(-35px) rotate(2deg); } }
          @keyframes cardDrift3 { 0% { transform: translateY(0px) rotate(5deg); } 50% { transform: translateY(-25px) rotate(2deg); } 100% { transform: translateY(-10px) rotate(7deg); } }
          @keyframes cardDrift4 { 0% { transform: translateY(0px) rotate(-3deg); } 50% { transform: translateY(-18px) rotate(-6deg); } 100% { transform: translateY(-30px) rotate(-1deg); } }

          @media (max-width: 768px) {
            header { padding: 12px 4% !important; }
            .hero-section { padding: 100px 5% 70px !important; }
            .hero-cta-buttons { flex-direction: column !important; width: 100% !important; max-width: 320px !important; margin: 0 auto !important; }
            .hero-cta-buttons button { width: 100% !important; text-align: center !important; justify-content: center !important; }
            .auth-modal-card { padding: 24px 18px !important; max-width: 100% !important; border-radius: 18px !important; }
            .footer-ctas { flex-direction: column !important; width: 100% !important; }
            .footer-ctas button { width: 100% !important; }
          }
        `}</style>
      </section>

      {/* FEATURES GRID */}
      <section style={{ background: '#F8FAFC', padding: '80px 6%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FFB800', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 16 }}>PLATFORM CAPABILITIES</p>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 900, color: '#0A1628', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 18 }}>Everything you need<br />to run CraftHive</h2>
            <p style={{ fontSize: 17, color: '#64748B', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>A complete suite of admin tools built for speed, accuracy, and total control.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
            {[
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'User Management', desc: 'Manage customers and artisans with full profile controls, KYC verification, and role-based access.' },
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Live Analytics', desc: 'Real-time revenue charts, growth metrics, category breakdowns, and live activity feeds.' },
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'KYC Verification', desc: 'Review ID documents, approve or reject artisans, and maintain a fully trusted marketplace.' },
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title: 'Payouts & Finance', desc: 'Track commissions, manage payouts, and monitor every transaction end to end.' },
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Dispute Resolution', desc: 'Handle escalations with evidence review, timeline tracking, and resolution records.' },
              { icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: 'Promotions', desc: 'Create and manage campaigns, discount codes, and platform-wide promotional events.' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.06)', borderRadius: 20, padding: '30px 26px', transition: 'all 0.25s', cursor: 'default' }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 50px rgba(10,22,40,0.08)'; el.style.borderColor = 'rgba(255,184,0,0.3)'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; el.style.borderColor = 'rgba(10,22,40,0.06)'; }}>
                <div style={{ width: 50, height: 50, background: 'rgba(10,22,40,0.04)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0A1628', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ZIG-ZAG FEATURE SECTIONS */}
      <section style={{ background: '#0A1628', padding: '80px 6%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 100 }}>
          {[
            { img: '/onboard1.jpg', icon: <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,184,0,0.9)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title: 'Empower Local Artisans', desc: 'Manage the platform connecting thousands of skilled workers across Ghana. Every artisan is vetted, trusted, and ready to deliver top-tier service.', reverse: false },
            { img: '/onboard2.jpg', icon: <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,184,0,0.9)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: 'Seamless Operations', desc: "Oversee active bookings, verify identities in real-time, and handle transactions with ease. Full bird's-eye view of every ongoing service.", reverse: true },
            { img: '/onboard3.jpg', icon: <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,184,0,0.9)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'Real-time Analytics', desc: 'Make data-driven decisions. Access detailed reports on revenue, growth, engagement, and categorical demand to stay ahead of the curve.', reverse: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 80, flexDirection: s.reverse ? 'row-reverse' : 'row', flexWrap: 'wrap' as const }}>
              <div style={{ flex: '1 1 380px', borderRadius: 28, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
                <img src={s.img} alt={s.title} style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,22,40,0.4) 0%, transparent 60%)' }} />
              </div>
              <div style={{ flex: '1 1 340px' }}>
                <div style={{ fontSize: 32, marginBottom: 18 }}>{s.icon}</div>
                <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 900, color: '#fff', marginBottom: 18, lineHeight: 1.15, letterSpacing: '-1px' }}>{s.title}</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.85 }}>{s.desc}</p>
                <div style={{ marginTop: 30, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#FFB800', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid rgba(255,184,0,0.3)', paddingBottom: 4 }}
                  onClick={() => setAuthMode('login')}>
                  Get started <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY SECTION */}
      <section style={{ background: '#F8FAFC', padding: '100px 6%', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FFB800', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 16 }}>TRUST & SAFETY</p>
          <h2 style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 900, color: '#0A1628', letterSpacing: '-1.5px', marginBottom: 60 }}>Built for security,<br />designed for scale</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { num: '01', title: 'Secure Authentication', desc: 'Multi-factor login with reCAPTCHA and role-based admin access control.' },
              { num: '02', title: 'ID Verification', desc: 'Ghana Card, Passport, and NHIS document uploads for every artisan.' },
              { num: '03', title: 'Dispute Center', desc: 'Fair, evidence-based resolution tools with full audit trails.' },
              { num: '04', title: 'Real-time Monitoring', desc: 'Live activity feeds and instant alerts for platform events.' },
            ].map((t, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.06)', borderRadius: 20, padding: '30px 24px', textAlign: 'left' as const }}>
                <p style={{ fontSize: 38, fontWeight: 900, color: 'rgba(10,22,40,0.05)', letterSpacing: '-2px', marginBottom: 14, lineHeight: 1 }}>{t.num}</p>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0A1628', marginBottom: 10 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer style={{ background: '#0A1628', padding: '100px 6% 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(255,184,0,0.05) 0%, transparent 60%)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FFB800', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 24 }}>GET STARTED TODAY</p>
          <h2 style={{ fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 22 }}>Ready to take<br />full control?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', marginBottom: 48, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 48px' }}>
            Join the administration team and manage CraftHive with powerful, enterprise-grade tools.
          </p>
          <div className="footer-ctas" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button onClick={() => { setAuthMode('register'); window.scrollTo(0, 0); }} style={{ padding: '18px 44px', background: '#FFB800', color: '#0A1628', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,184,0,0.3)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(255,184,0,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,184,0,0.3)'; }}>
              Create Admin Account
            </button>
            <button onClick={() => onComplete(true)} style={{ padding: '18px 44px', background: 'transparent', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}>
              Explore as Guest
            </button>
          </div>
        </div>
        <div style={{ marginTop: 80, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 16, maxWidth: 1200, margin: '80px auto 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="CraftHive" style={{ width: 18, objectFit: 'contain' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600 }}>CraftHive Admin</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13 }}>© {new Date().getFullYear()} CraftHive. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  )
}