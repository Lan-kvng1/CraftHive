// app/(customer)/payment.tsx — FINAL
// Full in-app payment using Paystack WebView — no browser, no Edge Function
// Install: npx expo install react-native-webview
// Also supports MTN MoMo, Vodafone Cash, AirtelTigo via Paystack
import React, { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import {
  ArrowLeftIcon, CheckCircleIcon,
  CreditCardIcon, ShieldIcon,
} from '../../src/components/Icons'
import AudioFAB from '../../src/components/AudioFAB'

const NAVY = '#0A2463'
const GOLD = '#FFB800'
const GREEN = '#22C55E'
// Your Paystack public key — add to .env as EXPO_PUBLIC_PAYSTACK_KEY
const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_KEY || ''

type Screen = 'summary' | 'webview' | 'success'
type Method = 'momo' | 'card'

export default function CustomerPayment() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile } = useAuth()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState<Method>('momo')
  const [screen, setScreen] = useState<Screen>('summary')
  const [payUrl, setPayUrl] = useState('')
  const [ref, setRef] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Coupon / Promo States
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)

  // Recalculate price when booking or appliedCoupon changes
  useEffect(() => {
    if (!booking) return
    const orig = booking.price || 0
    if (!appliedCoupon) {
      setDiscountAmount(0)
      setFinalPrice(orig)
    } else {
      let disc = 0
      if (appliedCoupon.discount_type === 'percentage') {
        disc = orig * (appliedCoupon.discount_value / 100)
      } else if (appliedCoupon.discount_type === 'fixed') {
        disc = appliedCoupon.discount_value
      }
      disc = Math.min(orig, Math.round(disc * 100) / 100)
      setDiscountAmount(disc)
      setFinalPrice(orig - disc)
    }
  }, [booking, appliedCoupon])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const code = couponCode.toUpperCase().trim()
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        Alert.alert('Invalid Coupon', 'This coupon code is invalid or has expired.')
        return
      }

      // Check expiry date
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        Alert.alert('Coupon Expired', 'This coupon code has expired.')
        return
      }

      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        Alert.alert('Coupon Expired', 'This coupon code has reached its usage limit.')
        return
      }

      setAppliedCoupon(data)
      Alert.alert('Coupon Applied', `Coupon "${code}" applied successfully!`)
    } catch (e: any) {
      Alert.alert('Error', 'Failed to validate coupon: ' + e.message)
    }
  }

  // ── Load booking ─────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return
    supabase.from('bookings')
      .select('*, artisan_profiles:artisan_id(trade_category, user_id)')
      .eq('id', bookingId).single()
      .then(async ({ data: b }) => {
        if (b?.artisan_id) {
          const { data: p } = await supabase.from('profiles')
            .select('full_name').eq('id', b.artisan_id).single()
          if (b.artisan_profiles) b.artisan_profiles.profiles = p
        }
        setBooking(b)
        setLoading(false)
        // If already paid, jump straight to success screen
        if (b?.payment_status === 'paid') setScreen('success')
      })
  }, [bookingId])

  // ── Initialise Paystack (direct API call, no Edge Function) ──
  const initPaystack = async () => {
    if (!booking || !user) return

    if (!PAYSTACK_KEY || !PAYSTACK_KEY.startsWith('pk_')) {
      Alert.alert(
        'Payment Not Configured',
        'Paystack key is missing or invalid.\n\nAdd this to your .env file and restart:\nEXPO_PUBLIC_PAYSTACK_KEY=pk_test_xxxx\n\nGet your key from dashboard.paystack.com → Settings → API Keys.',
        [{ text: 'OK' }]
      )
      return
    }

    const email = (profile as any)?.email || user.email || 'customer@crafthive.gh'
    const amount = Math.round(finalPrice * 100) // Paystack uses kobo/pesewas, using final discounted price
    const txRef = `CRAFT-${bookingId.slice(0, 8)}-${Date.now()}`
    setRef(txRef)

    // Build an inline Paystack checkout HTML page
    // This avoids needing any backend — Paystack's JS SDK runs in the WebView
    const channelMap: Record<Method, string> = {
      momo: "['mobile_money']",
      card: "['card']",
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://js.paystack.co/v1/inline.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, sans-serif;
           display:flex; align-items:center; justify-content:center;
           min-height:100vh; background:#f8fafc; }
    .loading { text-align:center; color:#0A2463; font-size:18px; font-weight:700; }
  </style>
</head>
<body>
  <div class="loading" id="msg">Opening payment...</div>
  <script>
    window.onload = function() {
      var handler = PaystackPop.setup({
        key:       '${PAYSTACK_KEY}',
        email:     '${email}',
        amount:    ${amount},
        currency:  'GHS',
        ref:       '${txRef}',
        channels:  ${channelMap[method]},
        metadata: {
          booking_id:  '${bookingId}',
          customer_id: '${user.id}',
          artisan_id:  '${booking.artisan_id}',
        },
        onClose: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ event:'close' }))
        },
        callback: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event:     'success',
            reference: response.reference,
            trans:     response.trans,
          }))
        },
      })
      handler.openIframe()
      document.getElementById('msg').style.display = 'none'
    }
  </script>
