// supabase/functions/send-push/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendExpo(token: string, title: string, body: string, data = {}) {
    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
    })
}

serve(async (req) => {
    try {
        const { type, table, record, old_record } = await req.json()

        // ── Booking events ────────────────────────────────────────
        if (table === 'bookings') {
            if (type === 'INSERT') {
                // New booking → notify artisan
                const { data: artisan } = await supabase
                    .from('profiles').select('push_token').eq('id', record.artisan_id).single()
                const { data: customer } = await supabase
                    .from('profiles').select('full_name').eq('id', record.customer_id).single()

                if (artisan?.push_token) {
                    await sendExpo(
                        artisan.push_token,
                        'New Booking Request 📅',
                        `${customer?.full_name || 'A customer'} wants to book ${record.title || record.service_type}`,
                        { type: 'booking_new', booking_id: record.id }
                    )
                }
            }

            if (type === 'UPDATE' && record.status !== old_record?.status) {
                const MESSAGES: Record<string, { title: string; body: string }> = {
                    confirmed: { title: 'Booking Confirmed ✅', body: 'Your artisan accepted your booking.' },
                    in_progress: { title: 'Job Started 🔧', body: 'Your artisan has started the job.' },
                    completed: { title: 'Job Completed 🎉', body: 'Your job is done. Please rate your artisan.' },
                    cancelled: { title: 'Booking Cancelled ❌', body: 'Your booking was cancelled.' },
                }

                const msg = MESSAGES[record.status]
                if (msg) {
                    const { data: customer } = await supabase
                        .from('profiles').select('push_token').eq('id', record.customer_id).single()
                    if (customer?.push_token) {
                        await sendExpo(customer.push_token, msg.title, msg.body,
                            { type: `booking_${record.status}`, booking_id: record.id })
                    }
                }

                if (record.status === 'completed') {
                    const { data: artisan } = await supabase
                        .from('profiles').select('push_token').eq('id', record.artisan_id).single()
                    if (artisan?.push_token) {
                        await sendExpo(artisan.push_token, 'Payment Released 💰',
                            'Job marked complete. Your earnings will be processed shortly.',
                            { type: 'payment_received', booking_id: record.id })
                    }
                }
            }
        }

        // ── Message events ────────────────────────────────────────
        if (table === 'messages' && type === 'INSERT') {
            const { data: receiver } = await supabase
                .from('profiles').select('push_token').eq('id', record.receiver_id).single()
            const { data: sender } = await supabase
                .from('profiles').select('full_name').eq('id', record.sender_id).single()

            if (receiver?.push_token) {
                await sendExpo(
                    receiver.push_token,
                    `${sender?.full_name || 'Someone'} sent you a message 💬`,
                    record.content.slice(0, 100),
                    { type: 'message_new', booking_id: record.booking_id }
                )
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
    }
})