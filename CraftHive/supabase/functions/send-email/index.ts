// supabase/functions/send-email/index.ts
// Resend email for: booking confirmation, artisan approval, welcome
// Deploy: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'CraftHive <no-reply@crafthive.gh>'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    return res.json()
}

// ── Email templates ──────────────────────────────────────────

function bookingConfirmationHtml(data: {
    customerName: string
    artisanName: string
    service: string
    date: string
    time: string
    address: string
    price: string
    bookingId: string
}) {
    return `
  <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F4F6FB;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:24px">
    <div style="background:#0A2463;padding:32px;text-align:center">
      <h1 style="color:#FFB800;margin:0;font-size:28px">CraftHive</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Ghana's Artisan Marketplace</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#0A2463;margin:0 0 8px">Booking Confirmed! ✅</h2>
      <p style="color:#64748B;margin:0 0 24px">Hi ${data.customerName}, your booking has been sent to ${data.artisanName}.</p>
      <div style="background:#F4F6FB;border-radius:12px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#64748B;font-size:14px">Service</td><td style="padding:8px 0;font-weight:700;color:#1E293B;text-align:right">${data.service}</td></tr>
          <tr><td style="padding:8px 0;color:#64748B;font-size:14px">Artisan</td><td style="padding:8px 0;font-weight:700;color:#1E293B;text-align:right">${data.artisanName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748B;font-size:14px">Date</td><td style="padding:8px 0;font-weight:700;color:#1E293B;text-align:right">${data.date}</td></tr>
          <tr><td style="padding:8px 0;color:#64748B;font-size:14px">Time</td><td style="padding:8px 0;font-weight:700;color:#1E293B;text-align:right">${data.time}</td></tr>
          <tr><td style="padding:8px 0;color:#64748B;font-size:14px">Address</td><td style="padding:8px 0;font-weight:700;color:#1E293B;text-align:right">${data.address}</td></tr>
          <tr style="border-top:1px solid #E2E8F0">
            <td style="padding:12px 0;color:#0A2463;font-weight:800">Estimated Price</td>
            <td style="padding:12px 0;font-weight:900;color:#0A2463;text-align:right;font-size:18px">₵${data.price}</td>
          </tr>
        </table>
      </div>
      <div style="background:#FFF8E1;border:1px solid #FFB800;border-radius:10px;padding:14px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#92400E">🔒 <strong>Escrow Protection:</strong> Your payment is held securely and released to the artisan only after you confirm the job is complete.</p>
      </div>
      <p style="color:#64748B;font-size:13px">Booking reference: <strong>${data.bookingId.slice(0, 8).toUpperCase()}</strong></p>
    </div>
    <div style="background:#F4F6FB;padding:20px;text-align:center">
      <p style="margin:0;color:#94A3B8;font-size:12px">© 2026 CraftHive Ltd · Accra, Ghana · <a href="mailto:franklanking65@gmail.com" style="color:#0A2463">franklanking65@gmail.com</a></p>
    </div>
  </div></body></html>`
}

function artisanApprovedHtml(artisanName: string) {
    return `
  <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F4F6FB;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:24px">
    <div style="background:#0A2463;padding:32px;text-align:center">
      <h1 style="color:#FFB800;margin:0;font-size:28px">CraftHive</h1>
    </div>
    <div style="padding:32px;text-align:center">
      <div style="font-size:64px;margin-bottom:16px">🎉</div>
      <h2 style="color:#0A2463">You're Approved, ${artisanName}!</h2>
      <p style="color:#64748B;line-height:1.6">Your artisan account has been verified. You can now receive bookings from customers across Ghana.</p>
      <div style="margin:24px 0;background:#F4F6FB;border-radius:12px;padding:20px;text-align:left">
        <p style="margin:0 0 8px;font-weight:700;color:#1E293B">Next steps:</p>
        <p style="margin:4px 0;color:#64748B;font-size:14px">✅ Complete your profile with a photo and bio</p>
        <p style="margin:4px 0;color:#64748B;font-size:14px">✅ Add your services and pricing</p>
        <p style="margin:4px 0;color:#64748B;font-size:14px">✅ Set your availability</p>
        <p style="margin:4px 0;color:#64748B;font-size:14px">✅ Add your payout method (MoMo or bank account)</p>
      </div>
      <p style="color:#64748B;font-size:13px">Open the CraftHive app to get started. Customers in your area are waiting!</p>
    </div>
    <div style="background:#F4F6FB;padding:20px;text-align:center">
      <p style="margin:0;color:#94A3B8;font-size:12px">© 2026 CraftHive Ltd · <a href="mailto:franklanking65@gmail.com" style="color:#0A2463">franklanking65@gmail.com</a></p>
    </div>
  </div></body></html>`
}

function welcomeHtml(name: string, role: string) {
    return `
  <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F4F6FB;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:24px">
    <div style="background:#0A2463;padding:32px;text-align:center">
      <h1 style="color:#FFB800;margin:0;font-size:28px">CraftHive</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Ghana's Artisan Marketplace</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#0A2463">Welcome to CraftHive, ${name}! 👋</h2>
      <p style="color:#64748B;line-height:1.6">
        ${role === 'artisan'
            ? 'Your artisan account has been created. Your documents are under review and you\'ll be notified within 1–2 business days once approved.'
            : 'Your account is ready. Start browsing skilled artisans near you and book your first service today.'}
      </p>
    </div>
    <div style="background:#F4F6FB;padding:20px;text-align:center">
      <p style="margin:0;color:#94A3B8;font-size:12px">© 2026 CraftHive Ltd · <a href="mailto:franklanking65@gmail.com" style="color:#0A2463">franklanking65@gmail.com</a></p>
    </div>
  </div></body></html>`
}

// ── Main handler ─────────────────────────────────────────────

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { type, data } = await req.json()

        if (type === 'booking_confirmation') {
            const result = await sendEmail(
                data.customerEmail,
                `Booking Confirmed — ${data.service} with ${data.artisanName}`,
                bookingConfirmationHtml(data)
            )
            // Also send a notification to artisan
            await sendEmail(
                data.artisanEmail,
                `New Booking Request — ${data.service}`,
                `<p>Hi ${data.artisanName},</p><p>${data.customerName} has requested to book <strong>${data.service}</strong> on <strong>${data.date} at ${data.time}</strong>.</p><p>Open CraftHive to accept or decline.</p>`
            )
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (type === 'artisan_approved') {
            const result = await sendEmail(
                data.email,
                'Your CraftHive account is approved! 🎉',
                artisanApprovedHtml(data.name)
            )
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (type === 'welcome') {
            const result = await sendEmail(
                data.email,
                'Welcome to CraftHive! 👋',
                welcomeHtml(data.name, data.role)
            )
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})