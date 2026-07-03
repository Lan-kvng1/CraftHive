// app/(auth)/splash.tsx  — FINAL: handles artisan pending routing
import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Image, Text, useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { supabase } from '../../src/lib/supabase'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const G = '#1B4332'
const GOLD = '#FFB800'

export default function SplashScreen() {
  const router = useRouter()
  const { user, loading, profile } = useAuth()
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'

  const logoScale = useRef(new Animated.Value(0.6)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const ringScale = useRef(new Animated.Value(0.4)).current
  const ringOpacity = useRef(new Animated.Value(0.6)).current

  useEffect(() => {
    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.6, duration: 1400, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()

    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    if (loading) return

    // Splash shows for at least 2.5s for the animation, then routes
    const timer = setTimeout(async () => {
      try {
        console.log('[Splash] user:', !!user, 'role:', profile?.role)

        // ── Logged in → go to home ─────────────────────────────────
        if (user) {
          if (profile?.role === 'artisan') {
            const { data: ap } = await supabase
              .from('artisan_profiles')
              .select('status')
              .eq('user_id', user.id)
              .single()
            if (ap?.status === 'approved') {
              router.replace('/(artisan)/tabs/home' as any)
            } else if (ap?.status === 'pending') {
              router.replace('/(auth)/artisan-pending' as any)
            } else {
              router.replace('/(auth)/artisan-setup' as any)
            }
          } else if (profile?.role === 'admin') {
            router.replace('/(auth)/login' as any)
          } else {
            router.replace('/(customer)/tabs/home' as any)
          }
          return
        }

        // ── Not logged in → always show onboarding first ───────────
        router.replace('/(auth)/onboarding' as any)
      } catch (e) {
        console.error('Splash routing error:', e)
        router.replace('/(auth)/login' as any)
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [loading])

  const bg = isDark ? '#0F172A' : '#F4F6FB'
  const logoSource = isDark
    ? require('../../assets/images/logo.png')
    : require('../../assets/images/logo-dark.png')

  const s = StyleSheet.create({
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg },
    ring: {
      position: 'absolute', width: 200, height: 200, borderRadius: 100,
      borderWidth: 2, borderColor: GOLD + '55',
    },
    logoImg: { width: 160, height: 160, resizeMode: 'contain' },
    appName: { fontSize: 36, fontWeight: '900', color: isDark ? '#FFF' : '#1A202C', letterSpacing: 1.5, marginTop: 24 },
    tagline: { fontSize: 15, color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B', marginTop: 6 },
    versionTxt: { position: 'absolute', bottom: 36, fontSize: 12, color: isDark ? 'rgba(255,255,255,0.25)' : '#CBD5E1' },
    loadDots: { position: 'absolute', bottom: 60, flexDirection: 'row', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : '#CBD5E1' },
    dotActive: { backgroundColor: GOLD, width: 24 },
  })

  return (
    <View style={s.wrap}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <Animated.Image source={logoSource} style={[s.logoImg, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]} />
      <Animated.Text style={[s.appName, { opacity: textOpacity }]}>CraftHive</Animated.Text>
      <Animated.Text style={[s.tagline, { opacity: textOpacity }]}>Ghana's artisan marketplace</Animated.Text>
      <Animated.View style={[s.loadDots, { opacity: textOpacity }]}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </Animated.View>
      <Animated.Text style={[s.versionTxt, { opacity: textOpacity }]}>v1.0.0</Animated.Text>
    </View>
  )
}