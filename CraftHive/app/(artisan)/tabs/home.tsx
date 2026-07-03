// app/(artisan)/tabs/home.tsx
import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase, getImageUrl } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import { useLang } from '../../../src/context/LanguageContext'
import { useNotifications } from '../../../src/context/NotificationContext'
import AudioFAB from '../../../src/components/AudioFAB'
import Avatar from '../../../src/components/Avatar'
import {
  BellIcon, CheckCircleIcon, StarIcon, CalendarIcon,
  BriefcaseIcon, TrendingUpIcon, ToolIcon, ClockIcon,
} from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const GOLD = '#FFB800'

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  in_progress: { bg: '#EDE9FE', text: '#7C3AED' },
  completed: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function ArtisanHome() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile } = useAuth()
  const { unreadCount } = useNotifications()
  const { t } = useLang()

  const [artisan, setArtisan] = useState<any>(null)
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, earnings: 0, rating: 0 })
  const [nextBooking, setNextBooking] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: ap }, { data: bks }, { data: rvs }] = await Promise.all([
      supabase.from('artisan_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('bookings')
        .select('id, title, service_type, status, scheduled_at, price, profiles:customer_id(full_name, avatar_url)')
        .eq('artisan_id', user.id)
        .order('scheduled_at', { ascending: false }),
      supabase.from('reviews').select('rating').eq('artisan_id', user.id),
    ])
    setArtisan(ap)
    const liveRating = rvs && rvs.length > 0
      ? parseFloat((rvs.reduce((s, r) => s + (r.rating || 0), 0) / rvs.length).toFixed(1))
      : 0
    if (bks) {
      const upcoming = bks.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status))
      const completed = bks.filter(b => b.status === 'completed')
      const gross = completed.reduce((s, b) => s + (b.price || 0), 0)
      setStats({
        upcoming: upcoming.length,
        completed: completed.length,
        earnings: parseFloat((gross * 0.9).toFixed(2)),
        rating: liveRating,
      })
      const future = upcoming
        .filter(b => b.scheduled_at && new Date(b.scheduled_at) >= new Date())
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      setNextBooking(future[0] || upcoming[0] || null)
      setRecent(bks.filter(b => b.status !== 'pending').slice(0, 5))
    }
  }, [user])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? t('home.goodMorning') : h < 17 ? t('home.goodAfternoon') : t('home.goodEvening')
  }

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'
  const fmtTime = (d: string) =>
    d ? new Date(d).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) : ''

  const firstName = profile?.full_name?.split(' ')[0] || 'Artisan'
  const initials = profile?.full_name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase() || 'A'

  const s = StyleSheet.create({
    // Outer container — navy background so SafeAreaView top area matches header
    safe: { flex: 1, backgroundColor: NAVY },

    // ScrollView fills everything below SafeAreaView top
    scroll: { flex: 1 },

    // ── Header — inside scroll, no fixed height ──
    header: {
      backgroundColor: NAVY,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    avatarFall: { width: 52, height: 52, borderRadius: 26, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    avatarTxt: { color: NAVY, fontWeight: '900', fontSize: 18 },
    greetCol: { flex: 1 },
    greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
    greetName: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    bellWrap: { position: 'relative' },
    bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: NAVY },
    badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    verifiedTxt: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

    // ── White body — rounded top corners, sits directly below header ──
    body: {
      backgroundColor: '#F4F6FB',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 120,
      // No negative margin — body simply follows header
      minHeight: 600, // ensures scroll works even with little content
    },

    // ── Overview card ──
    overviewCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: '#FFF',
      borderRadius: 18,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    overviewTitle: { fontSize: 15, fontWeight: '800', color: '#1A2340', marginBottom: 14 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statBox: {
      width: '47%',
      backgroundColor: '#F8FAFF',
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: '#E8EDF7',
    },
    statIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    statNum: { fontSize: 18, fontWeight: '900', color: '#1A2340' },
    statLbl: { fontSize: 11, color: '#8492A6', marginTop: 2 },

    // ── Section header ──
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
    sectionTtl: { fontSize: 16, fontWeight: '900', color: '#1A2340' },
    seeAll: { fontSize: 13, color: NAVY, fontWeight: '700' },

    // ── Next booking card ──
    nextCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    nextHead: { backgroundColor: NAVY, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    nextIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    nextTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFF' },
    nextPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
    nextPillTxt: { fontSize: 11, color: '#FFF', fontWeight: '700', textTransform: 'capitalize' },
    nextBody: { backgroundColor: '#FFF', padding: 16 },
    nextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    nextRowTxt: { fontSize: 13, color: '#8492A6' },
    custRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F2F8' },
    custAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    custAvatarTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    custName: { fontSize: 14, fontWeight: '700', color: '#1A2340' },
    custLbl: { fontSize: 11, color: '#8492A6' },
    viewBtn: { marginLeft: 'auto', backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    viewBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    // ── Quick actions ──
    quickRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16 },
    quickCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    quickIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    quickTitle: { fontSize: 13, fontWeight: '800', color: '#1A2340' },
    quickSub: { fontSize: 11, color: '#8492A6', marginTop: 3, lineHeight: 16 },

    // ── Recent jobs ──
    recentCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    recentLeft: { flex: 1 },
    recentTitle: { fontSize: 14, fontWeight: '700', color: '#1A2340' },
    recentSub: { fontSize: 12, color: '#8492A6', marginTop: 2 },
    recentPrice: { fontSize: 14, fontWeight: '900', color: NAVY, marginBottom: 4 },
    pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    pillTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

    // ── Empty ──
    empty: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 16, padding: 28, alignItems: 'center', gap: 10 },
    emptyTxt: { fontSize: 13, color: '#8492A6', textAlign: 'center', lineHeight: 20 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
      >
        {/* ── Header (inside scroll — no overlap possible) ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.push('/(artisan)/tabs/profile' as any)}>
              <Avatar
                uri={profile?.avatar_url}
                name={firstName}
                size={52}
                radius={26}
                fallbackBg={GOLD}
                fallbackTextColor={NAVY}
                borderWidth={2}
                borderColor="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
            <View style={s.greetCol}>
              <Text style={s.greetSub}>{greeting()},</Text>
              <Text style={s.greetName}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity style={s.bellWrap}
              onPress={() => router.push('/(artisan)/notifications' as any)}>
              <View style={s.bell}>
                <BellIcon size={20} color="#FFF" />
              </View>
              {unreadCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {artisan?.status === 'approved' && (
            <View style={s.verifiedRow}>
              <CheckCircleIcon size={14} color={GOLD} />
              <Text style={s.verifiedTxt}>Verified Artisan</Text>
            </View>
          )}
        </View>

        {/* ── White body — no negative margin, sits flush below header ── */}
        <View style={s.body}>

          {/* 1. Overview */}
          <View style={s.overviewCard}>
            <Text style={s.overviewTitle}>{t('artisan.home.overview')}</Text>
            <View style={s.statsGrid}>
              <TouchableOpacity style={s.statBox} onPress={() => router.push('/(artisan)/tabs/bookings' as any)}>
                <View style={s.statIconWrap}><CalendarIcon size={20} color={NAVY} /></View>
                <View>
                  <Text style={s.statNum}>{stats.upcoming}</Text>
                  <Text style={s.statLbl}>{t('artisan.home.upcoming')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.statBox} onPress={() => router.push('/(artisan)/tabs/bookings' as any)}>
                <View style={s.statIconWrap}><CheckCircleIcon size={20} color={NAVY} /></View>
                <View>
                  <Text style={s.statNum}>{stats.completed}</Text>
                  <Text style={s.statLbl}>{t('artisan.home.completed')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.statBox} onPress={() => router.push('/(artisan)/reviews' as any)}>
                <View style={[s.statIconWrap, { backgroundColor: GOLD + '22' }]}>
                  <StarIcon size={20} color={GOLD} fill={stats.rating > 0 ? GOLD : 'none'} />
                </View>
                <View>
                  <Text style={s.statNum}>{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}</Text>
                  <Text style={s.statLbl}>{t('artisan.home.rating')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.statBox} onPress={() => router.push('/(artisan)/earnings' as any)}>
                <View style={[s.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <TrendingUpIcon size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.statNum, { fontSize: 15 }]} numberOfLines={1}>₵{stats.earnings}</Text>
                  <Text style={s.statLbl}>{t('artisan.home.earnings')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Next Job */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTtl}>{t('artisan.home.nextJob')}</Text>
            <TouchableOpacity onPress={() => router.push('/(artisan)/tabs/bookings' as any)}>
              <Text style={s.seeAll}>{t('artisan.home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {nextBooking ? (
            <TouchableOpacity style={s.nextCard}
              onPress={() => router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId: nextBooking.id } })}>
              <View style={s.nextHead}>
                <View style={s.nextIconWrap}><ToolIcon size={20} color="#FFF" /></View>
                <Text style={s.nextTitle} numberOfLines={1}>{nextBooking.title || nextBooking.service_type || 'Service Job'}</Text>
                <View style={s.nextPill}>
                  <Text style={s.nextPillTxt}>{nextBooking.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={s.nextBody}>
                <View style={s.nextRow}>
                  <CalendarIcon size={14} color={NAVY} />
                  <Text style={s.nextRowTxt}>{fmtDate(nextBooking.scheduled_at)}</Text>
                  <ClockIcon size={14} color={NAVY} />
                  <Text style={s.nextRowTxt}>{fmtTime(nextBooking.scheduled_at)}</Text>
                  {nextBooking.price ? (
                    <Text style={{ marginLeft: 'auto', fontSize: 14, fontWeight: '800', color: NAVY }}>
                      ₵{nextBooking.price}
                    </Text>
                  ) : null}
                </View>
                <View style={s.custRow}>
                  <View style={s.custAvatar}>
                    <Text style={s.custAvatarTxt}>
                      {((nextBooking.profiles as any)?.full_name || 'C')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={s.custLbl}>{t('artisan.home.customer')}</Text>
                    <Text style={s.custName}>{(nextBooking.profiles as any)?.full_name || 'Customer'}</Text>
                  </View>
                  <TouchableOpacity style={s.viewBtn}
                    onPress={() => router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId: nextBooking.id } })}>
                    <Text style={s.viewBtnTxt}>{t('artisan.home.viewDetails')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={s.empty}>
              <CalendarIcon size={36} color="#CBD5E1" />
              <Text style={s.emptyTxt}>{t('artisan.home.noUpcoming')}{'\n'}{t('artisan.home.shareProfile')}</Text>
            </View>
          )}

          {/* 3. Quick Actions */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTtl}>{t('artisan.home.quickActions')}</Text>
          </View>
          <View style={s.quickRow}>
            <TouchableOpacity style={s.quickCard}
              onPress={() => router.push('/(artisan)/manage-services' as any)}>
              <View style={s.quickIcon}><ToolIcon size={22} color={NAVY} /></View>
              <Text style={s.quickTitle}>{t('artisan.home.manageServices')}</Text>
              <Text style={s.quickSub}>{t('artisan.home.manageServicesSub')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickCard}
              onPress={() => router.push('/(artisan)/availability' as any)}>
              <View style={s.quickIcon}><CalendarIcon size={22} color={NAVY} /></View>
              <Text style={s.quickTitle}>{t('artisan.home.availability')}</Text>
              <Text style={s.quickSub}>{t('artisan.home.availabilitySub')}</Text>
            </TouchableOpacity>
          </View>

          {/* 4. Recent Jobs */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTtl}>{t('artisan.home.recentJobs')}</Text>
            <TouchableOpacity onPress={() => router.push('/(artisan)/tabs/bookings' as any)}>
              <Text style={s.seeAll}>{t('artisan.home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={s.empty}>
              <BriefcaseIcon size={36} color="#CBD5E1" />
              <Text style={s.emptyTxt}>{t('artisan.home.noRecent')}</Text>
            </View>
          ) : recent.map(b => {
            const sc = STATUS_COLOR[b.status] || { bg: '#F1F5F9', text: '#64748B' }
            const custName = (b.profiles as any)?.full_name || 'Customer'
            return (
              <TouchableOpacity key={b.id} style={s.recentCard}
                onPress={() => router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId: b.id } })}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: NAVY + '10', alignItems: 'center', justifyContent: 'center' }}>
                  <ToolIcon size={18} color={NAVY} />
                </View>
                <View style={s.recentLeft}>
                  <Text style={s.recentTitle} numberOfLines={1}>{b.title || b.service_type || 'Service'}</Text>
                  <Text style={s.recentSub}>{custName} · {fmtDate(b.scheduled_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.recentPrice}>₵{b.price || 0}</Text>
                  <View style={[s.pill, { backgroundColor: sc.bg }]}>
                    <Text style={[s.pillTxt, { color: sc.text }]}>{b.status.replace('_', ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}

        </View>{/* end body */}
      </ScrollView>

      <AudioFAB pageText={`${greeting()} ${firstName}. ${stats.upcoming} upcoming jobs. ${stats.completed} completed. Earnings ₵${stats.earnings}. Rating ${stats.rating > 0 ? stats.rating.toFixed(1) : 'not yet rated'}.`} />
    </SafeAreaView>
  )
}