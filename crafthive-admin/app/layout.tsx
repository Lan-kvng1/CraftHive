import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CraftHive Admin — Dark Luxury Dashboard',
  description: 'Administrative Management System for CraftHive Artisan Marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}