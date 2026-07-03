// app/(auth)/login.tsx — FINAL
// Smart routing: artisans who haven't completed setup go to artisan-setup
// Artisans who completed setup but aren't approved go to artisan-pending
// Duplicate email/phone checked on signup
// T&C acceptance required before signup
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  Alert, ActivityIndicator, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { EyeIcon, EyeOffIcon, UserIcon, ToolIcon, CheckIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

// Setup is "complete" when:
// - trade_category is set (artisan filled step 1)
// - location is set (artisan filled step 2)
// Portfolio is desired but not required here — upload can fail due to network.
// status='pending' is set at the END of artisan-setup submit, so it's the
// most reliable signal that the artisan actually finished and submitted.
function isSetupComplete(ap: any): boolean {
  if (!ap) return false
  // Primary signal: status was explicitly set to 'pending' or 'approved'
  // by the submit button in artisan-setup. If it's still null or
  // the default value from upsert it means setup was never submitted.
  // 'pending' is set by artisan-setup submit button
  // null or missing means they never submitted the setup form
  if (ap.status === 'pending' || ap.status === 'approved') {
    return true  // setup was submitted
  }
  return false
}

export default function LoginScreen() {
  const router = useRouter()
  const { C } = useAppTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'customer' | 'artisan'>('customer')
  const [acceptedTc, setAcceptedTc] = useState(false)

  // ── LOGIN ────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })
      if (error) { Alert.alert('Login Failed', error.message); setLoading(false); return }
      if (!data.user) { Alert.alert('Error', 'Could not sign in. Try again.'); setLoading(false); return }

      // Fetch profile role
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()

      setLoading(false)

      if (profile?.role === 'artisan') {
        // Fetch full artisan profile to check setup completion
        const { data: ap } = await supabase
          .from('artisan_profiles')
          .select('status')
          .eq('user_id', data.user.id)
          .single()

        if (!ap || !isSetupComplete(ap)) {
          // Setup not done — send back to complete it
          router.replace('/(auth)/artisan-setup' as any)
        } else if (ap.status === 'approved') {
          router.replace('/(artisan)/tabs/home' as any)
        } else {
          // Setup done, waiting for admin approval
          router.replace('/(auth)/artisan-pending' as any)
        }
      } else {
        router.replace('/(customer)/tabs/home' as any)
      }
    } catch (e: any) {
      setLoading(false)
      Alert.alert('Error', e?.message || 'Something went wrong.')
    }
  }

  // ── SIGNUP ───────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please fill in all fields including phone number.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }
    if (!acceptedTc) {
      Alert.alert('Terms Required', 'You must accept the Terms & Conditions to create an account.')
      return
    }

    setLoading(true)
    try {
      // ── Check duplicate email ────────────────────────────────────────
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()
      if (existingEmail) {
        setLoading(false)
        Alert.alert('Email Already Registered', 'An account with this email already exists. Please sign in instead.')
        return
      }

      // ── Check duplicate phone ────────────────────────────────────────
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone.trim())
        .maybeSingle()
      if (existingPhone) {
        setLoading(false)
        Alert.alert('Phone Already Registered', 'An account with this phone number already exists.')
        return
      }

      // ── Create auth user ─────────────────────────────────────────────
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: { data: { full_name: fullName.trim(), role } },
      })
      if (error) { setLoading(false); Alert.alert('Sign Up Failed', error.message); return }

      let uid = data.user?.id
      let session = data.session

      // If email confirmation is ON, sign in immediately to get a session
      if (!session && uid) {
        const { data: siData } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(), password: password.trim(),
        })
        uid = siData.user?.id || uid
        session = siData.session
      }

      if (uid) {
        // ── Write profile ─────────────────────────────────────────────
        await supabase.from('profiles').upsert({
          id: uid,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
        })

        // ── Create artisan_profiles row ───────────────────────────────
        if (role === 'artisan') {
          await supabase.from('artisan_profiles').upsert({
            user_id: uid,
            rating: 0,
            total_reviews: 0,
            total_jobs: 0,
            years_experience: 0,
            total_earnings: 0,
            status: null,  // null = setup not submitted yet
            // status is set to 'pending' only when artisan submits setup form
          })
        }
      }

      setLoading(false)

      if (role === 'artisan') {
        // Always send new artisans to setup (trade_category is null)
        router.replace('/(auth)/artisan-setup' as any)
      } else {
        // Customer — go straight to home if we have a session
        if (session) {
          router.replace('/(customer)/tabs/home' as any)
        } else {
          Alert.alert('Account Created!', 'Welcome to CraftHive! Please sign in.', [
            { text: 'Sign In', onPress: () => setMode('login') },
          ])
        }
      }
    } catch (e: any) {
      setLoading(false)
      Alert.alert('Error', e?.message || 'Something went wrong. Please try again.')
    }
  }

  // ── STYLES ───────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    scroll: { flexGrow: 1 },
    hero: {
      paddingTop: 48, paddingBottom: 36,
      paddingHorizontal: 24, alignItems: 'center',
    },
    logo: { width: 90, height: 90, marginBottom: 16 },
    appName: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 1, marginBottom: 4 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
    card: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 24, padding: 24, marginBottom: 16 },
    tabRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 4, marginBottom: 22 },
    tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
    tabTxt: { fontSize: 15, fontWeight: '700' },
    heading: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
    subTxt: { fontSize: 14, color: C.textSecondary, marginBottom: 22, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 7 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, marginBottom: 16 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.text },
    eyeBtn: { padding: 6 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    roleCard: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8, borderWidth: 1.5 },
    roleTxt: { fontSize: 14, fontWeight: '700' },
    // T&C checkbox row
    tcRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
    tcCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: NAVY, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
    tcText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 19 },
    tcLink: { color: NAVY, fontWeight: '700', textDecorationLine: 'underline' },
    signInBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
    signInBtnDisabled: { opacity: 0.5 },
    signInTxt: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 18 },
    forgotTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    footer: { alignItems: 'center', paddingVertical: 24 },
    footerTxt: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    footerLink: { color: GOLD, fontWeight: '800' },
    termsWrap: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
    termsTxt: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 18 },
    termsLink: { color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  })

  const isSignupReady = mode === 'login' || acceptedTc

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={s.hero}>
            <Image source={require('../../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.appName}>CraftHive</Text>
            <Text style={s.tagline}>
              {mode === 'login' ? 'Welcome back — skilled work awaits' : "Join Ghana's artisan marketplace"}
            </Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Tabs */}
            <View style={s.tabRow}>
              {(['login', 'signup'] as const).map(m => (
                <TouchableOpacity key={m}
                  style={[s.tabBtn, { backgroundColor: mode === m ? NAVY : 'transparent' }]}
                  onPress={() => { setMode(m); setAcceptedTc(false) }}>
                  <Text style={[s.tabTxt, { color: mode === m ? '#FFF' : C.textSecondary }]}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.heading}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={s.subTxt}>
              {mode === 'login' ? 'Sign in to your CraftHive account' : 'Fill in your details to get started'}
            </Text>

            {/* Sign Up extras */}
            {mode === 'signup' && (
              <>
                <Text style={s.label}>Full Name *</Text>
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={fullName} onChangeText={setFullName}
                    placeholder="Your full name" placeholderTextColor={C.textMuted} autoCapitalize="words" />
                </View>

                <Text style={s.label}>Phone Number *</Text>
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={phone} onChangeText={setPhone}
                    placeholder="024 XXX XXXX" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
                </View>

                <Text style={s.label}>I am a... *</Text>
                <View style={s.roleRow}>
                  <TouchableOpacity
                    style={[s.roleCard, { borderColor: role === 'customer' ? NAVY : C.border, backgroundColor: role === 'customer' ? NAVY + '12' : 'transparent' }]}
                    onPress={() => setRole('customer')}>
                    <UserIcon size={24} color={role === 'customer' ? NAVY : C.textSecondary} />
                    <Text style={[s.roleTxt, { color: role === 'customer' ? NAVY : C.textSecondary }]}>Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.roleCard, { borderColor: role === 'artisan' ? NAVY : C.border, backgroundColor: role === 'artisan' ? NAVY + '12' : 'transparent' }]}
                    onPress={() => setRole('artisan')}>
                    <ToolIcon size={24} color={role === 'artisan' ? NAVY : C.textSecondary} />
                    <Text style={[s.roleTxt, { color: role === 'artisan' ? NAVY : C.textSecondary }]}>Artisan</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Email */}
            <Text style={s.label}>Email Address *</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                placeholder="your@email.com" placeholderTextColor={C.textMuted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            {/* Password */}
            <Text style={s.label}>Password *</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={C.textMuted} secureTextEntry={!showPw}
                autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOffIcon size={20} color={C.textSecondary} /> : <EyeIcon size={20} color={C.textSecondary} />}
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            {mode === 'login' && (
              <TouchableOpacity style={s.forgotBtn}
                onPress={() => router.push('/(auth)/forgot-password' as any)}>
                <Text style={s.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* T&C checkbox — only on signup */}
            {mode === 'signup' && (
              <TouchableOpacity style={s.tcRow} onPress={() => setAcceptedTc(v => !v)} activeOpacity={0.7}>
                <View style={[s.tcCheckbox, acceptedTc && { backgroundColor: NAVY, borderColor: NAVY }]}>
                  {acceptedTc && <CheckIcon size={14} color="#FFF" />}
                </View>
                <Text style={s.tcText}>
                  I have read and agree to the{' '}
                  <Text style={s.tcLink} onPress={() => router.push('/(auth)/terms' as any)}>
                    Terms & Conditions
                  </Text>
                  {' '}and{' '}
                  <Text style={s.tcLink} onPress={() => router.push('/(auth)/privacy' as any)}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[s.signInBtn, !isSignupReady && s.signInBtnDisabled]}
              onPress={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading || !isSignupReady}
              activeOpacity={0.8}>
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.signInTxt}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerTxt}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={s.footerLink}
                onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAcceptedTc(false) }}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </View>

          <View style={s.termsWrap}>
            <Text style={s.termsTxt}>
              By continuing you agree to our{' '}
              <Text style={s.termsLink} onPress={() => router.push('/(auth)/terms' as any)}>Terms</Text>
              {' & '}
              <Text style={s.termsLink} onPress={() => router.push('/(auth)/privacy' as any)}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}