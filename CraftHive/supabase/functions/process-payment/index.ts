// supabase/functions/process-payment/index.ts
// Handles both Paystack (local) and Stripe (international)
// Deploy: supabase functions deploy process-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, provider, bookingId, amount, currency, email, callbackUrl } = await req.json()

        // ── PAYSTACK ─────────────────────────────────────────────
        if (provider === 'paystack') {

            if (action === 'initialize') {
                // Initialize a Paystack transaction
                const res = await fetch('https://api.paystack.co/transaction/initialize', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        amount: Math.round(amount * 100), // Paystack uses kobo/pesewas
                        currency: currency || 'GHS',
                        reference: `crafthive_${bookingId}_${Date.now()}`,
                        callback_url: callbackUrl,
                        metadata: { booking_id: bookingId },
                        channels: ['card', 'mobile_money', 'bank'],
                    }),
                })
                const data = await res.json()
                if (!data.status) throw new Error(data.message)

                // Save reference to booking
                await supabase.from('bookings').update({
                    payment_reference: data.data.reference,
                    payment_provider: 'paystack',
                }).eq('id', bookingId)

                return new Response(JSON.stringify({
                    authorization_url: data.data.authorization_url,
                    reference: data.data.reference,
                    access_code: data.data.access_code,
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            if (action === 'verify') {
                const { reference } = await req.json().catch(() => ({ reference: null }))
                const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                    headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}` },
                })
                const data = await res.json()
                if (data.data?.status === 'success') {
                    await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
                }
                return new Response(JSON.stringify(data.data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        // ── STRIPE ────────────────────────────────────────────────
        if (provider === 'stripe') {

            if (action === 'create_payment_intent') {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100), // cents
                    currency: currency || 'usd',
                    metadata: { booking_id: bookingId },
                    automatic_payment_methods: { enabled: true },
                })

                await supabase.from('bookings').update({
                    payment_reference: paymentIntent.id,
                    payment_provider: 'stripe',
                }).eq('id', bookingId)

                return new Response(JSON.stringify({
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        return new Response(JSON.stringify({ error: 'Unknown action or provider' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})