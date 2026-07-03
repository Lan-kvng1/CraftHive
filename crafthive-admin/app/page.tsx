'use client'
import { useState, useEffect } from 'react'
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
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#1B2B6B',
      flexDirection: 'column', gap: 16,
    }}>
      <img src="/logo.png" alt="CraftHive" style={{ width: 120, opacity: 0.9 }} />
      <div style={{
        width: 28, height: 28, borderRadius: 14,
        border: '3px solid rgba(255,255,255,0.2)',
        borderTop: '3px solid #FFB800',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem('ch_onboarded')
    if (done) { setOnboarded(true); setIsGuest(false) }
    localStorage.removeItem('ch_guest')
    setMounted(true)
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

  if (!mounted) return <LoadingScreen />
  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardComplete} />

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
        overflow: 'hidden', background: '#F5F7FF',
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