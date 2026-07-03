// app/(customer)/home.tsx — FINAL
// Filter button works, See all categories works
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, RefreshControl, FlatList, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import { useNotifications } from '../../../src/context/NotificationContext'
import { useLang } from '../../../src/context/LanguageContext'
import AudioFAB from '../../../src/components/AudioFAB'
import Avatar from '../../../src/components/Avatar'
import ReadAloud from '../../../src/components/ReadAloud'
import SmartImage from '../../../src/components/SmartImage'
import {
  SearchIcon, BellIcon, StarIcon, MapPinIcon,
  CheckCircleIcon, TagIcon, ChevronRightIcon,
  FilterIcon, ToolIcon, XIcon,
} from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

// Category labels are translation keys, not display text —
// the icon stays the same everywhere, only the label is translated.
const ALL_CATEGORIES = [
  { key: 'electrician', label: 'Electrician', icon: '⚡' },
  { key: 'plumber', label: 'Plumber', icon: '🔧' },
  { key: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { key: 'painter', label: 'Painter', icon: '🎨' },
  { key: 'cleaner', label: 'Cleaner', icon: '🧹' },
  { key: 'mason', label: 'Mason', icon: '🧱' },
  { key: 'welder', label: 'Welder', icon: '⚙️' },
  { key: 'acTech', label: 'AC Technician', icon: '❄️' },
  { key: 'tiler', label: 'Tiler', icon: '🏗️' },
  { key: 'roofer', label: 'Roofer', icon: '🏠' },
  { key: 'locksmith', label: 'Locksmith', icon: '🔑' },
  { key: 'landscaper', label: 'Landscaper', icon: '🌿' },
  { key: 'mechanic', label: 'Mechanic', icon: '🚗' },
  { key: 'tailor', label: 'Tailor', icon: '✂️' },
  { key: 'other', label: 'Other', icon: '🔨' },
]

const RATINGS = ['Any', '4.5+', '4.0+', '3.5+']
const SORT_OPT = [
  { key: 'home.highestRated', label: 'Highest Rated' },
  { key: 'home.mostJobs', label: 'Most Jobs' },
  { key: 'home.nearest', label: 'Nearest' },
]

export default function CustomerHome() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile } = useAuth()
  const { unreadCount } = useNotifications()
  const { t } = useLang()

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [artisans, setArtisans] = useState<any[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const [nearby, setNearby] = useState<any[]>([])
  const [coupon, setCoupon] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filter modal state
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterRating, setFilterRating] = useState(t('home.any'))
  const [filterSort, setFilterSort] = useState(t('home.highestRated'))
  const [pendingCat, setPendingCat] = useState('')

  // All categories modal
  const [allCatsVisible, setAllCatsVisible] = useState(false)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('home.goodMorning')
    if (h < 17) return t('home.goodAfternoon')
    return t('home.goodEvening')
  }

  const load = useCallback(async () => {
    if (!user) return

    // Step 1: Get approved artisan profiles
    let q = supabase
      .from('artisan_profiles')
      .select('*')
      .eq('status', 'approved')

    if (catFilter) {
      if (catFilter === 'Other') {
        const standardCats = ALL_CATEGORIES.filter(c => c.label !== 'Other').map(c => c.label)
        q = q.not('trade_category', 'in', `(${standardCats.map(c => `"${c}"`).join(',')})`)
      } else {
        q = q.ilike('trade_category', `%${catFilter}%`)
      }
    }
    if (search) q = q.ilike('trade_category', `%${search}%`)
    if (filterRating !== t('home.any')) q = q.gte('rating', parseFloat(filterRating))
    if (filterSort === t('home.mostJobs')) q = q.order('total_jobs', { ascending: false })
    else q = q.order('rating', { ascending: false })
    q = q.limit(10)

    const { data: artisanData } = await q

    if (artisanData && artisanData.length > 0) {
      // Step 2: Get their profiles separately to avoid join RLS issues
      const userIds = artisanData.map((a: any) => a.user_id)
      const { data: profileData } = await supabase
        .from('profiles').select('id, full_name, avatar_url').in('id', userIds)
      setArtisans(artisanData.map((a: any) => ({
        ...a,
        profiles: profileData?.find((p: any) => p.id === a.user_id) || null,
      })))
    } else {
      setArtisans([])
    }

    // Nearby artisans
    const { data: nearData } = await supabase
      .from('artisan_profiles').select('*').eq('status', 'approved')
      .order('total_jobs', { ascending: false }).limit(6)

    if (nearData && nearData.length > 0) {
      const nearIds = nearData.map((a: any) => a.user_id)
      const { data: nearProfiles } = await supabase
        .from('profiles').select('id, full_name, avatar_url').in('id', nearIds)
      setNearby(nearData.map((a: any) => ({
        ...a,
        profiles: nearProfiles?.find((p: any) => p.id === a.user_id) || null,
      })))
    } else {
      setNearby([])
    }

    // Recent bookings — two queries to avoid FK ambiguity on artisan_profiles
    const { data: bks } = await supabase
      .from('bookings')
      .select('*, artisan_profiles:artisan_id(trade_category, rating, user_id)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }).limit(3)

    if (bks && bks.length > 0) {
      const artisanIds = [...new Set(bks.map((b: any) => b.artisan_id).filter(Boolean))]
      const { data: recentProfiles } = await supabase
        .from('profiles').select('id, full_name, avatar_url').in('id', artisanIds)
      const profileMap: Record<string, any> = {}
      recentProfiles?.forEach((p: any) => { profileMap[p.id] = p })
      setRecent(bks.map((b: any) => ({
        ...b,
        artisan_profiles: b.artisan_profiles
          ? { ...b.artisan_profiles, profiles: profileMap[b.artisan_id] || null }
          : null,
      })))
    } else {
      setRecent([])
    }

    // Coupon
    const { data: promo } = await supabase
      .from('promos').select('*').eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .limit(1).maybeSingle()
    setCoupon(promo)

  }, [user, catFilter, search, filterRating, filterSort])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const applyFilter = () => {
    setCatFilter(pendingCat)
    setFilterVisible(false)
  }

  const clearFilter = () => {
    setCatFilter('')
    setFilterRating(t('home.any'))
    setFilterSort(t('home.highestRated'))
    setPendingCat('')
    setFilterVisible(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const initials = (n: string) => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const statusColor = (s: string) => ({
    pending: '#F5A623', confirmed: NAVY,
    in_progress: NAVY, completed: '#22C55E', cancelled: '#EF4444',
  }[s] || '#94A3B8')

  const hasActiveFilter = catFilter || filterRating !== t('home.any') || filterSort !== t('home.highestRated')

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    avatarImg: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: GOLD },
    avatarFall: { width: 52, height: 52, borderRadius: 16, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    avatarTxt: { color: NAVY, fontWeight: '900', fontSize: 18 },
    greetCol: { flex: 1, paddingLeft: 14 },
    greetTxt: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    nameTxt: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    subTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 18 },
    bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    bellBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: NAVY },
    bellBadgeTxt: { color: '#1A202C', fontSize: 9, fontWeight: '900' },
    searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    searchInput: { flex: 1, fontSize: 14, color: '#FFF' },
    filterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
    filterDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: GOLD },
    body: { flex: 1, backgroundColor: NAVY },  // navy so the gap between header and white content isn't visible
    bodyTop: { height: 12 },
    promoBanner: { backgroundColor: GOLD, marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
    promoBannerTitle: { fontSize: 17, fontWeight: '900', color: '#1A202C', marginBottom: 3 },
    promoBannerSub: { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 18 },
    bookNowBtn: { backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 10, alignSelf: 'flex-start' },
    bookNowTxt: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    couponStrip: { backgroundColor: NAVY, marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: GOLD + '40' },
    couponCode: { fontSize: 15, fontWeight: '900', color: GOLD, letterSpacing: 1.5 },
    couponDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: C.text },
    seeAllTxt: { fontSize: 13, color: NAVY, fontWeight: '700' },
    catChip: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, marginHorizontal: 5, borderRadius: 16, minWidth: 90, borderWidth: 1.5 },
    catEmoji: { fontSize: 26, marginBottom: 6 },
    catLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
    artCard: { width: 160, backgroundColor: C.card, marginHorizontal: 6, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    artCardImg: { width: '100%', height: 110, backgroundColor: NAVY + '15' },
    artCardImgFall: { width: '100%', height: 110, backgroundColor: NAVY + '15', alignItems: 'center', justifyContent: 'center' },
    artCardBody: { padding: 12 },
    artCardName: { fontSize: 14, fontWeight: '800', color: C.text },
    artCardTrade: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    artCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    artCardMetaTxt: { fontSize: 11, color: C.textSecondary },
    artCardBookBtn: { backgroundColor: NAVY, borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginTop: 8 },
    artCardBookTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    recentCard: { backgroundColor: C.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    recentImgFall: { width: 54, height: 54, borderRadius: 14, backgroundColor: NAVY + '15', alignItems: 'center', justifyContent: 'center' },
    recentTitle: { fontSize: 14, fontWeight: '800', color: C.text },
    recentSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    recentBadge: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, marginTop: 5, alignSelf: 'flex-start' },
    recentBadgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    emptyWrap: { alignItems: 'center', paddingVertical: 28 },
    emptyTxt: { fontSize: 14, color: C.textSecondary, marginTop: 8 },
    // Filter modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    filterModal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
    filterTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    filterCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    filterSectionLbl: { fontSize: 13, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 16 },
    filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5 },
    filterChipTxt: { fontSize: 14, fontWeight: '600' },
    filterBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    clearBtn: { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    clearBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
    applyBtn: { flex: 2, borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: NAVY },
    applyBtnTxt: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    // All categories modal
    allCatsModal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' },
    allCatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    allCatItem: { width: '30%', alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5 },
    allCatEmoji: { fontSize: 28, marginBottom: 6 },
    allCatLbl: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  })

  const ArtisanCard = ({ item }: { item: any }) => {
    const name = (item.profiles as any)?.full_name || 'Artisan'
    const avatar = (item.profiles as any)?.avatar_url
    const cardSpeech = `${name}, ${item.trade_category}, rated ${item.rating?.toFixed(1) || '0.0'} stars, located in ${item.location || 'Accra'}`
    return (
      <ReadAloud text={cardSpeech}>
        <TouchableOpacity style={s.artCard}
          onPress={() => router.push({ pathname: '/(customer)/artisan-detail' as any, params: { artisanId: item.user_id } })}>
          {avatar
            ? <SmartImage source={{ uri: avatar }} style={s.artCardImg} fallbackIcon={<ToolIcon size={32} color={NAVY} />} />
            : <View style={s.artCardImgFall}><ToolIcon size={32} color={NAVY} /></View>
          }
          <View style={s.artCardBody}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.artCardName} numberOfLines={1}>{name}</Text>
              <CheckCircleIcon size={12} color={NAVY} />
            </View>
            <Text style={s.artCardTrade} numberOfLines={1}>{item.trade_category}</Text>
            <View style={s.artCardMeta}>
              <StarIcon size={12} color={GOLD} fill={GOLD} />
              <Text style={s.artCardMetaTxt}>{item.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={s.artCardMetaTxt}>·</Text>
              <MapPinIcon size={11} color={C.textSecondary} />
              <Text style={s.artCardMetaTxt} numberOfLines={1}>{item.location || 'Accra'}</Text>
            </View>
            <TouchableOpacity style={s.artCardBookBtn}
              onPress={() => router.push({ pathname: '/(customer)/book-artisan' as any, params: { artisanId: item.user_id } })}>
              <Text style={s.artCardBookTxt}>{t('common.bookNow')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ReadAloud>
    )
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.push('/(customer)/tabs/profile' as any)}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name || 'U'}
              size={52}
              radius={16}
              fallbackBg={GOLD}
              fallbackTextColor={NAVY}
              borderWidth={2}
              borderColor={GOLD}
            />
          </TouchableOpacity>
          <View style={s.greetCol}>
            <Text style={s.greetTxt}>{greeting()},</Text>
            <Text style={s.nameTxt}>{firstName} 👋</Text>
            <Text style={s.subTxt}>{t('home.subtitle')}</Text>
          </View>
          <TouchableOpacity style={s.bellBtn}
            onPress={() => router.push('/(customer)/notifications' as any)}>
            <BellIcon size={20} color="#FFF" />
            {unreadCount > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={s.searchRow}>
          <View style={s.searchWrap}>
            <SearchIcon size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t('home.search')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              returnKeyType="search"
              onSubmitEditing={() => load()}
            />
          </View>
          {/* Filter button — opens modal */}
          <TouchableOpacity style={s.filterBtn}
            onPress={() => { setPendingCat(catFilter); setFilterVisible(true) }}>
            <FilterIcon size={18} color="#1A202C" />
            {hasActiveFilter && <View style={s.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
      >
        <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: C.background, overflow: 'hidden' }}>
          {/* Gold promo banner */}
          <View style={s.promoBanner}>
            <View style={{ flex: 1 }}>
              <Text style={s.promoBannerTitle}>{t('home.findArtisan')}</Text>
              <Text style={s.promoBannerSub}>{t('home.trustedPros')}</Text>
              <TouchableOpacity style={s.bookNowBtn}
                onPress={() => router.push('/(customer)/tabs/bookings' as any)}>
                <Text style={s.bookNowTxt}>{t('common.bookNow')}</Text>
              </TouchableOpacity>
            </View>
            <ToolIcon size={60} color={NAVY} />
          </View>

          {/* Coupon strip */}
          {coupon && (
            <View style={s.couponStrip}>
              <TagIcon size={22} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={s.couponCode}>{coupon.code}</Text>
                <Text style={s.couponDesc}>{coupon.description || t('home.discountNext')}</Text>
              </View>
              <ChevronRightIcon size={16} color="rgba(255,255,255,0.4)" />
            </View>
          )}

          {/* Popular Categories */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>{t('home.categories')}</Text>
            {/* See All — opens all categories modal */}
            <TouchableOpacity onPress={() => setAllCatsVisible(true)}>
              <Text style={s.seeAllTxt}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ALL_CATEGORIES.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.label}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
            renderItem={({ item }) => {
              const active = catFilter === item.label
              return (
                <TouchableOpacity
                  style={[s.catChip, { borderColor: active ? NAVY : C.border, backgroundColor: active ? NAVY : C.card }]}
                  onPress={() => setCatFilter(active ? '' : item.label)}>
                  <Text style={s.catEmoji}>{item.icon}</Text>
                  <Text style={[s.catLabel, { color: active ? '#FFF' : C.text }]}>{t('cat.' + item.key)}</Text>
                </TouchableOpacity>
              )
            }}
          />

          {/* Recommended Artisans */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>
              {catFilter ? t('cat.' + (ALL_CATEGORIES.find(c => c.label === catFilter)?.key || 'other')) + 's' : t('home.recommended')}
            </Text>
            {catFilter && (
              <TouchableOpacity onPress={() => setCatFilter('')}>
                <Text style={[s.seeAllTxt, { color: '#EF4444' }]}>{t('common.clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {artisans.length === 0 ? (
            <View style={s.emptyWrap}>
              <ToolIcon size={40} color={C.textMuted} />
              <Text style={s.emptyTxt}>{catFilter ? t('home.noArtisansFor', { category: catFilter }) : t('home.noArtisans')}</Text>
            </View>
          ) : (
            <FlatList
              data={artisans}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.user_id}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
              renderItem={({ item }) => <ArtisanCard item={item} />}
            />
          )}

          {/* Recently Booked */}
          {recent.length > 0 && <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>{t('home.recentlyBooked')}</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/tabs/bookings' as any)}>
                <Text style={s.seeAllTxt}>{t('common.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {recent.map(b => {
              const ap = b.artisan_profiles as any
              const name = ap?.profiles?.full_name || 'Artisan'
              const sc = statusColor(b.status)
              return (
                <ReadAloud key={b.id} text={`${b.title || b.service_type}, ${name}, ${ap?.trade_category}, status ${b.status.replace('_', ' ')}`}>
                  <TouchableOpacity style={s.recentCard}
                    onPress={() => router.push({ pathname: '/(customer)/booking-detail' as any, params: { bookingId: b.id } })}>
                    <View style={s.recentImgFall}>
                      {ap?.profiles?.avatar_url
                        ? <SmartImage source={{ uri: ap.profiles.avatar_url }} style={{ width: 54, height: 54, borderRadius: 14 }} fallbackIcon={<ToolIcon size={26} color={NAVY} />} />
                        : <ToolIcon size={26} color={NAVY} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.recentTitle} numberOfLines={1}>{b.title || b.service_type}</Text>
                      <Text style={s.recentSub}>{name} · {ap?.trade_category}</Text>
                      <View style={[s.recentBadge, { backgroundColor: sc + '20' }]}>
                        <Text style={[s.recentBadgeTxt, { color: sc }]}>{b.status.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <ChevronRightIcon size={18} color={C.textMuted} />
                  </TouchableOpacity>
                </ReadAloud>
              )
            })}
          </>}

          {/* Artisans Near You */}
          {nearby.length > 0 && <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>{t('home.nearYou')}</Text>
              <TouchableOpacity><Text style={s.seeAllTxt}>{t('common.seeAll')}</Text></TouchableOpacity>
            </View>
            <FlatList
              data={nearby}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.user_id + '_near'}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
              renderItem={({ item }) => <ArtisanCard item={item} />}
            />
          </>}

        </View>{/* rounded white container */}
      </ScrollView>

      {/* ── FILTER MODAL ─────────────────────────────────────── */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.filterModal}>
            <View style={s.filterHeader}>
              <Text style={s.filterTitle}>{t('home.filterArtisans')}</Text>
              <TouchableOpacity style={s.filterCloseBtn} onPress={() => setFilterVisible(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={s.filterSectionLbl}>{t('home.category')}</Text>
            <View style={s.filterChipsRow}>
              <TouchableOpacity
                style={[s.filterChip, { borderColor: !pendingCat ? NAVY : C.border, backgroundColor: !pendingCat ? NAVY : 'transparent' }]}
                onPress={() => setPendingCat('')}>
                <Text style={[s.filterChipTxt, { color: !pendingCat ? '#FFF' : C.text }]}>{t('home.any')}</Text>
              </TouchableOpacity>
              {ALL_CATEGORIES.slice(0, 8).map(cat => (
                <TouchableOpacity key={cat.label}
                  style={[s.filterChip, { borderColor: pendingCat === cat.label ? NAVY : C.border, backgroundColor: pendingCat === cat.label ? NAVY : 'transparent' }]}
                  onPress={() => setPendingCat(cat.label)}>
                  <Text style={[s.filterChipTxt, { color: pendingCat === cat.label ? '#FFF' : C.text }]}>
                    {cat.icon} {t('cat.' + cat.key)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Min Rating */}
            <Text style={s.filterSectionLbl}>{t('home.minRating')}</Text>
            <View style={s.filterChipsRow}>
              {RATINGS.map(r => (
                <TouchableOpacity key={r}
                  style={[s.filterChip, { borderColor: filterRating === r ? NAVY : C.border, backgroundColor: filterRating === r ? NAVY : 'transparent' }]}
                  onPress={() => setFilterRating(r)}>
                  <Text style={[s.filterChipTxt, { color: filterRating === r ? '#FFF' : C.text }]}>
                    {r === t('home.any') ? t('home.any') : `⭐ ${r}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort by */}
            <Text style={s.filterSectionLbl}>{t('home.sortBy')}</Text>
            <View style={s.filterChipsRow}>
              {SORT_OPT.map(opt => (
                <TouchableOpacity key={opt.label}
                  style={[s.filterChip, { borderColor: filterSort === opt.label ? NAVY : C.border, backgroundColor: filterSort === opt.label ? NAVY : 'transparent' }]}
                  onPress={() => setFilterSort(opt.label)}>
                  <Text style={[s.filterChipTxt, { color: filterSort === opt.label ? '#FFF' : C.text }]}>{t(opt.key)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.filterBtnsRow}>
              <TouchableOpacity style={s.clearBtn} onPress={clearFilter}>
                <Text style={s.clearBtnTxt}>{t('common.clearAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.applyBtn} onPress={applyFilter}>
                <Text style={s.applyBtnTxt}>{t('home.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ALL CATEGORIES MODAL ──────────────────────────────── */}
      <Modal visible={allCatsVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.allCatsModal}>
            <View style={s.filterHeader}>
              <Text style={s.filterTitle}>{t('home.allCategories')}</Text>
              <TouchableOpacity style={s.filterCloseBtn} onPress={() => setAllCatsVisible(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.allCatsGrid}>
                {ALL_CATEGORIES.map(cat => {
                  const active = catFilter === cat.label
                  return (
                    <TouchableOpacity key={cat.label}
                      style={[s.allCatItem, { borderColor: active ? NAVY : C.border, backgroundColor: active ? NAVY : C.card }]}
                      onPress={() => { setCatFilter(active ? '' : cat.label); setAllCatsVisible(false) }}>
                      <Text style={s.allCatEmoji}>{cat.icon}</Text>
                      <Text style={[s.allCatLbl, { color: active ? '#FFF' : C.text }]}>{t('cat.' + cat.key)}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AudioFAB pageText={`${greeting()} ${firstName}. ${artisans.length} artisans available.`} />
    </SafeAreaView>
  )
}