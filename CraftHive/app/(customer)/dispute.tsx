// app/(customer)/dispute.tsx — FINAL
// Writes to disputes table, notifies admin
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, ShieldIcon, CheckCircleIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'

const DISPUTE_TYPES = [
  { key: 'no_show', label: 'Artisan did not show up', icon: '🚫' },
  { key: 'poor_quality', label: 'Poor quality of work', icon: '⚠️' },
  { key: 'overcharged', label: 'Overcharged / wrong price', icon: '💸' },
  { key: 'damage', label: 'Property damaged', icon: '🏠' },
  { key: 'incomplete', label: 'Job not completed', icon: '🔧' },
  { key: 'other', label: 'Other issue', icon: '📝' },
]

export default function CustomerDispute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [booking, setBooking] = useState<any>(null)
  const [step, setStep] = useState(0) // 0=type, 1=details, 2=submitted
  const [type, setType] = useState('')
  const [details, setDetails] = useState('')
  const [evidence, setEvidence] = useState('')
  const [refund, setRefund] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ticketId, setTicketId] = useState('')

  useEffect(() => {
    supabase.from('bookings')
      .select('*, artisan_profiles:artisan_id(profiles:user_id(full_name))')
      .eq('id', bookingId).single()
      .then(({ data }) => setBooking(data))
  }, [bookingId])

  const submit = async () => {
    if (!details.trim()) { Alert.alert('Required', 'Please describe the issue.'); return }
    setSaving(true)

    const { data, error } = await supabase.from('disputes').insert({
      booking_id: bookingId,
      customer_id: user?.id,
      artisan_id: (booking?.artisan_profiles as any)?.user_id || booking?.artisan_id,
      type,
      details: details.trim(),
      evidence_notes: evidence.trim() || null,
      refund_requested: refund,
      status: 'open',
    }).select().single()

    if (error) {
      setSaving(false)
      Alert.alert('Error', 'Could not submit dispute. Please try again.')
      return
    }

    // Notify admin via notifications table
    await supabase.from('notifications').insert({
      user_id: null, // admin broadcast
      title: 'New Dispute Filed',
      body: `Dispute #${data.id.slice(0, 8).toUpperCase()} — ${DISPUTE_TYPES.find(t => t.key === type)?.label || type}`,
      type: 'dispute_new',
      read: false,
      data: { dispute_id: data.id, booking_id: bookingId },
    })

    setTicketId(data.id.slice(0, 8).toUpperCase())
    setSaving(false)
    setStep(2)
  }

  const artisanName = (booking?.artisan_profiles as any)?.profiles?.full_name || 'Artisan'

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
    // Progress
    progressWrap: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
    progressSeg: { flex: 1, height: 3, borderRadius: 2 },
    // Cards
    card: {
      backgroundColor: C.card, marginHorizontal: 16, marginTop: 16,
      borderRadius: 20, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    },
    cardTitle: { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 4 },
    cardSub: { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 18 },
    // Type buttons
    typeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5,
    },
    typeIcon: { fontSize: 22, width: 32 },
    typeLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
    // Details
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 4 },
    input: {
      backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5,
      borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 15, color: C.text, textAlignVertical: 'top',
    },
    refundRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.surface, borderRadius: 12,
      padding: 14, marginTop: 14, borderWidth: 1, borderColor: C.border,
    },
    refundTxt: { flex: 1, fontSize: 14, color: C.text },
    checkbox: {
      width: 24, height: 24, borderRadius: 6,
      borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },
    checkmark: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    // Buttons
    primaryBtn: {
      backgroundColor: NAVY, borderRadius: 16, paddingVertical: 18,
      alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 32,
    },
    primaryTxt: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    // Success
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    successBadge: { width: 100, height: 100, borderRadius: 30, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 10 },
    successSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: 16 },
    ticketBadge: { backgroundColor: NAVY + '10', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 28 },
    ticketTxt: { fontSize: 18, fontWeight: '900', color: NAVY, letterSpacing: 2 },
    timelineTxt: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    doneBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48 },
    doneTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  })

  if (step === 2) return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={s.successWrap}>
        <View style={s.successBadge}>
          <ShieldIcon size={48} color={NAVY} />
        </View>
        <Text style={s.successTitle}>Dispute Filed</Text>
        <Text style={s.successSub}>Your case has been submitted to our team.</Text>
        <View style={s.ticketBadge}>
          <Text style={s.ticketTxt}>Ticket #{ticketId}</Text>
        </View>
        <Text style={s.timelineTxt}>
          Our team reviews disputes within 24–48 hours.{'\n'}
          You'll receive an email and push notification with the outcome.{'\n\n'}
          {refund ? '💰 Your refund request has been noted.' : ''}
        </Text>
        <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(customer)/tabs/home' as any)}>
          <Text style={s.doneTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => step === 0 ? router.back() : setStep(s => s - 1)}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>File a Dispute</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressWrap}>
        {[0, 1].map(i => (
          <View key={i} style={[s.progressSeg, {
            backgroundColor: i <= step ? '#FFF' : 'rgba(255,255,255,0.25)',
          }]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Step 0 — Select type */}
          {step === 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>What went wrong?</Text>
              <Text style={s.cardSub}>Select the issue with your booking with {artisanName}.</Text>
              {DISPUTE_TYPES.map(dt => (
                <TouchableOpacity
                  key={dt.key}
                  style={[s.typeBtn, {
                    borderColor: type === dt.key ? NAVY : C.border,
                    backgroundColor: type === dt.key ? NAVY + '0D' : 'transparent',
                  }]}
                  onPress={() => setType(dt.key)}>
                  <Text style={s.typeIcon}>{dt.icon}</Text>
                  <Text style={[s.typeLabel, { color: type === dt.key ? NAVY : C.text }]}>
                    {dt.label}
                  </Text>
                  {type === dt.key && <CheckCircleIcon size={18} color={NAVY} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Describe the Issue</Text>
              <Text style={s.cardSub}>Provide as much detail as possible. Our team will review your case within 24–48 hours.</Text>

              <Text style={s.label}>What happened? *</Text>
              <TextInput
                style={[s.input, { height: 120 }]}
                value={details} onChangeText={v => setDetails(v.slice(0, 500))}
                placeholder={`Describe the issue with ${artisanName} in detail...`}
                placeholderTextColor={C.textMuted}
                multiline autoFocus />
              <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4, marginBottom: 8 }}>{details.length}/500</Text>

              <Text style={s.label}>Evidence or additional notes (optional)</Text>
              <TextInput
                style={[s.input, { height: 80 }]}
                value={evidence} onChangeText={setEvidence}
                placeholder="Photo descriptions, timestamps, chat messages..."
                placeholderTextColor={C.textMuted}
                multiline />

              {/* Refund checkbox */}
              <TouchableOpacity style={s.refundRow} onPress={() => setRefund(v => !v)}>
                <View style={[s.checkbox, {
                  borderColor: refund ? NAVY : C.border,
                  backgroundColor: refund ? NAVY : 'transparent',
                }]}>
                  {refund && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.refundTxt}>I am requesting a refund for this booking</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CTA */}
          {step === 0 ? (
            <TouchableOpacity
              style={[s.primaryBtn, { opacity: type ? 1 : 0.4 }]}
              onPress={() => type ? setStep(1) : Alert.alert('Required', 'Please select an issue type.')}
              disabled={!type}>
              <Text style={s.primaryTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryTxt}>Submit Dispute</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}