// app/(customer)/saved-artisans.tsx — FINAL
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import { ArrowLeftIcon, HeartIcon, StarIcon, MapPinIcon, CheckCircleIcon, ToolIcon } from '../../src/components/Icons'
import Avatar from '../../src/components/Avatar'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

export default function SavedArtisans() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()
  const { t } = useLang()

  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    // Step 1: get saved artisan IDs
    const { data: savedRows } = await supabase
      .from('saved_artisans')
      .select('id, artisan_id, created_at')
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false })

    if (!savedRows || savedRows.length === 0) { setSaved([]); setLoading(false); return }

    const artisanIds = savedRows.map(s => s.artisan_id)

    // Step 2: get artisan profiles
    const { data: artisanData } = await supabase
      .from('artisan_profiles').select('*').in('user_id', artisanIds)

    // Step 3: get their profile names/avatars
    const { data: profileData } = await supabase
      .from('profiles').select('id, full_name, avatar_url').in('id', artisanIds)

    const merged = savedRows.map(s => {
      const ap = artisanData?.find(a => a.user_id === s.artisan_id)
      const p = profileData?.find(p => p.id === s.artisan_id)
      return { savedId: s.id, artisanId: s.artisan_id, artisan: ap, profile: p }
    }).filter(x => x.artisan)

    setSaved(merged)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const unsave = (savedId: string, name: string) => Alert.alert(
    'Remove from Saved',
    `Remove ${name} from your saved artisans?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t('saved.remove'), style: 'destructive', onPress: async () => {
          await supabase.from('saved_artisans').delete().eq('id', savedId)
          setSaved(s => s.filter(x => x.savedId !== savedId))
        }
      },
    ]
  )

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    avatarImg: { width: 60, height: 60, borderRadius: 18, borderWidth: 2, borderColor: GOLD },
    avatarFall: { width: 60, height: 60, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD },
    avatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 20 },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    nameTxt: { fontSize: 15, fontWeight: '800', color: C.text },
    tradeTxt: { fontSize: 13, color: C.textSecondary, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaTxt: { fontSize: 12, color: C.textSecondary },
    actions: { gap: 8 },
    bookBtn: { backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    bookTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    heartBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
    emptyTxt2: { fontSize: 13, color: C.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Artisans</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
          <ActivityIndicator color={NAVY} />
        </View>
      ) : (
        <FlatList
          style={s.body}
          data={saved}
          keyExtractor={i => i.savedId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <HeartIcon size={48} color={C.textMuted} />
              <Text style={s.emptyTxt}>No saved artisans yet</Text>
              <Text style={s.emptyTxt2}>Tap the heart icon on any artisan profile to save them here</Text>
            </View>
          }
          renderItem={({ item }) => {
            const name = item.profile?.full_name || 'Artisan'
            const trade = item.artisan?.trade_category?.replace(/&#[0-9]+;/g, '').trim() || ''
            return (
              <View style={s.card}>
                <Avatar uri={item.profile?.avatar_url} name={name} size={52} radius={16} borderWidth={2} borderColor={GOLD} />
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.nameTxt} numberOfLines={1}>{name}</Text>
                    <CheckCircleIcon size={13} color={NAVY} />
                  </View>
                  <Text style={s.tradeTxt}>{trade}</Text>
                  <View style={s.metaRow}>
                    <StarIcon size={12} color={GOLD} fill={GOLD} />
                    <Text style={s.metaTxt}>{item.artisan?.rating?.toFixed(1) || '0.0'}</Text>
                    <MapPinIcon size={12} color={C.textSecondary} />
                    <Text style={s.metaTxt}>{item.artisan?.location || 'Accra'}</Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity style={s.bookBtn}
                    onPress={() => router.push({ pathname: '/(customer)/book-artisan' as any, params: { artisanId: item.artisanId } })}>
                    <Text style={s.bookTxt}>Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.heartBtn} onPress={() => unsave(item.savedId, name)}>
                    <HeartIcon size={16} color="#EF4444" fill="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}