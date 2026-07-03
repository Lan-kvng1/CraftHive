// app/(auth)/artisan-pending.tsx — FINAL
// Shown after artisan registers, waiting for admin approval
// No green colors, correct navigation
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { CheckCircleIcon, ClockIcon, BellIcon, LogOutIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

export default function ArtisanPending() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [checking, setChecking] = useState(false)

  // Poll for approval status every 30s
  // Also guard: if setup is incomplete, redirect back to setup
  useEffect(() => {
    const check = async () => {
      if (!user) return
      const { data } = await supabase
        .from('artisan_profiles')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (!data) return

      // status is set to 'pending' only after artisan completes setup and submits
      // If status is null/undefined, they haven't finished setup yet
      if (!data.status || (data.status !== 'pending' && data.status !== 'approved')) {
        router.replace('/(auth)/artisan-setup' as any)
        return
      }

      if (data.status === 'approved') {
        router.replace('/(artisan)/home' as any)
      }
      // status === 'pending' → stay on this screen (waiting for admin)
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [user])

  const checkNow = async () => {
    setChecking(true)
    const { data } = await supabase
      .from('artisan_profiles')
      .select('status')
      .eq('user_id', user?.id)
      .single()
    setChecking(false)
    if (!data) return

    if (!data.status || (data.status !== 'pending' && data.status !== 'approved')) {
      // Setup not submitted yet
      router.replace('/(auth)/artisan-setup' as any)
    } else if (data.status === 'approved') {
      router.replace('/(artisan)/home' as any)
    }
    // else status === 'pending' → stay on this screen
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    iconWrap: { width: 100, height: 100, borderRadius: 32, backgroundColor: GOLD + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 2, borderColor: GOLD + '40' },
    title: { fontSize: 26, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    stepsCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, width: '100%', marginBottom: 28 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    stepNum: { width: 30, height: 30, borderRadius: 10, backgroundColor: NAVY, borderWidth: 1.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
    stepNumTxt: { color: GOLD, fontSize: 13, fontWeight: '800' },
    stepTxt: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1 },
    checkBtn: { backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', width: '100%', marginBottom: 12 },
    checkTxt: { fontSize: 16, fontWeight: '800', color: NAVY },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
    logoutTxt: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    noteTxt: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  })

  const STEPS = [
    'Your application has been submitted',
    'Our admin team reviews your ID and documents',
    'You receive an email and in-app notification when approved',
    'Your profile goes live and you can accept bookings',
  ]

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={s.container}>
        <View style={s.iconWrap}>
          <ClockIcon size={48} color={GOLD} />
        </View>

        <Text style={s.title}>Application Under Review</Text>
        <Text style={s.subtitle}>
          Your artisan application is being reviewed by our team.
          This usually takes 1–2 business days.
        </Text>

        {/* What happens next */}
        <View style={s.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={i} style={[s.stepRow, i === STEPS.length - 1 && { marginBottom: 0 }]}>
              <View style={s.stepNum}>
                {i < 2
                  ? <Text style={s.stepNumTxt}>{i + 1}</Text>
                  : <CheckCircleIcon size={16} color={GOLD} />
                }
              </View>
              <Text style={s.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Check status button */}
        <TouchableOpacity style={s.checkBtn} onPress={checkNow} disabled={checking}>
          {checking
            ? <ActivityIndicator color={NAVY} />
            : <Text style={s.checkTxt}>Check Approval Status</Text>
          }
        </TouchableOpacity>

        <Text style={s.noteTxt}>
          The app checks automatically every 30 seconds.{'\n'}
          You will be redirected as soon as you are approved.
        </Text>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn}
          onPress={async () => { await signOut(); router.replace('/(auth)/login' as any) }}>
          <LogOutIcon size={16} color="rgba(255,255,255,0.4)" />
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}