// app/(auth)/privacy.tsx — FINAL (all SVG icons, no emoji)
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import {
  ArrowLeftIcon, ChevronRightIcon,
  ShieldIcon, GlobeIcon,
  CheckCircleIcon, MailIcon, MapPinIcon, BellIcon,
} from '../../src/components/Icons'

const NAVY = '#0A2463'

const SECTIONS = [
  {
    icon: ShieldIcon,
    title: '1. Information We Collect',
    body: 'We collect account details (name, email, phone, location, profile photo), artisan-specific data (government ID for KYC, trade category, certifications, portfolio photos, bank or mobile money details), and usage data (booking history, transaction records, device info, and in-app messages).',
  },
  {
    icon: ShieldIcon,
    title: '2. How We Use Your Information',
    body: 'We use your data to create and manage your account, match customers with nearby artisans, process bookings and payments, verify artisan identity (KYC compliance), send booking confirmations and status updates, prevent fraud and enforce our Terms, and improve our platform.\n\nWe do NOT use your data to serve third-party advertisements.',
  },
  {
    icon: ShieldIcon,
    title: '3. How We Protect Your Data',
    body: 'All data is encrypted in transit using TLS 1.3. Sensitive data (ID numbers, bank details) is encrypted at rest using AES-256. Payment data is handled by Stripe (PCI-DSS Level 1 certified). We use row-level security on our database, and immutable audit logs record all sensitive actions.',
  },
  {
    icon: GlobeIcon,
    title: '4. Data Sharing',
    body: 'We share your data only when necessary: with the other party in a booking (name, phone, booking details); with payment processors (Stripe and mobile money providers); and with law enforcement only when legally required by Ghanaian law.\n\nWe never sell your personal data to third parties.',
  },
  {
    icon: MapPinIcon,
    title: '5. Location Data',
    body: 'CraftHive uses your device location to show artisans near you, allow artisans to navigate to your address, and power the live tracking feature during active bookings.\n\nWe do not track your location when the app is closed.',
  },
  {
    icon: CheckCircleIcon,
    title: '6. Your Rights (NDPR)',
    body: 'Under Ghana\'s Data Protection Act 2012 and the NDPR, you have the right to access, correct, erase, and receive a copy of your data, as well as the right to object to marketing communications.\n\nTo exercise any of these rights, email franklanking65@gmail.com.',
  },
  {
    icon: MailIcon,
    title: '7. Contact & Data Controller',
    body: 'CraftHive Ltd is the data controller for your personal data.\n\nData Protection Officer: franklanking65@gmail.com\nPrivacy: franklanking65@gmail.com\nAddress: Sunyani, Bono Region, Ghana\nPhone: 0507086487\n\nRegistered with the Data Protection Commission of Ghana.',
  },
]

export default function PrivacyPolicy() {
  const router = useRouter()
  const { C } = useAppTheme()
  const [expanded, setExpanded] = useState<number | null>(null)

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
    heroBand: {
      backgroundColor: NAVY + '0D', padding: 16, marginBottom: 4, alignItems: 'center',
    },
    heroTxt: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
    lastUpdated: { fontSize: 12, color: C.textMuted, marginTop: 4 },
    item: {
      backgroundColor: C.card, marginHorizontal: 16, marginBottom: 8,
      borderRadius: 14, overflow: 'hidden',
    },
    head: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 15, gap: 12,
    },
    iconWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
    body2: { paddingHorizontal: 16, paddingBottom: 18 },
    divider: { height: 1, backgroundColor: C.border, marginBottom: 14 },
    bodyTxt: { fontSize: 14, color: C.textSecondary, lineHeight: 23 },
    footer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    footerTxt: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
    link: { color: NAVY, fontWeight: '700' },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.heroBand}>
          <Text style={s.heroTxt}>CraftHive is committed to protecting your privacy.</Text>
          <Text style={s.lastUpdated}>Last updated: June 2026</Text>
        </View>

        {SECTIONS.map((sec, i) => {
          const SvgIcon = sec.icon
          return (
            <View key={i} style={s.item}>
              <TouchableOpacity style={s.head} onPress={() => setExpanded(expanded === i ? null : i)}>
                <View style={s.iconWrap}>
                  <SvgIcon size={17} color={NAVY} />
                </View>
                <Text style={s.sectionTitle}>{sec.title}</Text>
                {expanded === i
                  ? <Text style={{ fontSize: 14, color: C.textMuted, fontWeight: '700' }}>▾</Text>
                  : <View style={{ transform: [{ rotate: expanded === i ? '90deg' : '0deg' }] }}><ChevronRightIcon size={16} color={C.textMuted} /></View>
                }
              </TouchableOpacity>
              {expanded === i && (
                <View style={s.body2}>
                  <View style={s.divider} />
                  <Text style={s.bodyTxt}>{sec.body}</Text>
                </View>
              )}
            </View>
          )
        })}

        <View style={s.footer}>
          <Text style={s.footerTxt}>
            Also see our{' '}
            <Text style={s.link} onPress={() => router.push('/(auth)/terms' as any)}>
              Terms & Conditions
            </Text>.{'\n'}Questions? Email franklanking65@gmail.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}