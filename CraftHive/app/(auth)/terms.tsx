// app/(auth)/terms.tsx — FINAL
// Reachable from both customer and artisan settings
// No green colors, useAppTheme
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, ChevronRightIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using CraftHive ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the App.\n\nThese terms apply to all users — customers who book services and artisans who provide them.`,
  },
  {
    title: '2. About CraftHive',
    body: `CraftHive is a mobile marketplace that connects customers with skilled artisans across Ghana. CraftHive acts as an intermediary platform and is not itself a service provider.\n\nWe do not employ artisans. All artisans are independent service providers who have passed our KYC verification process.`,
  },
  {
    title: '3. Artisan Verification',
    body: `All artisans on CraftHive must submit a valid government-issued ID and relevant trade certifications. Applications are reviewed by our admin team before artisans can receive bookings.\n\nApproval may take 1–2 business days. We reserve the right to reject or revoke approval at any time.`,
  },
  {
    title: '4. Bookings and Payments',
    body: `All payments are processed securely via our platform. Funds are held in escrow and only released to artisans after you confirm the job is complete.\n\nCraftHive charges a service fee on each transaction. This fee is displayed clearly before you confirm your booking.\n\nWe support MTN Mobile Money, Vodafone Cash, AirtelTigo Money, and card payments.`,
  },
  {
    title: '5. Cancellations and Refunds',
    body: `You may cancel a booking for free before the artisan confirms it. After confirmation, a cancellation fee may apply.\n\nRefund requests are reviewed on a case-by-case basis. If a job is not completed satisfactorily, you may file a dispute within 48 hours of the scheduled completion.\n\nApproved refunds are processed within 7 business days.`,
  },
  {
    title: '6. Code of Conduct',
    body: `All users must:\n• Treat others with respect\n• Provide accurate information\n• Not misuse the platform or attempt to circumvent our systems\n• Not engage in harassment, discrimination, or illegal activity\n\nViolations may result in account suspension or permanent banning.`,
  },
  {
    title: '7. Dispute Resolution',
    body: `If you have a dispute with an artisan or customer, please use the in-app dispute portal. Our team will investigate and respond within 48 hours.\n\nCraftHive's decision on disputes is final. We aim to be fair to both parties.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `CraftHive is not liable for:\n• The quality of work performed by artisans\n• Any damages arising from the use of our platform\n• Loss of data or technical issues\n\nOur total liability is limited to the transaction value of the disputed booking.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We may update these terms at any time. You will be notified of significant changes via the app. Continued use of the app after changes constitutes acceptance of the new terms.`,
  },
  {
    title: '10. Contact Us',
    body: `For questions about these terms, contact us at:\n\nEmail: franklanking65@gmail.com\nAddress: Sunyani, Bono Region, Ghana`,
  },
]

export default function Terms() {
  const router = useRouter()
  const { C, isDark } = useAppTheme()
  const [open, setOpen] = useState<number | null>(null)

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    heroBanner: { backgroundColor: NAVY, paddingHorizontal: 16, paddingVertical: 20, marginBottom: 8 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
    section: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: 'hidden' },
    secHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    secTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: C.text },
    secBody: { fontSize: 14, color: C.textSecondary, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
    updated: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginVertical: 20 },
  })

  const allText = SECTIONS.map(s => `${s.title}. ${s.body}`).join(' ')

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.heroBanner}>
          <Text style={s.heroTitle}>Terms & Conditions</Text>
          <Text style={s.heroSub}>Please read these terms carefully before using CraftHive.</Text>
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            <TouchableOpacity style={s.secHeader} onPress={() => setOpen(open === i ? null : i)}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: NAVY + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: NAVY }}>{i + 1}</Text>
              </View>
              <Text style={s.secTitle}>{sec.title}</Text>
              <View style={{ transform: [{ rotate: open === i ? '90deg' : '0deg' }] }}>
                <ChevronRightIcon size={16} color={C.textMuted} />
              </View>
            </TouchableOpacity>
            {open === i && <Text style={s.secBody}>{sec.body}</Text>}
          </View>
        ))}

        <Text style={s.updated}>Last updated: June 2025</Text>
        <View style={{ height: 60 }} />
      </ScrollView>

      <AudioFAB pageText={`Terms and Conditions for CraftHive. ${SECTIONS.length} sections covering bookings, payments, refunds and your rights.`} />
    </SafeAreaView>
  )
}