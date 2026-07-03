// app/(artisan)/job-detail.tsx — FINAL
// Navy, useAppTheme, accept/decline/progress, notify customer on confirm
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import Avatar from '../../src/components/Avatar'
import { notifyBookingConfirmed, notifyBookingCancelled, notifyJobStarted, notifyBookingCompleted } from '../../src/utils/sendNotification'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useAuth } from '../../src/context/AuthContext'
import AudioFAB from '../../src/components/AudioFAB'
import {
  ArrowLeftIcon, MapPinIcon, PhoneIcon, CalendarIcon,
  ClockIcon, CheckCircleIcon, XIcon, ToolIcon, ChatIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: NAVY + '15', text: NAVY },
  in_progress: { bg: '#EDE9FE', text: '#7C3AED' },
  completed: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function ArtisanJobDetail() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [booking, setBooking] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: b } = await supabase
        .from('bookings').select('*').eq('id', bookingId).single()
      setBooking(b)
      if (b?.customer_id) {
        const { data: c } = await supabase
          .from('profiles').select('id,full_name,avatar_url,phone,email').eq('id', b.customer_id).single()
        setCustomer(c)
      }
      setLoading(false)
    }
    load()
  }, [bookingId])

  const updateStatus = async (newStatus: string, confirmMsg: string) => {
    Alert.alert('Confirm', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes', onPress: async () => {
          setUpdating(true)
          await supabase.from('bookings').update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId)
          
          // If the job is completed, release the funds from Escrow!
          if (newStatus === 'completed') {
            await supabase.from('payments').update({ status: 'released' }).eq('booking_id', bookingId)
          }

          // Notify customer
          await supabase.from('notifications').insert({
            user_id: booking.customer_id,
            title: newStatus === 'confirmed' ? 'Booking Confirmed!' : `Booking ${newStatus.replace('_', ' ')}`,
            body: newStatus === 'confirmed'
              ? `Your booking for ${booking.title || booking.service_type} has been confirmed. Please proceed with payment.`
              : `Your booking status has been updated to ${newStatus.replace('_', ' ')}.`,
            type: `booking_${newStatus}`,
            read: false,
            data: { booking_id: bookingId },
          })

          setBooking((b: any) => ({ ...b, status: newStatus }))
          setUpdating(false)

          if (newStatus === 'completed') {
            Alert.alert('Job Completed!', 'The customer will be prompted to review your work.')
            router.back()
          }
        }
      },
    ])
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    </SafeAreaView>
  )

  if (!booking) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFF', fontSize: 16 }}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: GOLD, fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  const sc = STATUS_COLOR[booking.status] || { bg: C.surface, text: C.textSecondary }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 14, borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    titleTxt: { fontSize: 20, fontWeight: '900', color: C.text, flex: 1, marginRight: 10 },
    badge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
    badgeTxt: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    section: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, padding: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    infoTxt: { fontSize: 14, color: C.text },
    infoSub: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    custRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    custAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    custAvatarImg: { width: 46, height: 46, borderRadius: 14 },
    custAvatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    custName: { fontSize: 15, fontWeight: '800', color: C.text },
    custSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    custBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
    custBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: NAVY },
    custBtnTxt: { fontSize: 13, color: NAVY, fontWeight: '700' },
    notesTxt: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },
    actionsCard: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, padding: 16, marginBottom: 12 },
    actionsTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
    actionBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
    actionTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  })

  const custName = customer?.full_name || 'Customer'

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Job Details</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        {/* Title & status */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.titleTxt}>{booking.title || booking.service_type}</Text>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeTxt, { color: sc.text }]}>{booking.status.replace('_', ' ')}</Text>
            </View>
          </View>

          <View style={s.infoRow}>
            <CalendarIcon size={16} color={NAVY} />
            <View>
              <Text style={s.infoTxt}>{fmtDate(booking.scheduled_at)}</Text>
              <Text style={s.infoSub}>{fmtTime(booking.scheduled_at)}</Text>
            </View>
          </View>

          {booking.address && (
            <View style={s.infoRow}>
              <MapPinIcon size={16} color={NAVY} />
              <Text style={s.infoTxt} numberOfLines={2}>{booking.address}</Text>
            </View>
          )}

          <View style={s.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>Service Price</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: NAVY }}>₵{booking.price || 0}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer</Text>
          <View style={s.custRow}>
            <Avatar
              uri={customer?.avatar_url}
              name={custName}
              size={46}
              radius={14}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.custName}>{custName}</Text>
              {customer?.phone && <Text style={s.custSub}>{customer.phone}</Text>}
            </View>
          </View>
          <View style={s.custBtns}>
            {customer?.phone && (
              <TouchableOpacity style={s.custBtn}
                onPress={() => { const { Linking } = require('react-native'); Linking.openURL(`tel:${customer.phone}`) }}>
                <PhoneIcon size={16} color={NAVY} />
                <Text style={s.custBtnTxt}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.custBtn}
              onPress={() => router.push({ pathname: '/(artisan)/chat' as any, params: { bookingId, otherName: custName } })}>
              <ChatIcon size={16} color={NAVY} />
              <Text style={s.custBtnTxt}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        {booking.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Job Notes</Text>
            <Text style={s.notesTxt}>{booking.description}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsCard}>
          <Text style={s.actionsTitle}>Actions</Text>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: NAVY }]}
                onPress={() => updateStatus('confirmed', 'Accept this booking?')} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <>
                  <CheckCircleIcon size={18} color="#FFF" />
                  <Text style={s.actionTxt}>Accept Booking</Text>
                </>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => updateStatus('cancelled', 'Decline this booking?')} disabled={updating}>
                <XIcon size={18} color="#FFF" />
                <Text style={s.actionTxt}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {booking.status === 'confirmed' && (
            <>
              {booking.payment_status === 'paid' ? (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#7C3AED' }]}
                  onPress={() => updateStatus('in_progress', 'Mark job as started?')} disabled={updating}>
                  {updating ? <ActivityIndicator color="#FFF" /> : <>
                    <ToolIcon size={18} color="#FFF" />
                    <Text style={s.actionTxt}>Start Job</Text>
                  </>}
                </TouchableOpacity>
              ) : (
                <View style={{ padding: 16, backgroundColor: '#FEF3C7', borderRadius: 14, marginBottom: 10 }}>
                  <Text style={{ color: '#D97706', fontSize: 14, textAlign: 'center', fontWeight: '700' }}>
                    Waiting for customer to pay into Escrow before you can start the job.
                  </Text>
                </View>
              )}
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: NAVY, marginTop: 10 }]}
                onPress={() => router.push({ pathname: '/(artisan)/tracking' as any, params: { bookingId } })}>
                <MapPinIcon size={18} color="#FFF" />
                <Text style={s.actionTxt}>Navigate &amp; Share Live Location</Text>
              </TouchableOpacity>
            </>
          )}
          {booking.status === 'in_progress' && (
            <>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#16A34A' }]}
                onPress={() => updateStatus('completed', 'Mark job as complete?')} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <>
                  <CheckCircleIcon size={18} color="#FFF" />
                  <Text style={s.actionTxt}>Mark Complete</Text>
                </>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: NAVY, marginTop: 10 }]}
                onPress={() => router.push({ pathname: '/(artisan)/tracking' as any, params: { bookingId } })}>
                <MapPinIcon size={18} color="#FFF" />
                <Text style={s.actionTxt}>Navigate &amp; Share Live Location</Text>
              </TouchableOpacity>
            </>
          )}
          {['completed', 'cancelled'].includes(booking.status) && (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: C.textSecondary, fontSize: 14 }}>
                This booking is {booking.status}.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <AudioFAB pageText={`Job details. ${booking.title || booking.service_type}. Status ${booking.status}. Customer ${custName}. Price GHC ${booking.price || 0}.`} />
    </SafeAreaView>
  )
}