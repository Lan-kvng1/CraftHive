// app/(auth)/forgot-password.tsx — FINAL
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, MailIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'

export default function ForgotPassword() {
  const router = useRouter()
  const { C } = useAppTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Please enter your email address.'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    setSent(true)
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: {
      backgroundColor: NAVY, paddingHorizontal: 16,
      paddingTop: 8, paddingBottom: 24,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    card: {
      backgroundColor: C.card, marginHorizontal: 16, marginTop: 24,
      borderRadius: 24, padding: 28,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08, shadowRadius: 18, elevation: 6,
    },
    iconWrap: {
      width: 72, height: 72, borderRadius: 24,
      backgroundColor: NAVY + '12', alignItems: 'center',
      justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
    },
    title: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.inputBg, borderRadius: 14,
      borderWidth: 1.5, borderColor: C.border,
      paddingHorizontal: 14, marginBottom: 20,
    },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.text, marginLeft: 8 },
    primaryBtn: {
      backgroundColor: NAVY, borderRadius: 16, paddingVertical: 17,
      alignItems: 'center',
    },
    primaryTxt: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    backLink: { alignItems: 'center', marginTop: 20 },
    backTxt: { fontSize: 14, color: C.textSecondary },
    backLinkTxt: { color: NAVY, fontWeight: '700' },
    // Success state
    successIconWrap: {
      width: 80, height: 80, borderRadius: 28,
      backgroundColor: '#DCFCE7', alignItems: 'center',
      justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
    },
    successIcon: { fontSize: 40 },
    successTitle: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 10 },
    successSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    emailBadge: {
      backgroundColor: C.surface, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      alignSelf: 'center', marginBottom: 28,
      borderWidth: 1, borderColor: C.border,
    },
    emailBadgeTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reset Password</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.body} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            {!sent ? (
              <>
                <View style={s.iconWrap}><MailIcon size={34} color={NAVY} /></View>
                <Text style={s.title}>Forgot Password?</Text>
                <Text style={s.subtitle}>
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </Text>
                <Text style={s.label}>Email Address</Text>
                <View style={s.inputRow}>
                  <MailIcon size={18} color={C.textMuted} />
                  <TextInput
                    style={s.input} value={email} onChangeText={setEmail}
                    placeholder="your@email.com" placeholderTextColor={C.textMuted}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={s.primaryBtn} onPress={submit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryTxt}>Send Reset Link</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
                  <Text style={s.backTxt}>Remembered it? <Text style={s.backLinkTxt}>Sign In</Text></Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.successIconWrap}><Text style={s.successIcon}>✉️</Text></View>
                <Text style={s.successTitle}>Check Your Email</Text>
                <Text style={s.successSub}>We've sent a password reset link to:</Text>
                <View style={s.emailBadge}><Text style={s.emailBadgeTxt}>{email}</Text></View>
                <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                  Didn't receive it? Check your spam folder or try again in a few minutes.
                </Text>
                <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/(auth)/login' as any)}>
                  <Text style={s.primaryTxt}>Back to Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.backLink} onPress={() => setSent(false)}>
                  <Text style={s.backLinkTxt}>Try a different email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}