// supabase/functions/send-push-notification/index.ts
// Deploy with: npx supabase functions deploy send-push-notification
//
// This Edge Function:
// 1. Is called from sendNotification.ts after inserting to notifications table
// 2. Looks up the user's push_token from profiles
// 3. Sends via Expo Push Notification API (handles both iOS/Android)
// 4. Respects user notification preferences
//
// Environment variable needed in Supabase Dashboard → Edge Functions → Secrets:
//   SUPABASE_URL (auto-set)
//   SUPABASE_SERVICE_ROLE_KEY (auto-set)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

Deno.serve(async (req) => {
    try {
        const { userId, title, body, data, type } = await req.json()

        if (!userId || !title) {
            return new Response(JSON.stringify({ error: 'Missing userId or title' }), { status: 400 })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Get user's push token and notification preferences
        const { data: profile } = await supabase
            .from('profiles')
            .select('push_token, notif_bookings, notif_messages, notif_payments, notif_promos')
            .eq('id', userId)
            .single()

        if (!profile?.push_token) {
            return new Response(JSON.stringify({ sent: false, reason: 'No push token' }), { status: 200 })
        }

        // Check preferences
        const prefMap: Record<string, string> = {
            booking_new: 'notif_bookings', booking_confirmed: 'notif_bookings',
            booking_cancelled: 'notif_bookings', booking_completed: 'notif_bookings',
            booking_in_progress: 'notif_bookings', message_new: 'notif_messages',
            payment_received: 'notif_payments', promo: 'notif_promos',
        }
        const prefKey = prefMap[type]
        if (prefKey && (profile as any)[prefKey] === false) {
            return new Response(JSON.stringify({ sent: false, reason: 'User opted out' }), { status: 200 })
        }

        // Send via Expo Push API
        const message = {
            to: profile.push_token,
            sound: 'default',
            title,
            body: body || '',
            data: data || {},
            badge: 1,
            channelId: 'default', // Android
        }

        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
            body: JSON.stringify(message),
        })

        const result = await response.json()
        return new Response(JSON.stringify({ sent: true, result }), { status: 200 })

    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
    }
})