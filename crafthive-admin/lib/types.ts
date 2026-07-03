export type Page =
  | 'overview' | 'customers' | 'artisans' | 'kyc'
  | 'bookings' | 'transactions' | 'payouts' | 'commissions'
  | 'disputes' | 'promotions' | 'reports' | 'reviews'
  | 'settings' | 'admin-profile'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export interface ArtisanProfile {
  id: string
  trade_category: string
  bio: string
  location: string
  rating: number
  total_reviews: number
  status: 'pending' | 'approved' | 'rejected'
  profiles: Profile
}

export interface Booking {
  id: string
  ticket_number: string
  status: string
  service_description: string
  scheduled_at: string
  address: string
  total_amount: number | null
  created_at: string
  customer: Profile
  artisan: Profile
  artisan_profile: { trade_category: string }
}

export interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  transaction_ref: string | null
  created_at: string
  booking_id: string
  customer: Profile
  artisan: Profile
}

export interface Dispute {
  id: string
  reason: string
  description: string
  status: string
  created_at: string
  booking: Booking
  raised_by_profile: Profile
}

export interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  customer: Profile
  artisan: Profile
  booking_id: string
}

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}