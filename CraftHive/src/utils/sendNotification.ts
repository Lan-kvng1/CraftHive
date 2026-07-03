// src/utils/sendNotification.ts
// Inserts to notifications table (in-app) AND calls Edge Function (push).
// Usage:
//   await sendNotification({ userId, title, body, type, data })

import { supabase } from '../lib/supabase'

export type NotifType =
  | 'booking_new'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_in_progress'
  | 'message_new'
  | 'payment_received'
  | 'review_new'
  | 'promo'
  | 'app_rating'
  | 'support_request'

const TYPE_PREF_MAP: Record<NotifType, string> = {
  booking_new: 'notif_bookings',
  booking_confirmed: 'notif_bookings',
  booking_cancelled: 'notif_bookings',
  booking_completed: 'notif_bookings',
  booking_in_progress: 'notif_bookings',
  review_new: 'notif_bookings',
  message_new: 'notif_messages',
  payment_received: 'notif_payments',
  promo: 'notif_promos',
  app_rating: 'notif_bookings',
  support_request: 'notif_bookings',
}

interface NotifPayload {
  userId: string
  title: string
  body?: string
  type: NotifType
  data?: Record<string, any>
}

export async function sendNotification(payload: NotifPayload): Promise<boolean> {
  try {
    // 1. Check notification preferences
    const prefColumn = TYPE_PREF_MAP[payload.type]
    if (prefColumn && payload.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(prefColumn)
        .eq('id', payload.userId)
        .single()
      if (profile && (profile as any)[prefColumn] === false) return false
    }

    // 2. Insert in-app notification
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body || null,
      type: payload.type,
      read: false,
      data: payload.data || null,
      created_at: new Date().toISOString(),
    })

    // 3. Send push notification via Edge Function (works when app is closed)
    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: payload.userId,
        title: payload.title,
        body: payload.body || '',
        type: payload.type,
        data: payload.data || {},
      },
    })

    return true
  } catch (e) {
    console.error('sendNotification error:', e)
    return false
  }
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export const notifyBookingNew = (artisanId: string, customerName: string, service: string, bookingId: string) =>
  sendNotification({ userId: artisanId, title: '🔔 New Booking Request', body: `${customerName} wants to book ${service}`, type: 'booking_new', data: { booking_id: bookingId } })

export const notifyBookingConfirmed = (customerId: string, artisanName: string, service: string, bookingId: string) =>
  sendNotification({ userId: customerId, title: '✅ Booking Confirmed', body: `${artisanName} confirmed your ${service} booking`, type: 'booking_confirmed', data: { booking_id: bookingId } })

export const notifyBookingCancelled = (userId: string, service: string, bookingId: string) =>
  sendNotification({ userId, title: '❌ Booking Cancelled', body: `The ${service} booking has been cancelled`, type: 'booking_cancelled', data: { booking_id: bookingId } })

export const notifyBookingCompleted = (customerId: string, artisanName: string, bookingId: string) =>
  sendNotification({ userId: customerId, title: '🎉 Job Completed!', body: `${artisanName} has completed your job. Leave a review!`, type: 'booking_completed', data: { booking_id: bookingId } })

export const notifyJobStarted = (customerId: string, artisanName: string, bookingId: string) =>
  sendNotification({ userId: customerId, title: '🔧 Job Started', body: `${artisanName} is on the way`, type: 'booking_in_progress', data: { booking_id: bookingId } })

export const notifyNewMessage = (receiverId: string, senderName: string, bookingId: string) =>
  sendNotification({ userId: receiverId, title: `💬 ${senderName}`, body: 'Sent you a message', type: 'message_new', data: { booking_id: bookingId } })

export const notifyPaymentReceived = (artisanId: string, amount: number, bookingId: string) =>
  sendNotification({ userId: artisanId, title: '💰 Payment Received', body: `₵${amount} has been added to your earnings`, type: 'payment_received', data: { booking_id: bookingId } })

export const notifyNewReview = (artisanId: string, customerName: string, rating: number, bookingId: string) =>
  sendNotification({ userId: artisanId, title: '⭐ New Review', body: `${customerName} gave you ${rating} stars`, type: 'review_new', data: { booking_id: bookingId } })