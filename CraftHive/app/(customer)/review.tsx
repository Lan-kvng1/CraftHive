// app/(customer)/review.tsx — FINAL
// Write review after completed booking → updates artisan avg rating
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { notifyNewReview } from '../../src/utils/sendNotification'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import Avatar from '../../src/components/Avatar'
import { ArrowLeftIcon, StarIcon, CheckCircleIcon, ToolIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const TAGS = [
  'Professional', 'On time', 'Great quality',
  'Clean work', 'Good value', 'Would hire again',
  'Friendly', 'Fast worker',
]

export default function CustomerReview() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [booking, setBooking] = useState<any>(null)
  const [artisan, setArtisan] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [selTags, setSelTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: b } = await supabase
        .from('bookings').select('*').eq('id', bookingId).single()
      setBooking(b)
      if (b?.artisan_id) {
        const { data: ap } = await supabase
          .from('artisan_profiles').select('*').eq('user_id', b.artisan_id).single()
        const { data: p } = await supabase
          .from('profiles').select('id,full_name,avatar_url').eq('id', b.artisan_id).single()
        setArtisan(ap)
        setProfile(p)
      }

      // Check if already reviewed
      const { data: existing } = await supabase
        .from('reviews').select('id').eq('booking_id', bookingId).eq('reviewer_id', user?.id).single()
      if (existing) setDone(true)
      setLoading(false)
    }
    load()
  }, [bookingId])

  const toggleTag = (t: string) =>
    setSelTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const submit = async () => {
    if (rating === 0) { Alert.alert('Required', 'Please select a star rating.'); return }
    setSaving(true)

    // Insert review
    await supabase.from('reviews').insert({
      booking_id: bookingId,
      artisan_id: booking.artisan_id,
      reviewer_id: user?.id,
      rating,
      comment: comment.trim() || null,
    })

    // Recalculate artisan avg rating
    const { data: allReviews } = await supabase
      .from('reviews').select('rating').eq('artisan_id', booking.artisan_id)
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await supabase.from('artisan_profiles').update({
        rating: parseFloat(avg.toFixed(1)),
        total_reviews: allReviews.length,
      }).eq('user_id', booking.artisan_id)
    }

    setSaving(false)
    setDone(true)
  }

  const displayRating = hovered || rating
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']
  const artisanName = profile?.full_name || 'Artisan'
  const trade = (artisan?.trade_category || '').replace(/&#[0-9]+;/g, '').trim()

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    </SafeAreaView>
  )

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    artisanCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatarImg: { width: 60, height: 60, borderRadius: 18, borderWidth: 2, borderColor: GOLD },
    avatarFall: { width: 60, height: 60, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD },
    avatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 22 },
    artName: { fontSize: 16, fontWeight: '800', color: C.text },
    artTrade: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    bookingRef: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    ratingCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 22, alignItems: 'center' },
    ratingTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 4 },
    ratingSub: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
    starsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    ratingLabel: { fontSize: 16, fontWeight: '700', color: NAVY, height: 22 },
    tagsCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16 },
    tagsTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
    tagTxt: { fontSize: 13, fontWeight: '600' },
    commentCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, marginBottom: 16 },
    commentTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10 },
    input: { backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, textAlignVertical: 'top', height: 100 },
    submitBtn: { backgroundColor: NAVY, marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
    submitTxt: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    doneIcon: { width: 96, height: 96, borderRadius: 30, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    doneTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 8 },
    doneSub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    doneBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
    doneBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  })

  if (done) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <StatusBar style="dark" />
      <View style={s.doneWrap}>
        <View style={s.doneIcon}>
          <CheckCircleIcon size={52} color="#16A34A" />
        </View>
        <Text style={s.doneTitle}>Review Submitted!</Text>
        <Text style={s.doneSub}>
          Thank you for reviewing {artisanName}. Your feedback helps other customers make better decisions.
        </Text>
        <TouchableOpacity style={s.doneBtn} onPress={() => router.push('/(customer)/tabs/home' as any)}>
          <Text style={s.doneBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
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
        <Text style={s.headerTitle}>Rate Your Experience</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          {/* Artisan info */}
          <View style={s.artisanCard}>
            <Avatar uri={profile?.avatar_url} name={artisanName} size={60} radius={18} borderWidth={2} borderColor={GOLD} />
            <View style={{ flex: 1 }}>
              <Text style={s.artName}>{artisanName}</Text>
              <Text style={s.artTrade}>{trade}</Text>
              <Text style={s.bookingRef}>{booking?.title || booking?.service_type}</Text>
            </View>
          </View>

          {/* Star rating */}
          <View style={s.ratingCard}>
            <Text style={s.ratingTitle}>How was the service?</Text>
            <Text style={s.ratingSub}>Be honest — your review helps everyone.</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n}
                  onPress={() => setRating(n)}
                  onPressIn={() => setHovered(n)}
                  onPressOut={() => setHovered(0)}
                  activeOpacity={0.8}>
                  <StarIcon size={52} color={GOLD} fill={n <= displayRating ? GOLD : 'none'} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.ratingLabel}>{displayRating > 0 ? labels[displayRating] : 'Tap to rate'}</Text>
          </View>

          {/* Quick tags */}
          <View style={s.tagsCard}>
            <Text style={s.tagsTitle}>What stood out? (optional)</Text>
            <View style={s.tagsWrap}>
              {TAGS.map(tag => {
                const sel = selTags.includes(tag)
                return (
                  <TouchableOpacity key={tag}
                    style={[s.tag, { borderColor: sel ? NAVY : C.border, backgroundColor: sel ? NAVY : 'transparent' }]}
                    onPress={() => toggleTag(tag)}>
                    <Text style={[s.tagTxt, { color: sel ? '#FFF' : C.text }]}>{tag}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Comment */}
          <View style={s.commentCard}>
            <Text style={s.commentTitle}>Write a review (optional)</Text>
            <TextInput
              style={s.input}
              value={comment}
              onChangeText={setComment}
              placeholder="Describe your experience with this artisan..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
            <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 }}>
              {comment.length}/500
            </Text>
          </View>

          <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitTxt}>Submit Review</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AudioFAB pageText={`Rate your experience with ${artisanName}. Select a star rating and optionally add a comment.`} />
    </SafeAreaView>
  )
}