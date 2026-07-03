// app/(customer)/artisan-detail.tsx
// Full artisan showcase visible to customers:
// Hero profile, tagline, credibility stats, work gallery, documents, services, reviews, Book Now
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions, Modal, Linking,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase, getImageUrl } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useAuth } from '../../src/context/AuthContext'
import {
  ArrowLeftIcon, StarIcon, MapPinIcon, PhoneIcon,
  ChatIcon, CheckCircleIcon, ToolIcon, HeartIcon,
} from '../../src/components/Icons'
import Avatar from '../../src/components/Avatar'
import SmartImage from '../../src/components/SmartImage'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const { width: W } = Dimensions.get('window')
const COL = (W - 48) / 2

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  completed: { bg: '#DCFCE7', fg: '#16A34A' },
  in_progress: { bg: '#EDE9FE', fg: '#7C3AED' },
  pending: { bg: '#FEF3C7', fg: '#D97706' },
}

const docEmoji = (type: string) =>
  type?.includes('pdf') ? '📄' : type?.includes('image') ? '🖼️' : type?.includes('word') ? '📝' : '📎'

export default function ArtisanDetail() {
  const { artisanId } = useLocalSearchParams<{ artisanId: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [artisan, setArtisan] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [work, setWork] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<'work' | 'services' | 'reviews' | 'docs'>('work')
  const [viewImg, setViewImg] = useState<string | null>(null)
  const [viewWork, setViewWork] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      let rv: any[] | null = null
      let reviewCount = 0

      let rvRes = await supabase.from('reviews').select('*, profiles:reviewer_id(full_name)').eq('artisan_id', artisanId).neq('status', 'flagged').order('created_at', { ascending: false }).limit(10)
      if (rvRes.error && rvRes.error.message.includes('column') && rvRes.error.message.includes('status')) {
        rvRes = await supabase.from('reviews').select('*, profiles:reviewer_id(full_name)').eq('artisan_id', artisanId).order('created_at', { ascending: false }).limit(10)
      }
      rv = rvRes.data

      let rvcRes = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('artisan_id', artisanId).neq('status', 'flagged')
      if (rvcRes.error && rvcRes.error.message.includes('column') && rvcRes.error.message.includes('status')) {
        rvcRes = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('artisan_id', artisanId)
      }
      reviewCount = rvcRes.count ?? 0

      const [
        { data: ap }, { data: p }, { data: sv },
        { data: wk }, { data: dc }, { data: saved },
        { count: jobCount }
      ] = await Promise.all([
        supabase.from('artisan_profiles').select('*').eq('user_id', artisanId).single(),
        supabase.from('profiles').select('*').eq('id', artisanId).single(),
        supabase.from('artisan_services').select('*').eq('artisan_id', artisanId).eq('is_active', true),
        supabase.from('portfolio_items').select('*').eq('artisan_id', artisanId).order('created_at', { ascending: false }),
        supabase.from('portfolio_documents').select('*').eq('artisan_id', artisanId),
        user ? supabase.from('saved_artisans').select('id').eq('customer_id', user.id).eq('artisan_id', artisanId).maybeSingle() : { data: null, count: null },
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('artisan_id', artisanId).eq('status', 'completed'),
      ])

      // Merge live counts with stored stats — live counts are always accurate
      if (ap) {
        ap.total_jobs = jobCount ?? ap.total_jobs ?? 0
        ap.total_reviews = reviewCount ?? ap.total_reviews ?? 0
        // Recalculate avg rating from actual reviews fetched
        if (rv && rv.length > 0) {
          const avg = rv.reduce((s: number, r: any) => s + (r.rating || 0), 0) / rv.length
          ap.rating = parseFloat(avg.toFixed(1))
        }
      }

      setArtisan(ap); setProfile(p)
      setServices(sv || []); setReviews(rv || [])
      setWork(wk || []); setDocs(dc || [])
      setIsSaved(!!saved)
      setLoading(false)
    }
    load()
  }, [artisanId])

  const toggleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    if (isSaved) {
      await supabase.from('saved_artisans').delete().eq('customer_id', user.id).eq('artisan_id', artisanId)
      setIsSaved(false)
    } else {
      await supabase.from('saved_artisans').insert({ customer_id: user.id, artisan_id: artisanId })
      setIsSaved(true)
    }
    setSaving(false)
  }

  const bookNow = () => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to book.'); return }
    router.push({ pathname: '/(customer)/book-artisan' as any, params: { artisanId } })
  }

  const openChat = () => {
    router.push({ pathname: '/(customer)/tabs/messages' as any, params: { artisanId } })
  }

  const callArtisan = () => {
    if (profile?.phone) Linking.openURL(`tel:${profile.phone}`)
    else Alert.alert('No phone number', 'This artisan has not added a phone number.')
  }

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator color={NAVY} size="large" />
      </View>
    </SafeAreaView>
  )

  if (!artisan) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 16, color: '#64748B' }}>Artisan not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: NAVY, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  const name = profile?.full_name || 'Artisan'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    body: { backgroundColor: '#F8FAFC' },
    // Hero card
    heroCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 0, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: GOLD, alignSelf: 'center', marginBottom: 12 },
    avatarFall: { width: 96, height: 96, borderRadius: 48, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12, borderWidth: 3, borderColor: GOLD },
    avatarTxt: { color: '#FFF', fontSize: 34, fontWeight: '900' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 3 },
    nameText: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
    tradeText: { fontSize: 14, color: NAVY, fontWeight: '700', textAlign: 'center', marginTop: 2 },
    locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 },
    locationTxt: { fontSize: 13, color: '#64748B' },
    tagline: { fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 12, paddingHorizontal: 4 },
    // Stats
    statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    statItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9' },
    statNum: { fontSize: 20, fontWeight: '900', color: NAVY },
    statLbl: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
    // Action buttons
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12 },
    callTxt: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    msgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: NAVY + '12', borderRadius: 14, paddingVertical: 12 },
    msgTxt: { fontSize: 14, fontWeight: '700', color: NAVY },
    // Tabs
    tabRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabTxt: { fontSize: 11, fontWeight: '700' },
    // Work grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
    gridItem: { width: COL, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    gridImg: { width: '100%', height: COL * 0.8 },
    gridBody: { padding: 10 },
    gridTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    gridMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
    gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    gridCost: { fontSize: 12, fontWeight: '800', color: NAVY },
    pill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    pillTxt: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
    // Services
    svcCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    svcIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    svcName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    svcPrice: { fontSize: 13, color: NAVY, fontWeight: '700', marginTop: 2 },
    svcDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
    // Reviews
    rvCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    rvHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    rvAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    rvAvatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    rvName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    rvDate: { fontSize: 11, color: '#94A3B8' },
    rvComment: { fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' },
    // Docs
    docCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    docIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    docName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
    docType: { fontSize: 11, color: '#64748B', marginTop: 2 },
    // Empty
    empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
    emptyTxt: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 12 },
    // Sticky book bar
    bookBar: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceWrap: { flex: 1 },
    fromTxt: { fontSize: 11, color: '#64748B' },
    priceTxt: { fontSize: 18, fontWeight: '900', color: NAVY },
    bookBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
    bookTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    // Section label
    sectionHdr: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  })

  const tabLabel = (t: typeof activeTab) => ({
    work: `Work (${work.length})`,
    services: `Services (${services.length})`,
    reviews: `Reviews (${reviews.length})`,
    docs: `Docs (${docs.length})`,
  }[t])

  const minPrice = services.length > 0 ? Math.min(...services.map(s => s.min_price || 0)) : null

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 }}>{name}</Text>
        <TouchableOpacity style={s.saveBtn} onPress={toggleSave}>
          <HeartIcon size={18} color={isSaved ? '#EF4444' : '#FFF'} fill={isSaved ? '#EF4444' : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          <Avatar
            uri={profile?.avatar_url}
            name={name}
            size={96}
            fallbackBg={NAVY}
            borderWidth={3}
            borderColor={GOLD}
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />
          <View style={s.verifiedRow}>
            <Text style={s.nameText}>{name}</Text>
            {artisan.status === 'approved' && <CheckCircleIcon size={18} color={GOLD} />}
          </View>
          <Text style={s.tradeText}>{artisan.trade_category || 'Artisan'}</Text>
          {artisan.location && (
            <View style={s.locationRow}>
              <MapPinIcon size={13} color="#94A3B8" />
              <Text style={s.locationTxt}>{artisan.location}</Text>
            </View>
          )}
          {artisan.bio ? (
            <Text style={s.tagline}>{artisan.bio}</Text>
          ) : null}

          {/* Credibility stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{artisan.years_experience ?? '—'}</Text>
              <Text style={s.statLbl}>Yrs Exp</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNum}>{artisan.total_jobs ?? 0}</Text>
              <Text style={s.statLbl}>Jobs Done</Text>
            </View>
            <View style={s.statItem}>
              {artisan.rating
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <StarIcon size={14} color={GOLD} fill={GOLD} />
                  <Text style={s.statNum}>{Number(artisan.rating).toFixed(1)}</Text>
                </View>
                : <Text style={s.statNum}>—</Text>
              }
              <Text style={s.statLbl}>Rating</Text>
            </View>
            <View style={[s.statItem, { borderRightWidth: 0 }]}>
              <Text style={s.statNum}>{artisan.total_reviews ?? reviews.length}</Text>
              <Text style={s.statLbl}>Reviews</Text>
            </View>
          </View>

          {/* Call / Message */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.callBtn} onPress={callArtisan}>
              <PhoneIcon size={16} color="#0F172A" />
              <Text style={s.callTxt}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.msgBtn} onPress={openChat}>
              <ChatIcon size={16} color={NAVY} />
              <Text style={s.msgTxt}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabRow}>
          {(['work', 'services', 'reviews', 'docs'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.tab, activeTab === t && { backgroundColor: NAVY }]}
              onPress={() => setActiveTab(t)}>
              <Text style={[s.tabTxt, { color: activeTab === t ? '#FFF' : '#94A3B8' }]}>{tabLabel(t)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Work gallery ── */}
        {activeTab === 'work' && (
          work.length === 0
            ? <View style={s.empty}><Text style={{ fontSize: 48 }}>🖼️</Text><Text style={s.emptyTxt}>No work photos uploaded yet</Text></View>
            : <View style={s.grid}>
              {work.map(item => {
                const sc = STATUS_COLORS[item.status] || { bg: '#F1F5F9', fg: '#64748B' }
                return (
                  <TouchableOpacity key={item.id} style={s.gridItem} onPress={() => setViewWork(item)}>
                    <SmartImage source={{ uri: item.image_url }} bucket="portfolios" style={s.gridImg} resizeMode="cover" />
                    <View style={s.gridBody}>
                      <Text style={s.gridTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.gridMeta} numberOfLines={1}>{item.category}</Text>
                      <View style={s.gridFooter}>
                        <Text style={s.gridCost}>{item.cost ? `₵${item.cost}` : '—'}</Text>
                        <View style={[s.pill, { backgroundColor: sc.bg }]}>
                          <Text style={[s.pillTxt, { color: sc.fg }]}>{item.status.replace('_', ' ')}</Text>
                        </View>
                      </View>
                      {item.review_rating != null && (
                        <View style={{ flexDirection: 'row', gap: 1, marginTop: 4 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <StarIcon key={n} size={9} color={n <= item.review_rating ? GOLD : '#E2E8F0'} fill={n <= item.review_rating ? GOLD : 'none'} />
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
        )}

        {/* ── Services ── */}
        {activeTab === 'services' && (
          services.length === 0
            ? <View style={s.empty}><Text style={{ fontSize: 48 }}>🛠️</Text><Text style={s.emptyTxt}>No services listed yet</Text></View>
            : <>
              <Text style={s.sectionHdr}>What {name.split(' ')[0]} offers</Text>
              {services.map(svc => (
                <View key={svc.id} style={s.svcCard}>
                  <View style={s.svcIcon}><ToolIcon size={20} color={NAVY} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.svcName}>{svc.name}</Text>
                    <Text style={s.svcPrice}>Starting from ₵{svc.min_price}</Text>
                    {svc.description ? <Text style={s.svcDesc} numberOfLines={2}>{svc.description}</Text> : null}
                  </View>
                </View>
              ))}
            </>
        )}

        {/* ── Reviews ── */}
        {activeTab === 'reviews' && (
          reviews.length === 0
            ? <View style={s.empty}><Text style={{ fontSize: 48 }}>⭐</Text><Text style={s.emptyTxt}>No reviews yet</Text></View>
            : <>
              <Text style={s.sectionHdr}>{artisan.total_reviews ?? reviews.length} customer review{(artisan.total_reviews ?? reviews.length) !== 1 ? 's' : ''}{artisan.rating ? ` · avg ${Number(artisan.rating).toFixed(1)}★` : ''}</Text>
              {reviews.map(rv => {
                const rname = (rv.profiles as any)?.full_name || 'Customer'
                const rin = rname.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <View key={rv.id} style={s.rvCard}>
                    <View style={s.rvHeader}>
                      <View style={s.rvAvatar}><Text style={s.rvAvatarTxt}>{rin}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rvName}>{rname}</Text>
                        <Text style={s.rvDate}>{new Date(rv.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <StarIcon key={n} size={13} color={n <= rv.rating ? GOLD : '#E2E8F0'} fill={n <= rv.rating ? GOLD : 'none'} />
                        ))}
                      </View>
                    </View>
                    {rv.comment ? <Text style={s.rvComment}>"{rv.comment}"</Text> : null}
                  </View>
                )
              })}
            </>
        )}

        {/* ── Documents ── */}
        {activeTab === 'docs' && (
          docs.length === 0
            ? <View style={s.empty}><Text style={{ fontSize: 48 }}>📁</Text><Text style={s.emptyTxt}>No documents uploaded</Text></View>
            : <>
              <Text style={s.sectionHdr}>Certificates & credentials</Text>
              {docs.map(doc => (
                <TouchableOpacity key={doc.id} style={s.docCard}
                  onPress={() => WebBrowser.openBrowserAsync(getImageUrl(doc.url, 'portfolios')).catch(() => Alert.alert('Cannot open', 'Unable to open this document.'))}>
                  <View style={s.docIcon}><Text style={{ fontSize: 22 }}>{docEmoji(doc.type)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={s.docType}>Tap to view</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: '#94A3B8' }}>›</Text>
                </TouchableOpacity>
              ))}
            </>
        )}

      </ScrollView>

      {/* ── Work detail modal ── */}
      <Modal visible={!!viewWork} animationType="slide" onRequestClose={() => setViewWork(null)}>
        {viewWork && (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
            <StatusBar style="light" />
            <TouchableOpacity
              style={{ position: 'absolute', top: 50, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setViewWork(null)}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
            <ScrollView>
              <SmartImage source={{ uri: viewWork.image_url }} bucket="portfolios" style={{ width: W, height: W * 0.75 }} resizeMode="cover" forceLoad />
              <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{viewWork.title}</Text>
                    <Text style={{ fontSize: 14, color: NAVY, fontWeight: '700', marginTop: 3 }}>{viewWork.category}</Text>
                  </View>
                </View>
                {viewWork.description ? (
                  <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 12 }}>{viewWork.description}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>Project Cost</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: NAVY, marginTop: 4 }}>{viewWork.cost ? `₵${viewWork.cost}` : 'N/A'}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>Completed</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>
                      {viewWork.completed_date
                        ? new Date(viewWork.completed_date).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' })
                        : 'Ongoing'}
                    </Text>
                  </View>
                </View>
                {viewWork.review && (
                  <View style={{ backgroundColor: GOLD + '1A', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: GOLD + '50' }}>
                    {viewWork.review_rating != null && (
                      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <StarIcon key={n} size={14} color={n <= viewWork.review_rating ? GOLD : '#E2E8F0'} fill={n <= viewWork.review_rating ? GOLD : 'none'} />
                        ))}
                      </View>
                    )}
                    <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>"{viewWork.review}"</Text>
                  </View>
                )}
                <View style={{ height: 40 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Sticky Book Now bar ── */}
      <View style={s.bookBar}>
        <View style={s.priceWrap}>
          <Text style={s.fromTxt}>Starting from</Text>
          <Text style={s.priceTxt}>{minPrice != null ? `₵${minPrice}` : 'Request quote'}</Text>
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={bookNow}>
          <Text style={s.bookTxt}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}