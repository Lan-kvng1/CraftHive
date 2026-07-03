// app/(auth)/reset-password.tsx — FINAL
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, ShieldIcon, EyeIcon, EyeOffIcon, CheckCircleIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'

export default function ResetPassword() {
  const router = useRouter()
  const { C } = useAppTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCo, setShowCo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!password.trim()) { Alert.alert('Required', 'Please enter a new password.'); return }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    setDone(true)
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#EF4444', '#F5A623', '#22C55E'][strength]

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
    title: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 26 },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.inputBg, borderRadius: 14,
      borderWidth: 1.5, borderColor: C.border,
      paddingHorizontal: 14, marginBottom: 8,
    },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.text },
    eyeBtn: { padding: 6 },
    strengthBar: { height: 4, borderRadius: 2, marginBottom: 16, overflow: 'hidden', backgroundColor: C.border },
    strengthFill: { height: 4, borderRadius: 2 },
    strengthTxt: { fontSize: 12, marginBottom: 16 },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    matchTxt: { fontSize: 12 },
    primaryBtn: {
      backgroundColor: NAVY, borderRadius: 16, paddingVertical: 17,
      alignItems: 'center',
    },
    primaryTxt: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    // Success
    successIconWrap: {
      width: 80, height: 80, borderRadius: 28,
      backgroundColor: '#DCFCE7', alignItems: 'center',
      justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
    },
    successTitle: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 10 },
    successSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Password</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.body} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            {!done ? (
              <>
                <View style={s.iconWrap}><ShieldIcon size={34} color={NAVY} /></View>
                <Text style={s.title}>Set New Password</Text>
                <Text style={s.subtitle}>Your new password must be at least 6 characters.</Text>

                <Text style={s.label}>New Password</Text>
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={password} onChangeText={setPassword}
                    placeholder="New password" placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPw} autoCapitalize="none" />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOffIcon size={20} color={C.textSecondary} /> : <EyeIcon size={20} color={C.textSecondary} />}
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <>
                    <View style={s.strengthBar}>
                      <View style={[s.strengthFill, { width: `${(strength / 3) * 100}%` as any, backgroundColor: strengthColor }]} />
                    </View>
                    <Text style={[s.strengthTxt, { color: strengthColor }]}>{strengthLabel} password</Text>
                  </>
                )}

                <Text style={s.label}>Confirm Password</Text>
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
                    placeholder="Re-enter password" placeholderTextColor={C.textMuted}
                    secureTextEntry={!showCo} autoCapitalize="none" />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowCo(v => !v)}>
                    {showCo ? <EyeOffIcon size={20} color={C.textSecondary} /> : <EyeIcon size={20} color={C.textSecondary} />}
                  </TouchableOpacity>
                </View>
                {confirm.length > 0 && (
                  <View style={s.matchRow}>
                    <CheckCircleIcon size={14} color={password === confirm ? '#22C55E' : '#EF4444'} />
                    <Text style={[s.matchTxt, { color: password === confirm ? '#22C55E' : '#EF4444' }]}>
                      {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={s.primaryBtn} onPress={submit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryTxt}>Update Password</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.successIconWrap}><CheckCircleIcon size={40} color="#22C55E" /></View>
                <Text style={s.successTitle}>Password Updated!</Text>
                <Text style={s.successSub}>Your password has been changed successfully. You can now sign in with your new password.</Text>
                <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/(auth)/login' as any)}>
                  <Text style={s.primaryTxt}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}