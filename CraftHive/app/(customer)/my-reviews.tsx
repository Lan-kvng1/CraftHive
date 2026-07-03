// app/(customer)/my-reviews.tsx — FINAL
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, StarIcon } from '../../src/components/Icons'
import Avatar from '../../src/components/Avatar'

const NAVY = '#0B1F4D'
const GOLD = '#FFB800'

export default function MyReviews() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    if (!user) return
    
    // Step 1: Fetch reviews created by the customer
    const { data: rvRows, error } = await supabase
      .from('reviews')
      .select('*, bookings(title, service_type)')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Reviews fetch error:', error.message)
      setReviews([])
      setLoading(false)
      return
    }

    if (!rvRows || rvRows.length === 0) {
      setReviews([])
      setLoading(false)
      return
    }

    // Step 2: Get unique artisan IDs to fetch their profiles
    const artisanIds = [...new Set(rvRows.map(r => r.artisan_id).filter(Boolean))]

    // Step 3: Fetch artisan profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', artisanIds)

    const profileMap: Record<string, any> = {}
    profiles?.forEach(p => {
      profileMap[p.id] = p
    })

    // Merge profiles and bookings data
    const enriched = rvRows.map(r => ({
      ...r,
      artisan: profileMap[r.artisan_id] || null,
      bookingInfo: r.bookings || null,
    }))

    setReviews(enriched)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    artisanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    info: { flex: 1 },
    nameTxt: { fontSize: 15, fontWeight: '800', color: C.text },
    dateTxt: { fontSize: 11, color: C.textMuted, marginTop: 2 },
    starsRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
    commentTxt: { fontSize: 13, color: C.textSecondary, lineHeight: 18, fontStyle: 'italic' },
    bookingTxt: { fontSize: 12, fontWeight: '600', color: NAVY, marginTop: 8 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12, textAlign: 'center' },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Reviews</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      ) : (
        <FlatList
          style={s.body}
          data={reviews}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <StarIcon size={48} color={C.textMuted} />
              <Text style={s.emptyTxt}>You haven't written any reviews yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const artisanName = item.artisan?.full_name || 'Artisan'
            const bookingTitle = item.bookingInfo?.title || item.bookingInfo?.service_type || 'Service Booking'
            const formattedDate = new Date(item.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })
            
            return (
              <View style={s.card}>
                <View style={s.artisanRow}>
                  <Avatar uri={item.artisan?.avatar_url} name={artisanName} size={40} radius={12} />
                  <View style={s.info}>
                    <Text style={s.nameTxt}>{artisanName}</Text>
                    <Text style={s.dateTxt}>{formattedDate}</Text>
                  </View>
                  <View style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <StarIcon key={n} size={14} color={GOLD} fill={n <= item.rating ? GOLD : 'none'} />
                    ))}
                  </View>
                </View>
                {item.comment ? (
                  <Text style={s.commentTxt}>"{item.comment}"</Text>
                ) : null}
                <Text style={s.bookingTxt}>💼 {bookingTitle}</Text>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
