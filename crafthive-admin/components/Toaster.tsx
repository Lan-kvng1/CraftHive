'use client'
import { useState, useEffect } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function toast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ch-toast', { detail: { message, type, id: Date.now() } })
    )
  }
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Toast
      setToasts(prev => [...prev, detail])
      setTimeout(
        () => setToasts(prev => prev.filter(t => t.id !== detail.id)),
        3500
      )
    }
    window.addEventListener('ch-toast', handler)
    return () => window.removeEventListener('ch-toast', handler)
  }, [])

  const colors: Record<string, string> = {
    success: 'background:#16a34a;color:#fff',
    error: 'background:#dc2626;color:#fff',
    warning: 'background:#d97706;color:#fff',
    info: 'background:#1B2B6B;color:#fff',
  }
  const icons: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          ...Object.fromEntries(
            colors[t.type].split(';').map(s => {
              const [k, v] = s.split(':')
              return [k.trim(), v?.trim()]
            }).filter(([k]) => k)
          ),
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11,
          }}>
            {icons[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}