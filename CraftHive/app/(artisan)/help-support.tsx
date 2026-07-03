// app/(customer)/help-support.tsx — FINAL
// Saves support tickets to DB, working FAQ accordion, contact links
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import AudioFAB from '../../src/components/AudioFAB'
import {
  ArrowLeftIcon, ChevronRightIcon, MailIcon,
  PhoneIcon, ChatIcon, ShieldIcon, XIcon, CheckCircleIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const FAQS = [
  {
    q: 'How do I book an artisan?',
    a: 'Go to Home, browse or search for artisans, tap on one you like and tap "Book Now". Follow the 4-step booking flow to select a service, date, time, and your address.',
  },
  {
    q: 'How does payment work?',
    a: 'Your payment is held securely in escrow when you book. It is only released to the artisan after you confirm the job is complete. You can pay with MTN MoMo, Vodafone Cash, or card.',
  },
  {
    q: "What if the artisan doesn't show up?",
    a: 'Go to your booking and tap "File a Dispute". Select "Artisan did not show up" and submit. Our team will review within 24–48 hours and issue a full refund.',
  },
  {
    q: 'How do I cancel a booking?',
    a: 'Open the booking from "My Bookings" and tap "Cancel Booking". Cancellations are free before the artisan confirms. A fee may apply after confirmation.',
  },
  {
    q: 'How do I know an artisan is trustworthy?',
    a: 'All artisans are KYC-verified. They submit a government-issued ID and trade certifications reviewed by our admin team before they can receive any bookings.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes. File a dispute from your booking within 48 hours of completion. Our team reviews all disputes and issues refunds where applicable within 7 business days.',
  },
  {
    q: 'How do I rate an artisan?',
    a: 'After a job is marked as completed, go to the booking and tap "Rate Artisan". Your review helps other customers choose the best artisans.',
  },
  {
    q: 'How long does artisan approval take?',
    a: 'Artisan KYC verification takes 1–2 business days. Artisans are notified by email and in-app once approved.',
  },
]

export default function HelpSupport() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { t } = useLang()
  const { user, profile } = useAuth()

  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) { Alert.alert('Required', 'Please describe your issue.'); return }
    setSending(true)
    try {
      // Save to support_tickets table
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id || null,
        email: profile?.email || user?.email || null,
        subject: subject.trim() || 'General inquiry',
        message: message.trim(),
        status: 'open',
      })
      if (error) throw error
      setSending(false)
      setModal(false)
      setSubject('')
      setMessage('')
      setSent(true)
      Alert.alert(
        'Message Sent!',
        'Our team will respond within 24 hours via email.',
        [{ text: 'OK' }]
      )
    } catch (e) {
      setSending(false)
      Alert.alert('Error', 'Could not send message. Please email us directly at franklanking65@gmail.com')
    }
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    // Contact cards
    contactRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 },
    contactCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8 },
    contactIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    contactLbl: { fontSize: 13, fontWeight: '700', color: C.text },
    contactSub: { fontSize: 11, color: C.textSecondary, textAlign: 'center' },
    // Sent banner
    sentBanner: { backgroundColor: '#DCFCE7', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    sentTxt: { fontSize: 13, color: '#16A34A', fontWeight: '600', flex: 1 },
    // FAQs
    sectionTitle: { fontSize: 16, fontWeight: '900', color: C.text, marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
    faqCard: { backgroundColor: C.card, marginHorizontal: 16, marginBottom: 6, borderRadius: 14, overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    faqNum: { width: 26, height: 26, borderRadius: 8, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    faqNumTxt: { fontSize: 11, fontWeight: '800', color: NAVY },
    faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
    faqA: { fontSize: 14, color: C.textSecondary, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
    // Send message button
    messageBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: NAVY, marginHorizontal: 16, marginTop: 20, marginBottom: 40, borderRadius: 16, padding: 16 },
    messageBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1 },
    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    lbl: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
    saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    emailPre: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.textSecondary, marginBottom: 14 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        {/* Contact options */}
        <View style={s.contactRow}>
          <TouchableOpacity style={s.contactCard}
            onPress={() => Linking.openURL('mailto:franklanking65@gmail.com').catch(() =>
              Alert.alert('Email', 'franklanking65@gmail.com'))}>
            <View style={s.contactIcon}><MailIcon size={22} color={NAVY} /></View>
            <Text style={s.contactLbl}>Email Us</Text>
            <Text style={s.contactSub}>franklanking65@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactCard}
            onPress={() => Linking.openURL('tel:+233507086487').catch(() =>
              Alert.alert(t('help.callUs'), '050 708 6487'))}>
            <View style={s.contactIcon}><PhoneIcon size={22} color={NAVY} /></View>
            <Text style={s.contactLbl}>Call / WhatsApp</Text>
            <Text style={s.contactSub}>050 708 6487</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactCard} onPress={() => setModal(true)}>
            <View style={s.contactIcon}><ChatIcon size={22} color={NAVY} /></View>
            <Text style={s.contactLbl}>Message</Text>
            <Text style={s.contactSub}>We reply in 24h</Text>
          </TouchableOpacity>
        </View>

        {/* Sent confirmation */}
        {sent && (
          <View style={s.sentBanner}>
            <CheckCircleIcon size={18} color="#16A34A" />
            <Text style={s.sentTxt}>Message sent! We'll reply within 24 hours.</Text>
          </View>
        )}

        {/* FAQs */}
        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => (
          <View key={i} style={s.faqCard}>
            <TouchableOpacity
              style={s.faqHeader}
              onPress={() => setOpenFaq(openFaq === i ? null : i)}
              activeOpacity={0.7}>
              <View style={s.faqNum}><Text style={s.faqNumTxt}>{i + 1}</Text></View>
              <Text style={s.faqQ}>{faq.q}</Text>
              <View style={{ transform: [{ rotate: openFaq === i ? '90deg' : '0deg' }] }}>
                <ChevronRightIcon size={16} color={C.textMuted} />
              </View>
            </TouchableOpacity>
            {openFaq === i && <Text style={s.faqA}>{faq.a}</Text>}
          </View>
        ))}

        {/* Send message button */}
        <TouchableOpacity style={s.messageBtn} onPress={() => setModal(true)}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <ChatIcon size={20} color="#FFF" />
          </View>
          <Text style={s.messageBtnTxt}>Send Us a Message</Text>
          <ChevronRightIcon size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </ScrollView>

      {/* Send message modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Send a Message</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setModal(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Show user's email pre-filled */}
            <Text style={s.lbl}>Your Email</Text>
            <Text style={s.emailPre}>{profile?.email || user?.email || 'Not set'}</Text>

            <Text style={s.lbl}>Subject</Text>
            <TextInput
              style={s.input} value={subject} onChangeText={setSubject}
              placeholder="e.g. Issue with my booking" placeholderTextColor={C.textMuted}
            />

            <Text style={s.lbl}>Message *</Text>
            <TextInput
              style={[s.input, { height: 120, textAlignVertical: 'top', marginBottom: 20 }]}
              value={message} onChangeText={setMessage}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={C.textMuted} multiline
            />

            <TouchableOpacity style={s.saveBtn} onPress={sendMessage} disabled={sending}>
              {sending ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Send Message</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AudioFAB pageText="Help and Support. Browse frequently asked questions or send us a message." />
    </SafeAreaView>
  )
}