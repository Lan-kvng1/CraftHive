// app/(customer)/rate-app.tsx — FINAL
// Uses logo.png (or logo-dark.png if it exists) based on theme
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Linking, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, StarIcon, CheckCircleIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

const QUICK_TAGS = [
  'Easy to use', 'Fast bookings', 'Great artisans',
  'Good value', 'Reliable payments', 'Needs improvement',
]

export default function RateApp() {
  const router = useRouter()
  const { C, isDark } = useAppTheme()
  const { user } = useAuth()

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const submit = async () => {
    if (rating === 0) { Alert.alert('Required', 'Please select a star rating.'); return }
    setSaving(true)
    await supabase.from('notifications').insert({
      user_id: null,
      title: `App Rating: ${rating}/5 stars`,
      body: `Tags: ${tags.join(', ')}\n\n${comment}`.trim(),
      type: 'app_rating',
      read: false,
      data: { from_user: user?.id, rating, tags, comment },
    })
    setSaving(false)
    if (rating >= 4) {
      Alert.alert('Thank you! 🎉', 'Would you like to rate us on the Play Store?', [
        { text: 'Maybe Later', onPress: () => setDone(true) },
        {
          text: 'Rate Now', onPress: () => {
            Linking.openURL('market://details?id=com.crafthive.app').catch(() =>
              Linking.openURL('https://play.google.com/store/apps/details?id=com.crafthive.app')
            )
            setDone(true)
          }
        },
      ])
    } else {
      setDone(true)
    }
  }

  const displayRating = hovered || rating
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']

  // Use logo based on theme — fall back to same logo if dark version doesn't exist
  const logoSource = isDark
    ? require('../../assets/images/logo.png')   // swap to logo-dark.png if you have it
    : require('../../assets/images/logo.png')

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    card: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 24, padding: 28, alignItems: 'center' },
    logoWrap: { width: 90, height: 90, borderRadius: 26, backgroundColor: isDark ? '#1E293B' : '#F4F6FB', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: GOLD },
    logo: { width: 70, height: 70, resizeMode: 'contain' },
    appName: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
    subTxt: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
    starsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    ratingLbl: { fontSize: 16, fontWeight: '700', color: NAVY, height: 22, marginBottom: 20 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    tag: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
    tagTxt: { fontSize: 13, fontWeight: '600' },
    input: { width: '100%', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, textAlignVertical: 'top', height: 90, marginBottom: 20 },
    submitBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center' },
    submitTxt: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    // Done
    doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
    doneCard: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 24, padding: 36, alignItems: 'center' },
    doneIcon: { width: 90, height: 90, borderRadius: 28, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    doneTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 8 },
    doneSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    doneBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
    doneBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  })

  if (done) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={s.doneWrap}>
        <View style={s.doneCard}>
          <View style={s.doneIcon}><CheckCircleIcon size={48} color="#22C55E" /></View>
          <Text style={s.doneTitle}>Thank You!</Text>
          <Text style={s.doneSub}>Your feedback helps us improve CraftHive for everyone in Ghana.</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
            <Text style={s.doneBtnTxt}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rate CraftHive</Text>
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.logoWrap}>
            <Image source={logoSource} style={s.logo} />
          </View>
          <Text style={s.appName}>CraftHive</Text>
          <Text style={s.subTxt}>How would you rate your experience?</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n}
                onPress={() => setRating(n)}
                onPressIn={() => setHovered(n)}
                onPressOut={() => setHovered(0)}
                activeOpacity={0.8}>
                <StarIcon size={48} color={GOLD} fill={n <= displayRating ? GOLD : 'none'} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.ratingLbl}>{displayRating > 0 ? labels[displayRating] : 'Tap to rate'}</Text>
          <View style={s.tagsWrap}>
            {QUICK_TAGS.map(tag => {
              const sel = tags.includes(tag)
              return (
                <TouchableOpacity key={tag}
                  style={[s.tag, { borderColor: sel ? NAVY : C.border, backgroundColor: sel ? NAVY : 'transparent' }]}
                  onPress={() => toggleTag(tag)}>
                  <Text style={[s.tagTxt, { color: sel ? '#FFF' : C.text }]}>{tag}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <TextInput style={s.input} value={comment} onChangeText={setComment}
            placeholder="Any other feedback? (optional)" placeholderTextColor={C.textMuted} multiline />
          <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitTxt}>Submit Rating</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}