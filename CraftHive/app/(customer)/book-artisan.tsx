// app/(customer)/book-artisan.tsx — FINAL
// Wires Resend email after booking INSERT
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { notifyBookingNew } from '../../src/utils/sendNotification'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import {
  ArrowLeftIcon, CheckCircleIcon, MapPinIcon,
  CalendarIcon, ClockIcon, StarIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const STEPS = ['Service', 'Date & Time', 'Details', 'Confirm']

const TIMES = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

// Call Resend via our Edge Function
async function sendBookingEmail(params: {
  customerEmail: string; customerName: string
  artisanEmail: string; artisanName: string
  service: string; date: string; time: string
  address: string; price: string; bookingId: string
}) {
  try {
    await supabase.functions.invoke('send-email', {
      body: { type: 'booking_confirmation', data: params },
    })
  } catch (e) {
    // Non-fatal — booking already saved, email is best-effort
    console.warn('Email send failed:', e)
  }
}

export default function BookArtisan() {
  const { artisanId } = useLocalSearchParams<{ artisanId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile } = useAuth()

  const [artisan, setArtisan] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

  const [selectedService, setSelectedService] = useState<any>(null)
  const [customService, setCustomService] = useState(false)
  const [customJobName, setCustomJobName] = useState('')

  // Calendar state
  const _now = new Date()
  const [calYear, setCalYear] = useState(_now.getFullYear())
  const [calMonth, setCalMonth] = useState(_now.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const buildCalendar = () => {
    const first = new Date(calYear, calMonth, 1)
    const last = new Date(calYear, calMonth + 1, 0)
    const startDay = first.getDay()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(calYear, calMonth, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const isPast = (d: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return d < today
  }

  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: ap } = await supabase
        .from('artisan_profiles')
        .select('*, profiles:user_id(full_name, avatar_url, phone, email)')
        .eq('user_id', artisanId).single()
      const { data: sv } = await supabase
        .from('artisan_services')
        .select('*').eq('artisan_id', artisanId).eq('is_active', true)
      setArtisan(ap)
      setServices(sv || [])
      setLoading(false)
    }
    load()
  }, [artisanId])

  const canNext = () => {
    if (step === 0) {
      if (customService) return customJobName.trim().length > 2
      return !!selectedService
    }
    if (step === 1) return !!(selectedDay && selectedTime)
    if (step === 2) return address.trim().length > 3
    return true
  }

  const submit = async () => {
    if (!user || !selectedDay || !selectedTime) return
    if (!customService && !selectedService) return
    if (customService && !customJobName.trim()) return
    setSaving(true)

    const [h, m] = selectedTime.split(':').map(Number)
    const scheduled = new Date(selectedDay)
    scheduled.setHours(h, m, 0, 0)

    // Custom requests have no fixed price yet — the artisan quotes
    // once they see the job (matches how this already works when an
    // artisan has zero services listed; now available any time the
    // customer wants to describe their own job instead of picking
    // from the artisan's preset list).
    const jobTitle = customService ? customJobName.trim() : selectedService.name
    const jobPrice = customService ? null : selectedService.min_price

    const { data, error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      artisan_id: artisanId,
      title: jobTitle,
      service_type: jobTitle,
      description: description.trim() || null,
      notes: notes.trim() || null,
      address: address.trim(),
      price: jobPrice,
      status: 'pending',
      scheduled_at: scheduled.toISOString(),
    }).select().single()

    if (error) {
      setSaving(false)
      Alert.alert('Error', 'Could not create booking. Please try again.')
      return
    }

    // In-app notification for artisan
    await supabase.from('notifications').insert({
      user_id: artisanId,
      title: 'New Booking Request',
      body: `${profile?.full_name || 'A customer'} wants to book ${jobTitle}`,
      type: 'booking_new',
      read: false,
      data: { booking_id: data.id },
    })

    // Resend email — booking confirmation
    const artisanProfile = artisan?.profiles as any
    await sendBookingEmail({
      customerEmail: profile?.email || user.email || '',
      customerName: profile?.full_name || 'Customer',
      artisanEmail: artisanProfile?.email || '',
      artisanName: artisanProfile?.full_name || 'Artisan',
      service: jobTitle,
      date: scheduled.toLocaleDateString('en-GH', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      }),
      time: selectedTime,
      address: address.trim(),
      price: jobPrice != null ? String(jobPrice) : 'To be quoted',
      bookingId: data.id,
    })

    setBookingId(data.id)
    setSaving(false)
    setStep(4)
  }

  const next = () => {
    if (!canNext()) {
      const msgs = [
        'Please select a service.',
        'Please select a date and time.',
        'Please enter your address.',
        '',
      ]
      Alert.alert('Required', msgs[step])
      return
    }
    if (step === 3) { submit(); return }
    setStep(s => s + 1)
  }

  const artisanName = (artisan?.profiles as any)?.full_name || 'Artisan'
  const artisanAvatar = (artisan?.profiles as any)?.avatar_url

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    stepsRow: { flexDirection: 'row', gap: 4 },
    stepSeg: { flex: 1, height: 3, borderRadius: 2 },
    stepLabels: { flexDirection: 'row', marginTop: 6 },
    stepLbl: { flex: 1, fontSize: 10, fontWeight: '600', textAlign: 'center', color: 'rgba(255,255,255,0.55)' },
    stepLblActive: { color: '#FFF', fontWeight: '800' },
    body: { flex: 1, backgroundColor: C.background },
    artCard: {
      backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
      borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    artAvatarImg: { width: 50, height: 50, borderRadius: 14 },
    artAvatarFall: { width: 50, height: 50, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    artAvatarTxt: { color: '#FFF', fontWeight: '800', fontSize: 18 },
    artName: { fontSize: 15, fontWeight: '700', color: C.text },
    artTrade: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    artRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    artRatingTxt: { fontSize: 12, color: C.textSecondary },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginHorizontal: 16, marginTop: 22, marginBottom: 12 },
    serviceModeRow: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 14,
      backgroundColor: C.card, borderRadius: 14, padding: 4, gap: 4,
    },
    serviceModeBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    },
    serviceModeBtnActive: { backgroundColor: NAVY },
    serviceModeTxt: { fontSize: 13, fontWeight: '700', color: C.textSecondary },
    serviceModeTxtActive: { color: '#FFF' },
    customPriceNote: {
      fontSize: 12, color: C.textSecondary, marginTop: 14,
      backgroundColor: NAVY + '08', padding: 12, borderRadius: 12, lineHeight: 18,
    },
    serviceCard: {
      backgroundColor: C.card, marginHorizontal: 16, marginBottom: 10,
      borderRadius: 16, padding: 16, flexDirection: 'row',
      alignItems: 'center', gap: 12, borderWidth: 1.5,
    },
    serviceIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    serviceName: { fontSize: 15, fontWeight: '700', color: C.text },
    servicePrice: { fontSize: 13, color: NAVY, fontWeight: '700', marginTop: 3 },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: NAVY },
    dayName: { fontSize: 12, fontWeight: '600' },
    dayNum: { fontSize: 20, fontWeight: '900', marginTop: 2 },
    timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginTop: 8 },
    timeBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
    timeTxt: { fontSize: 14, fontWeight: '600' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 7, marginTop: 4 },
    input: {
      backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5,
      borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 15, color: C.text,
    },
    textArea: { height: 90, textAlignVertical: 'top' },
    summaryCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 14, borderRadius: 20, overflow: 'hidden' },
    summaryHead: { backgroundColor: NAVY, padding: 16 },
    summaryHeadTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    summaryLabel: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: C.text, textAlign: 'right', flex: 1, marginLeft: 16 },
    priceRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
    },
    escrowNote: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      backgroundColor: NAVY + '0D', borderRadius: 12, padding: 14,
      marginHorizontal: 16, marginTop: 14,
    },
    escrowTxt: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 19 },
    bottomBar: {
      flexDirection: 'row', gap: 12, padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      backgroundColor: C.background,
      borderTopWidth: 1, borderTopColor: C.border,
    },
    backStepBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    backStepTxt: { fontSize: 15, fontWeight: '700', color: C.text },
    nextBtn: { flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: NAVY },
    nextBtnTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    successBadge: { width: 100, height: 100, borderRadius: 30, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 10 },
    successSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: 10 },
    emailNote: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 28 },
    successBtns: { width: '100%', gap: 12 },
    trackBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    trackBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    homeBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    homeBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  })

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    </SafeAreaView>
  )

  // ── SUCCESS ─────────────────────────────────────────────────
  if (step === 4) return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={s.successWrap}>
        <View style={s.successBadge}>
          <CheckCircleIcon size={52} color="#22C55E" />
        </View>
        <Text style={s.successTitle}>Booking Sent!</Text>
        <Text style={s.successSub}>
          Your request has been sent to {artisanName}.{'\n'}
          They'll confirm shortly.
        </Text>
        <Text style={s.emailNote}>
          📧 A confirmation email has been sent to{'\n'}{profile?.email || user?.email}
        </Text>
        <View style={s.successBtns}>
          <TouchableOpacity style={s.trackBtn}
            onPress={() => router.replace({ pathname: '/(customer)/booking-detail' as any, params: { bookingId } })}>
            <Text style={s.trackBtnTxt}>View Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/(customer)/tabs/home' as any)}>
            <Text style={s.homeBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn}
            onPress={() => step === 0 ? router.back() : setStep(s => s - 1)}>
            <ArrowLeftIcon size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Book Artisan — Step {step + 1} of 4</Text>
        </View>
        <View style={s.stepsRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.stepSeg, {
              backgroundColor: i <= step ? GOLD : 'rgba(255,255,255,0.25)',
            }]} />
          ))}
        </View>
        <View style={s.stepLabels}>
          {STEPS.map((lbl, i) => (
            <Text key={i} style={[s.stepLbl, i === step && s.stepLblActive]}>{lbl}</Text>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Artisan mini card */}
          <View style={s.artCard}>
            {artisanAvatar
              ? <Image source={{ uri: artisanAvatar }} style={s.artAvatarImg} />
              : <View style={s.artAvatarFall}><Text style={s.artAvatarTxt}>{artisanName[0]}</Text></View>
            }
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={s.artName}>{artisanName}</Text>
                <CheckCircleIcon size={14} color={NAVY} />
              </View>
              <Text style={s.artTrade}>{artisan?.trade_category}</Text>
              <View style={s.artRating}>
                <StarIcon size={12} color={GOLD} fill={GOLD} />
                <Text style={s.artRatingTxt}>{artisan?.rating?.toFixed(1) || '0.0'} · {artisan?.location || 'Ghana'}</Text>
              </View>
            </View>
          </View>

          {/* STEP 0 — Service */}
          {step === 0 && <>
            <Text style={s.sectionTitle}>Select a Service</Text>

            {/* Toggle: pick a listed service vs describe your own job.
              Always available — not just when the artisan has zero
              services on file. */}
            {services.length > 0 && (
              <View style={s.serviceModeRow}>
                <TouchableOpacity
                  style={[s.serviceModeBtn, !customService && s.serviceModeBtnActive]}
                  onPress={() => setCustomService(false)}>
                  <Text style={[s.serviceModeTxt, !customService && s.serviceModeTxtActive]}>
                    Choose a Service
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.serviceModeBtn, customService && s.serviceModeBtnActive]}
                  onPress={() => setCustomService(true)}>
                  <Text style={[s.serviceModeTxt, customService && s.serviceModeTxtActive]}>
                    Describe My Own Job
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!customService && services.length > 0 && services.map(sv => {
              const sel = selectedService?.id === sv.id
              return (
                <TouchableOpacity key={sv.id}
                  style={[s.serviceCard, { borderColor: sel ? NAVY : C.border, backgroundColor: sel ? NAVY + '08' : C.card }]}
                  onPress={() => setSelectedService(sv)}>
                  <View style={s.serviceIconWrap}><Text style={{ fontSize: 22 }}>🔧</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.serviceName, { color: sel ? NAVY : C.text }]}>{sv.name}</Text>
                    <Text style={s.servicePrice}>₵{sv.min_price} – ₵{sv.max_price}</Text>
                  </View>
                  <View style={[s.radioOuter, { borderColor: sel ? NAVY : C.border }]}>
                    {sel && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              )
            })}

            {(customService || services.length === 0) && (
              <View style={{ paddingHorizontal: 16 }}>
                {services.length === 0 && (
                  <Text style={{ color: C.textSecondary, marginBottom: 12, fontSize: 14 }}>
                    This artisan hasn't listed specific services. Describe what you need and they'll quote you directly.
                  </Text>
                )}
                <Text style={s.label}>What do you need done? *</Text>
                <TextInput style={s.input}
                  value={customJobName} onChangeText={setCustomJobName}
                  placeholder="e.g. Fix a leaking kitchen pipe"
                  placeholderTextColor={C.textMuted} />
                <Text style={[s.label, { marginTop: 14 }]}>More details (optional)</Text>
                <TextInput style={[s.input, s.textArea]}
                  value={description} onChangeText={setDescription}
                  placeholder="Add any extra detail that will help the artisan quote accurately"
                  placeholderTextColor={C.textMuted} multiline />
                <Text style={s.customPriceNote}>
                  💬 No fixed price — {artisanName} will review your request and quote you directly before the job is confirmed.
                </Text>
              </View>
            )}
            <View style={{ height: 120 }} />
          </>}

          {/* STEP 1 — Date & Time */}
          {step === 1 && <>
            <Text style={s.sectionTitle}>Choose a Date</Text>

            {/* Month navigator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <TouchableOpacity onPress={prevMonth}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, color: NAVY, fontWeight: '700' }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>
                {new Date(calYear, calMonth).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextMonth}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, color: NAVY, fontWeight: '700' }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: C.textMuted }}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              {Array.from({ length: Math.ceil(buildCalendar().length / 7) }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', marginBottom: 3 }}>
                  {buildCalendar().slice(row * 7, row * 7 + 7).map((d, col) => {
                    if (!d) return <View key={col} style={{ flex: 1, height: 40 }} />
                    const past = isPast(d)
                    const sel = selectedDay?.toDateString() === d.toDateString()
                    const isToday = d.toDateString() === new Date().toDateString()
                    return (
                      <TouchableOpacity key={col} disabled={past}
                        style={{
                          flex: 1, height: 40, marginHorizontal: 1, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: sel ? NAVY : isToday ? NAVY + '18' : 'transparent',
                          opacity: past ? 0.3 : 1,
                          borderWidth: isToday && !sel ? 1 : 0,
                          borderColor: NAVY,
                        }}
                        onPress={() => setSelectedDay(d)}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: sel ? '900' : isToday ? '700' : '500',
                          color: sel ? '#FFF' : isToday ? NAVY : C.text,
                        }}>{d.getDate()}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </View>

            {/* Selected date confirmation */}
            {selectedDay && (
              <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: NAVY + '12', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={16} color={NAVY} />
                <Text style={{ fontSize: 13, color: NAVY, fontWeight: '700' }}>
                  {selectedDay.toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>Choose a Time</Text>
            <View style={s.timesGrid}>
              {TIMES.map(t => {
                const sel = selectedTime === t
                return (
                  <TouchableOpacity key={t}
                    style={[s.timeBtn, { borderColor: sel ? NAVY : C.border, backgroundColor: sel ? NAVY : C.card }]}
                    onPress={() => setSelectedTime(t)}>
                    <Text style={[s.timeTxt, { color: sel ? '#FFF' : C.text }]}>{t}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={{ height: 120 }} />
          </>}

          {/* STEP 2 — Details */}
          {step === 2 && <>
            <Text style={s.sectionTitle}>Job Details</Text>
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={s.label}>Your Address *</Text>
              <TextInput style={s.input} value={address} onChangeText={setAddress}
                placeholder="e.g. 14 Ring Road East, Accra"
                placeholderTextColor={C.textMuted} />
              <Text style={[s.label, { marginTop: 14 }]}>Describe the job</Text>
              <TextInput style={[s.input, s.textArea]}
                value={description} onChangeText={setDescription}
                placeholder="Describe what needs to be done..."
                placeholderTextColor={C.textMuted} multiline />
              <Text style={[s.label, { marginTop: 14 }]}>Special notes (optional)</Text>
              <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]}
                value={notes} onChangeText={setNotes}
                placeholder="e.g. Gate code, access instructions..."
                placeholderTextColor={C.textMuted} multiline />
            </View>
            <View style={{ height: 120 }} />
          </>}

          {/* STEP 3 — Confirm */}
          {step === 3 && <>
            <Text style={s.sectionTitle}>Review & Confirm</Text>
            <View style={s.summaryCard}>
              <View style={s.summaryHead}>
                <Text style={s.summaryHeadTxt}>Booking Summary</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Artisan</Text>
                <Text style={s.summaryValue}>{artisanName}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Service</Text>
                <Text style={s.summaryValue}>{customService ? customJobName : selectedService?.name}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Date</Text>
                <Text style={s.summaryValue}>
                  {selectedDay?.toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Time</Text>
                <Text style={s.summaryValue}>{selectedTime}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Address</Text>
                <Text style={s.summaryValue}>{address}</Text>
              </View>
              {description ? (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Job description</Text>
                  <Text style={s.summaryValue}>{description}</Text>
                </View>
              ) : null}
              <View style={s.priceRow}>
                <Text style={[s.summaryLabel, { fontWeight: '800', color: C.text, fontSize: 15 }]}>
                  {customService ? 'Price' : 'Estimated Price'}
                </Text>
                {customService ? (
                  <Text style={{ fontSize: 16, fontWeight: '800', color: NAVY }}>To be quoted</Text>
                ) : (
                  <Text style={{ fontSize: 22, fontWeight: '900', color: NAVY }}>
                    ₵{selectedService?.min_price}–₵{selectedService?.max_price}
                  </Text>
                )}
              </View>
            </View>

            {customService && (
              <View style={s.escrowNote}>
                <Text style={{ fontSize: 18 }}>💬</Text>
                <Text style={s.escrowTxt}>
                  Since this is a custom job, {artisanName} will review your request and send you a price quote before the job is confirmed. You won't be charged until you accept their quote.
                </Text>
              </View>
            )}

            <View style={s.escrowNote}>
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text style={s.escrowTxt}>
                Payment is held securely in escrow and only released to {artisanName} once you confirm the job is complete.
              </Text>
            </View>
            <View style={{ height: 120 }} />
          </>}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={s.backStepBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.backStepTxt}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, { opacity: saving ? 0.7 : 1 }]}
          onPress={next} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={s.nextBtnTxt}>
              {step === 3 ? '✓ Confirm Booking' : 'Continue →'}
            </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}