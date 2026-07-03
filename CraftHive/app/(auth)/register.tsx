// app/(auth)/register.tsx — FINAL with welcome email
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
import { ArrowLeftIcon, UserIcon, ToolIcon, EyeIcon, EyeOffIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GREEN = '#1B4332'
const GOLD = '#FFB800'

async function sendWelcomeEmail(email: string, name: string, role: string) {
  try {
    await supabase.functions.invoke('send-email', {
      body: { type: 'welcome', data: { email, name, role } },
    })
  } catch (e) {
    console.warn('Welcome email failed:', e)
  }
}

export default function RegisterScreen() {
  const router = useRouter()
  const { C } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'customer' | 'artisan'>('customer')
  const [showPw, setShowPw] = useState(false)
  const [showCo, setShowCo] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields'); return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters'); return
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match'); return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    if (error) { setLoading(false); Alert.alert('Sign Up Failed', error.message); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id, full_name: fullName.trim(),
        email: email.trim().toLowerCase(), role,
      })
      if (role === 'artisan') {
        await supabase.from('artisan_profiles').upsert({
          user_id: data.user.id, rating: 0,
          total_reviews: 0, total_jobs: 0,
          years_experience: 0, total_earnings: 0, status: 'pending',
        })
      }
      // Send welcome email
      await sendWelcomeEmail(email.trim().toLowerCase(), fullName.trim(), role)
    }

    setLoading(false)
    if (role === 'artisan') {
      router.replace('/(auth)/artisan-setup' as any)
    } else {
      Alert.alert(
        'Account Created!',
        `Welcome to CraftHive, ${fullName.trim().split(' ')[0]}! Check your email for a welcome message.`,
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login' as any) }]
      )
    }
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    scroll: { flexGrow: 1 },
    header: {
      backgroundColor: NAVY, paddingHorizontal: 16,
      paddingTop: 8, paddingBottom: 20,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    hero: { backgroundColor: NAVY, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
    logoCircle: {
      width: 64, height: 64, borderRadius: 18, backgroundColor: GOLD,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden',
    },
    logoImg: { width: 48, height: 48, resizeMode: 'contain' },
    appName: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    card: {
      backgroundColor: C.card, marginHorizontal: 16, marginTop: -16,
      borderRadius: 24, padding: 24, marginBottom: 32,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
    },
    cardTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 4 },
    cardSub: { fontSize: 14, color: C.textSecondary, marginBottom: 22, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 7 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    roleCard: {
      flex: 1, borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', gap: 8, borderWidth: 1.5,
    },
    roleTxt: { fontSize: 14, fontWeight: '700' },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.inputBg, borderRadius: 14,
      borderWidth: 1.5, borderColor: C.border,
      paddingHorizontal: 14, marginBottom: 16,
    },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.text },
    eyeBtn: { padding: 6 },
    primaryBtn: {
      backgroundColor: NAVY, borderRadius: 16, paddingVertical: 17, alignItems: 'center',
      shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    primaryTxt: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
    footerTxt: { fontSize: 14, color: C.textSecondary },
    footerLink: { color: NAVY, fontWeight: '700' },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ArrowLeftIcon size={18} color="#FFF" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Create Account</Text>
          </View>
          <View style={s.hero}>
            <View style={s.logoCircle}>
              <Image source={require('../../assets/images/logo.png')} style={s.logoImg} />
            </View>
            <Text style={s.appName}>CraftHive</Text>
            <Text style={s.tagline}>Join Ghana's artisan marketplace</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Create Account</Text>
            <Text style={s.cardSub}>Fill in your details to get started on CraftHive.</Text>

            <Text style={s.label}>I am a...</Text>
            <View style={s.roleRow}>
              {(['customer', 'artisan'] as const).map(r => (
                <TouchableOpacity key={r}
                  style={[s.roleCard, {
                    borderColor: role === r ? (r === 'customer' ? NAVY : GREEN) : C.border,
                    backgroundColor: role === r ? (r === 'customer' ? NAVY : GREEN) + '12' : 'transparent',
                  }]}
                  onPress={() => setRole(r)}>
                  {r === 'customer'
                    ? <UserIcon size={26} color={role === r ? NAVY : C.textSecondary} />
                    : <ToolIcon size={26} color={role === r ? GREEN : C.textSecondary} />
                  }
                  <Text style={[s.roleTxt, {
                    color: role === r ? (r === 'customer' ? NAVY : GREEN) : C.textSecondary,
                  }]}>{r === 'customer' ? 'Customer' : 'Artisan'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Full Name</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={fullName} onChangeText={setFullName}
                placeholder="Your full name" placeholderTextColor={C.textMuted} autoCapitalize="words" />
            </View>

            <Text style={s.label}>Email Address</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                placeholder="your@email.com" placeholderTextColor={C.textMuted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder="At least 6 characters" placeholderTextColor={C.textMuted}
                secureTextEntry={!showPw} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOffIcon size={20} color={C.textSecondary} /> : <EyeIcon size={20} color={C.textSecondary} />}
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Confirm Password</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
                placeholder="Re-enter your password" placeholderTextColor={C.textMuted}
                secureTextEntry={!showCo} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowCo(v => !v)}>
                {showCo ? <EyeOffIcon size={20} color={C.textSecondary} /> : <EyeIcon size={20} color={C.textSecondary} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryTxt}>Create Account</Text>}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerTxt}>Already have an account? </Text>
              <Text style={s.footerLink} onPress={() => router.replace('/(auth)/login' as any)}>Sign In</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}