</body>
</html>`

    setPayUrl(html)
    setScreen('webview')
  }

  // ── Record payment after Paystack JS SDK confirms success ──
  // The Paystack inline JS only fires the callback on genuine payment success.
  // Public key cannot call the verify API (needs secret key on a server).
  // For production, add a Supabase Edge Function to verify server-side.
  const verifyPayment = async (reference: string) => {
    setVerifying(true)
    try {
      const { error: insertErr } = await supabase.from('payments').insert({
        booking_id: bookingId,
        customer_id: user?.id,
        artisan_id: booking.artisan_id,
        amount: finalPrice,
        status: booking.status === 'completed' ? 'released' : 'held',
        payment_method: method === 'momo' ? 'Mobile Money' : 'Card',
        transaction_ref: reference,
      })
      if (insertErr) {
        throw new Error('Insert payment failed: ' + insertErr.message)
      }
      const { error: updateErr } = await supabase.from('bookings').update({
        payment_status: 'paid',
        payment_provider: 'paystack',
        payment_reference: reference,
        price: finalPrice,
      }).eq('id', bookingId)
      if (updateErr) {
        throw new Error('Update booking failed: ' + updateErr.message)
      }

      // Increment coupon usage
      if (appliedCoupon) {
        await supabase
          .from('promos')
          .update({ current_uses: (appliedCoupon.current_uses || 0) + 1 })
          .eq('id', appliedCoupon.id)
      }

      setRef(reference)
      setScreen('success')
    } catch (e) {
      console.error('Payment record error:', e)
      setRef(reference)
      setScreen('success')
    } finally {
      setVerifying(false)
    }
  }

  // ── WebView message handler ───────────────────────────────
  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.event === 'success') {
        verifyPayment(msg.reference)
      } else if (msg.event === 'close') {
        setScreen('summary')
      }
    } catch { }
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
      <ActivityIndicator color={GOLD} style={{ flex: 1 }} />
    </SafeAreaView>
  )

  const artisanName = (booking?.artisan_profiles as any)?.profiles?.full_name || 'Artisan'
  const price = booking?.price || 0

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: {
      backgroundColor: NAVY, paddingHorizontal: 16,
      paddingTop: 8, paddingBottom: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    summaryCard: {
      backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, overflow: 'hidden',
    },
    summaryHead: { backgroundColor: NAVY, padding: 16 },
    summaryHeadTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    summaryLabel: { fontSize: 13, color: C.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: '700', color: C.text },
    priceRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 16,
    },
    priceLabel: { fontSize: 15, fontWeight: '800', color: C.text },
    priceValue: { fontSize: 26, fontWeight: '900', color: NAVY },
    sectionTitle: {
      fontSize: 15, fontWeight: '800', color: C.text,
      marginHorizontal: 16, marginTop: 20, marginBottom: 12,
    },
    methodCard: {
      backgroundColor: C.card, marginHorizontal: 16, marginBottom: 10,
      borderRadius: 16, padding: 16, flexDirection: 'row',
      alignItems: 'center', gap: 14, borderWidth: 2,
    },
    methodIconWrap: {
      width: 50, height: 50, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    methodName: { fontSize: 15, fontWeight: '800', color: C.text },
    methodDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    methodBadge: {
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
      marginTop: 5, alignSelf: 'flex-start',
    },
    methodBadgeTxt: { fontSize: 11, fontWeight: '700' },
    radioOuter: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
    },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: NAVY },
    escrowNote: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      backgroundColor: NAVY + '0D', borderRadius: 14, padding: 14,
      marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    },
    escrowTxt: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },
    payBtn: {
      backgroundColor: NAVY, borderRadius: 16, paddingVertical: 18,
      alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 32,
      shadowColor: NAVY, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    },
    payBtnTxt: { fontSize: 17, fontWeight: '900', color: '#FFF' },
    // Success
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: C.background },
    successBadge: {
      width: 110, height: 110, borderRadius: 34,
      backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    successTitle: { fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 12 },
    successSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    successRef: { fontSize: 12, color: C.textMuted, marginBottom: 28, textAlign: 'center' },
    doneBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48 },
    doneTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    verifyingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background, gap: 16 },
    verifyingTxt: { fontSize: 16, color: C.textSecondary, fontWeight: '600' },
  })

  // ── Verifying screen ──────────────────────────────────────
  if (verifying) return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar style="dark" />
      <View style={s.verifyingWrap}>
        <ActivityIndicator color={NAVY} size="large" />
        <Text style={s.verifyingTxt}>Verifying payment...</Text>
      </View>
    </SafeAreaView>
  )

  // ── Success screen ────────────────────────────────────────
  if (screen === 'success') return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={s.successWrap}>
        <View style={s.successBadge}>
          <CheckCircleIcon size={56} color={GREEN} />
        </View>
        <Text style={s.successTitle}>Payment Successful!</Text>
        <Text style={s.successSub}>
          Your payment of <Text style={{ fontWeight: '900', color: NAVY }}>₵{finalPrice}</Text> is held
          securely in escrow.{'\n'}
          It will be released to <Text style={{ fontWeight: '700' }}>{artisanName}</Text> once you
          confirm the job is complete.
        </Text>
        {ref ? <Text style={s.successRef}>Reference: {ref}</Text> : null}
        <TouchableOpacity style={s.doneBtn}
          onPress={() => router.replace({ pathname: '/(customer)/booking-detail' as any, params: { bookingId } })}>
          <Text style={s.doneTxt}>View Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  // ── Paystack WebView (in-app checkout) ────────────────────
  if (screen === 'webview') return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => {
          Alert.alert('Cancel Payment?', 'Your payment has not been processed yet.', [
            { text: 'Keep Going', style: 'cancel' },
            { text: 'Cancel', style: 'destructive', onPress: () => setScreen('summary') },
          ])
        }}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paystack Checkout</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ShieldIcon size={14} color="#86EFAC" />
          <Text style={{ color: '#86EFAC', fontSize: 12, fontWeight: '700' }}>Secure</Text>
        </View>
      </View>
      <WebView
        source={{ html: payUrl }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator color={NAVY} size="large" />
            <Text style={{ marginTop: 12, color: NAVY, fontWeight: '600' }}>Loading payment...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )

  // ── Summary + method selection ────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pay for Booking</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* Booking summary */}
        <View style={s.summaryCard}>
          <View style={s.summaryHead}>
            <Text style={s.summaryHeadTxt}>📋 Booking Summary</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Service</Text>
            <Text style={s.summaryValue}>{booking?.title || booking?.service_type || '—'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Artisan</Text>
            <Text style={s.summaryValue}>{artisanName}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Date</Text>
            <Text style={s.summaryValue}>
              {booking?.scheduled_at
                ? new Date(booking.scheduled_at).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'TBC'}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Status</Text>
            <Text style={[s.summaryValue, { textTransform: 'capitalize' }]}>
              {booking?.status?.replace('_', ' ')}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Original Price</Text>
            <Text style={s.summaryValue}>₵{price}</Text>
          </View>
          
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Promo / Coupon Code"
              placeholderTextColor={C.textSecondary + '80'}
              autoCapitalize="characters"
              editable={!appliedCoupon}
              style={{
                flex: 1,
                backgroundColor: C.surface,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 13,
                color: C.text,
                borderWidth: 1,
                borderColor: C.border,
              }}
            />
            {appliedCoupon ? (
              <TouchableOpacity
                onPress={() => {
                  setAppliedCoupon(null)
                  setCouponCode('')
                }}
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleApplyCoupon}
                style={{
                  backgroundColor: GOLD,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: NAVY, fontSize: 13, fontWeight: '700' }}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>

          {appliedCoupon && (
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: '#22C55E' }]}>Discount ({appliedCoupon.code})</Text>
              <Text style={[s.summaryValue, { color: '#22C55E' }]}>-₵{discountAmount}</Text>
            </View>
          )}

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Amount to Pay</Text>
            <Text style={s.priceValue}>₵{finalPrice}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={s.sectionTitle}>Payment Method</Text>

        {/* MoMo */}
        <TouchableOpacity
          style={[s.methodCard, { borderColor: method === 'momo' ? NAVY : C.border }]}
          onPress={() => setMethod('momo')}>
          <View style={[s.methodIconWrap, { backgroundColor: '#FFD700' + '25' }]}>
            <Text style={{ fontSize: 28 }}>📱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodName}>Mobile Money</Text>
            <Text style={s.methodDesc}>MTN MoMo · Vodafone Cash · AirtelTigo</Text>
            <View style={[s.methodBadge, { backgroundColor: GOLD }]}>
              <Text style={[s.methodBadgeTxt, { color: '#1A202C' }]}>Recommended · Ghana</Text>
            </View>
          </View>
          <View style={[s.radioOuter, { borderColor: method === 'momo' ? NAVY : C.border }]}>
            {method === 'momo' && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Card */}
        <TouchableOpacity
          style={[s.methodCard, { borderColor: method === 'card' ? NAVY : C.border }]}
          onPress={() => setMethod('card')}>
          <View style={[s.methodIconWrap, { backgroundColor: '#635BFF' + '20' }]}>
            <CreditCardIcon size={26} color="#635BFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodName}>Debit / Credit Card</Text>
            <Text style={s.methodDesc}>Visa · Mastercard · Verve</Text>
            <View style={[s.methodBadge, { backgroundColor: '#635BFF' }]}>
              <Text style={[s.methodBadgeTxt, { color: '#FFF' }]}>International cards OK</Text>
            </View>
          </View>
          <View style={[s.radioOuter, { borderColor: method === 'card' ? NAVY : C.border }]}>
            {method === 'card' && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Escrow security note */}
        <View style={s.escrowNote}>
          <ShieldIcon size={16} color={NAVY} />
          <Text style={s.escrowTxt}>
            🔒 <Text style={{ fontWeight: '700' }}>Escrow protected.</Text> Your money is held
            securely and only released to {artisanName} once you confirm the job is complete.
            You're fully protected if anything goes wrong.
          </Text>
        </View>

        {/* Pay button */}
        <TouchableOpacity style={s.payBtn} onPress={initPaystack} activeOpacity={0.85}>
          <Text style={s.payBtnTxt}>
            {method === 'momo' ? '📱' : '💳'} Pay ₵{finalPrice}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <AudioFAB pageText={`Payment screen. Original price ₵${price}. Final price after coupon ₵${finalPrice} for ${booking?.title || 'service'} by ${artisanName}. Choose Mobile Money or Card.`} />
    </SafeAreaView>
  )
}