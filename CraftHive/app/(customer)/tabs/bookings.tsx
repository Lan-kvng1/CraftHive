// app/(customer)/bookings.tsx — FINAL
// - Fixed "No all bookings" → proper empty message per tab
// - All SVG icons
// - Proper dark/light theming
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import { useLang } from '../../../src/context/LanguageContext'
import {
  FilterIcon, StarIcon, CheckCircleIcon,
  CalendarIcon, MapPinIcon, ClockIcon,
} from '../../../src/components/Icons'
import AudioFAB from '../../../src/components/AudioFAB'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const TABS = ['All', 'Upcoming', 'Active', 'Completed', 'Cancelled']

const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Upcoming: ['pending', 'confirmed'],
  Active: ['in_progress'],
  Completed: ['completed'],
  Cancelled: ['cancelled'],
}

const EMPTY_MSG: Record<string, string> = {
  All: 'No bookings yet',
  Upcoming: 'No upcoming bookings',
  Active: 'No active jobs right now',
  Completed: 'No completed bookings yet',
  Cancelled: 'No cancelled bookings',
}

export default function CustomerBookings() {
  const { user } = useAuth()
  const router = useRouter()
  const { C } = useAppTheme()
  const { t } = useLang()
  const [tab, setTab] = useState('All')
  const [bookings, setBookings] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    if (!user?.id) return
    // Step 1: fetch bookings with artisan_profiles (no nested profiles join
    // to avoid FK ambiguity — we enrich with profiles separately below)
    let q = supabase.from('bookings')
      .select('*, artisan_profiles:artisan_id(rating, trade_category, user_id)')
      .eq('customer_id', user.id)
      .order('scheduled_at', { ascending: false })
    if (STATUS_MAP[tab].length > 0) q = q.in('status', STATUS_MAP[tab])
    const { data, error } = await q
    if (error) { console.warn('Bookings load error:', error.message); setBookings([]); return }
    if (!data || data.length === 0) { setBookings([]); return }

    // Step 2: fetch the artisan profiles rows for name + avatar
    const artisanIds = [...new Set(data.map((b: any) => b.artisan_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', artisanIds)

    const profileMap: Record<string, any> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p })

    // Merge profiles into each booking's artisan_profiles object
    const enriched = data.map((b: any) => ({
      ...b,
      artisan_profiles: b.artisan_profiles
        ? { ...b.artisan_profiles, profiles: profileMap[b.artisan_id] || null }
        : null,
    }))
    setBookings(enriched)
  }

  useEffect(() => { load() }, [tab, user?.id])

  const statusColor = (s: string) => ({
    pending: '#F5A623', confirmed: '#3E92CC',
    in_progress: NAVY, completed: '#22C55E', cancelled: '#EF4444',
  }[s] || '#94A3B8')

  const statusLabel = (s: string) => ({
    pending: 'Pending', confirmed: 'Confirmed',
    in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  }[s] || s)

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: {
      backgroundColor: NAVY, paddingHorizontal: 20,
      paddingTop: 8, paddingBottom: 20,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerLeft: {},
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    filterBtn: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    tabBar: {
      backgroundColor: NAVY,
      paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4,
    },
    tabScroll: { flexDirection: 'row', gap: 8 },
    tabBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22 },
    tabTxt: { fontSize: 14, fontWeight: '700' },
    body: { flex: 1, backgroundColor: C.background },
    list: { paddingTop: 8, paddingBottom: 120 },
    card: {
      backgroundColor: C.card, marginHorizontal: 16, marginVertical: 5,
      borderRadius: 18, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    iconWrap: {
      width: 54, height: 54, borderRadius: 16,
      backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    artName: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
    artRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    artRatingTxt: { fontSize: 12, color: C.textSecondary },
    badge: {
      alignSelf: 'flex-start', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    badgeTxt: { fontSize: 12, fontWeight: '700' },
    cardMeta: {
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaTxt: { fontSize: 12, color: C.textSecondary },
    price: { fontSize: 14, fontWeight: '800', color: NAVY },
    // Empty state
    empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyIconWrap: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
    emptyTxt: { fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  })

  const EmptyState = () => (
    <View style={s.empty}>
      <View style={s.emptyIconWrap}>
        <CalendarIcon size={36} color={NAVY} />
      </View>
      <Text style={s.emptyTitle}>{EMPTY_MSG[tab]}</Text>
      <Text style={s.emptyTxt}>
        {tab === 'All'
          ? 'Book a skilled artisan to get started.'
          : `You have no ${tab.toLowerCase()} bookings at the moment.`}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>{t('bookings')}</Text>
          <Text style={s.headerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <FilterIcon size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={s.tabScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.tabBtn, { backgroundColor: tab === item ? '#FFF' : 'rgba(255,255,255,0.15)' }]}
              onPress={() => setTab(item)}>
              <Text style={[s.tabTxt, { color: tab === item ? NAVY : '#FFF' }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={bookings}
        style={s.body}
        keyExtractor={i => i.id}
        contentContainerStyle={[s.list, bookings.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item: b }) => {
          const artisan = b.artisan_profiles as any
          const name = artisan?.profiles?.full_name || 'Artisan'
          const avatar = artisan?.profiles?.avatar_url
          const sc = statusColor(b.status)
          return (
            <TouchableOpacity style={s.card} activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/(customer)/booking-detail' as any, params: { bookingId: b.id } })}>
              <View style={s.cardTop}>
                {avatar
                  ? <Image source={{ uri: avatar }} style={{ width: 54, height: 54, borderRadius: 16 }} />
                  : <View style={s.iconWrap}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: NAVY }}>{name[0]}</Text>
                  </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{b.title || b.service_type || 'Service Booking'}</Text>
                  <Text style={s.artName}>{name} · {artisan?.trade_category || 'Artisan'}</Text>
                  {artisan?.rating > 0 && (
                    <View style={s.artRow}>
                      <StarIcon size={12} color={GOLD} fill={GOLD} />
                      <Text style={s.artRatingTxt}>{artisan.rating?.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <View style={[s.badge, { backgroundColor: sc + '20' }]}>
                  <Text style={[s.badgeTxt, { color: sc }]}>{statusLabel(b.status)}</Text>
                </View>
              </View>
              <View style={s.cardMeta}>
                <View style={s.metaItem}>
                  <ClockIcon size={13} color={C.textSecondary} />
                  <Text style={s.metaTxt}>
                    {b.scheduled_at
                      ? new Date(b.scheduled_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Date TBC'}
                  </Text>
                </View>
                <View style={s.metaItem}>
                  <MapPinIcon size={13} color={C.textSecondary} />
                  <Text style={s.metaTxt} numberOfLines={1}>{b.address || 'No address'}</Text>
                </View>
                <Text style={s.price}>{b.price ? `₵${b.price}` : 'To quote'}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
      <AudioFAB pageText={`${t('bookings')}. ${bookings.length} ${tab.toLowerCase()} bookings.`} />
    </SafeAreaView>
  )
}