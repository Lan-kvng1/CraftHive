'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import OnboardingScreen from '@/components/OnboardingScreen'
import OverviewPage from '@/components/pages/OverviewPage'
import CustomersPage from '@/components/pages/CustomersPage'
import ArtisansPage from '@/components/pages/ArtisansPage'
import KYCPage from '@/components/pages/KYCPage'
import BookingsPage from '@/components/pages/BookingsPage'
import TransactionsPage from '@/components/pages/TransactionsPage'
import PayoutsPage from '@/components/pages/PayoutsPage'
import CommissionsPage from '@/components/pages/CommissionsPage'
import DisputesPage from '@/components/pages/DisputesPage'
import PromotionsPage from '@/components/pages/PromotionsPage'
import ReportsPage from '@/components/pages/ReportsPage'
import ReviewsPage from '@/components/pages/ReviewsPage'
import SettingsPage from '@/components/pages/SettingsPage'
import AdminProfilePage from '@/components/pages/AdminProfilePage'
import Toaster from '@/components/Toaster'
import type { Page } from '@/lib/types'

type ExtendedPage = Page | 'admin-profile'

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0A1628',
      flexDirection: 'column', gap: 40, fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '120vw', height: '120vw',
        background: 'radial-gradient(ellipse at center, rgba(255,184,0,0.07) 0%, rgba(30,58,138,0.15) 40%, transparent 70%)',
        filter: 'blur(80px)', animation: 'pulseBg 8s ease-in-out infinite alternate',
        zIndex: 0,
      }} />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? 3 : 1.5,
          height: i % 3 === 0 ? 3 : 1.5,
          borderRadius: '50%',
          background: i % 2 === 0 ? `rgba(255,184,0,${0.15 + (i % 4) * 0.08})` : `rgba(255,255,255,${0.08 + (i % 4) * 0.04})`,
          top: `${(15 + i * 17.5) % 100}%`,
          left: `${(7 + i * 23.3) % 100}%`,
          animation: `floatDot ${10 + (i % 5) * 5}s linear infinite`,
          animationDelay: `-${i * 2}s`,
          zIndex: 1
        }} />
      ))}

      {/* Main logo block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', animation: 'floatLogo 4s ease-in-out infinite' }}>
          {/* Spinning ring */}
          <div style={{
            position: 'absolute', inset: -24,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,184,0,0.12)',
            borderTopColor: '#FFB800',
            borderRightColor: 'rgba(255,184,0,0.4)',
            animation: 'spin 3s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: -10,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
            borderBottomColor: 'rgba(255,184,0,0.2)',
            animation: 'spin 6s linear infinite reverse',
          }} />
          
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 60px rgba(255,184,0,0.08), 0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <img
              src="/logo.png"
              alt="CraftHive"
              style={{ width: 90, height: 90, objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 40, fontWeight: 800,
            letterSpacing: '-1px', margin: 0, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,184,0,0.9) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            CraftHive
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6, letterSpacing: '0.2em', fontWeight: 500 }}>ADMIN PORTAL</p>
        </div>
      </div>

      {/* Loading indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', width: 180, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%', width: '35%',
            background: 'linear-gradient(90deg, transparent, #FFB800, rgba(255,184,0,0.4))',
            borderRadius: 2, animation: 'shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }} />
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', fontWeight: 500, animation: 'pulseText 2s infinite' }}>
          QUALITY SERVICE AT YOUR DOORSTEP
        </p>
      </div>

      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulseBg {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(350%); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes floatDot {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-20vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function GuestPromptModal({ onClose, onSignIn }: {
  onClose: () => void
  onSignIn: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 420, textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: '#EEF1FB', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/logo.png" alt="CraftHive" style={{ width: 40, objectFit: 'contain' }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1B2B6B', marginBottom: 10 }}>
          Still exploring?
        </h3>
        <p style={{ fontSize: 14, color: '#6B7494', lineHeight: 1.6, marginBottom: 24 }}>
          You have been browsing as a guest for 10 minutes.
          Sign in to unlock full access to all admin features.
        </p>
        <button onClick={onSignIn} style={{
          width: '100%', padding: '12px', background: '#1B2B6B',
          color: '#fff', border: 'none', borderRadius: 10,
          cursor: 'pointer', fontSize: 15, fontWeight: 700, marginBottom: 10,
        }}>
          Sign In to CraftHive Admin
        </button>
        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: 'none',
          color: '#6B7494', border: 'none', cursor: 'pointer', fontSize: 14,
        }}>
          Continue as guest
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [page, setPage] = useState<ExtendedPage>('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem('ch_onboarded')
    if (done) { setOnboarded(true); setIsGuest(false) }
    localStorage.removeItem('ch_guest')
    setMounted(true)

    // Keep splash visible for at least 2.8s so animations play fully
    const splashTimer = setTimeout(() => setSplashDone(true), 2800)

    // Listen for auth events: handle stale tokens and password recovery redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Stale/invalid refresh token — clear everything and boot back to landing
        localStorage.removeItem('crafthive-admin-auth')
        localStorage.removeItem('ch_onboarded')
        localStorage.removeItem('ch_guest')
        supabase.auth.signOut()
        setOnboarded(false)
        setIsGuest(false)
      }
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link in their email — show the reset form
        setPasswordRecovery(true)
        setOnboarded(false) // force back to onboarding screen in reset mode
        setSplashDone(true) // skip splash
        setMounted(true)
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('ch_onboarded')
        setOnboarded(false)
        setIsGuest(false)
        setPasswordRecovery(false)
      }
    })

    return () => {
      clearTimeout(splashTimer)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => localStorage.removeItem('ch_guest')
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    if (!isGuest || !onboarded) return
    const timer = setTimeout(() => setShowGuestPrompt(true), 10 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [isGuest, onboarded])

  const handleOnboardComplete = (guest?: boolean) => {
    if (guest) {
      setIsGuest(true); setOnboarded(true)
    } else {
      localStorage.setItem('ch_onboarded', '1')
      localStorage.removeItem('ch_guest')
      setIsGuest(false); setOnboarded(true)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('ch_onboarded')
    localStorage.removeItem('ch_guest')
    setOnboarded(false); setIsGuest(false)
    setShowGuestPrompt(false); setPage('overview')
  }

  const handleSignInPrompt = () => {
    setShowGuestPrompt(false)
    handleSignOut()
  }

  const navigate = (p: ExtendedPage) => setPage(p)

  const renderPage = () => {
    switch (page) {
      case 'overview': return <OverviewPage isGuest={isGuest} />
      case 'customers': return <CustomersPage />
      case 'artisans': return <ArtisansPage />
      case 'kyc': return <KYCPage />
      case 'bookings': return <BookingsPage />
      case 'transactions': return <TransactionsPage />
      case 'payouts': return <PayoutsPage />
      case 'commissions': return <CommissionsPage />
      case 'disputes': return <DisputesPage />
      case 'promotions': return <PromotionsPage />
      case 'reports': return <ReportsPage />
      case 'reviews': return <ReviewsPage />
      case 'settings': return <SettingsPage isGuest={isGuest} />
      case 'admin-profile': return <AdminProfilePage />
      default: return <OverviewPage isGuest={isGuest} />
    }
  }

  if (!mounted || !splashDone) return <LoadingScreen />
  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardComplete} initialMode={passwordRecovery ? 'reset' : null} />

  return (
    <>
      {showGuestPrompt && (
        <GuestPromptModal
          onClose={() => setShowGuestPrompt(false)}
          onSignIn={handleSignInPrompt}
        />
      )}
      <div style={{
        display: 'flex', height: '100vh',
        overflow: 'hidden', background: '#F1F5F9',
      }}>
        <Sidebar
          current={page as Page}
          onNavigate={(p) => navigate(p)}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          isGuest={isGuest}
          onSignOut={handleSignOut}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header
            page={page as Page}
            isGuest={isGuest}
            onSignInPrompt={handleSignInPrompt}
            onNavigate={(p) => {
              if (p === 'settings' || p === 'overview') navigate(p)
              else navigate('admin-profile')
            }}
            onProfileClick={() => navigate('admin-profile')}
          />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {renderPage()}
          </main>
        </div>
        <Toaster />
      </div>
    </>
  )
}