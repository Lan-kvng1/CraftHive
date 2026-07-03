// app/(artisan)/notifications.tsx — FINAL
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
import { useLang } from '../../src/context/LanguageContext'
import { useNotifications } from '../../src/context/NotificationContext'
import AudioFAB from '../../src/components/AudioFAB'
import {
  ArrowLeftIcon, BellIcon, CalendarIcon,
  CheckCircleIcon, ChatIcon, InfoIcon,
} from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  booking_new: { icon: CalendarIcon, color: NAVY, bg: NAVY + '15' },
  booking_confirmed: { icon: CheckCircleIcon, color: '#16A34A', bg: '#DCFCE7' },
  booking_cancelled: { icon: InfoIcon, color: '#DC2626', bg: '#FEE2E2' },
  booking_completed: { icon: CheckCircleIcon, color: '#16A34A', bg: '#DCFCE7' },
  message_new: { icon: ChatIcon, color: NAVY, bg: NAVY + '15' },
  default: { icon: BellIcon, color: NAVY, bg: NAVY + '15' },
}

export default function ArtisanNotifications() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()
  const { t } = useLang()
  const { refreshUnread } = useNotifications()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user?.id)
      .order('created_at', { ascending: false }).limit(50)
    setNotifs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false)
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    refreshUnread()
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    refreshUnread()
  }

  const handleTap = (item: any) => {
    markRead(item.id)
    let parsedData = item.data
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData)
      } catch (e) {
        console.warn("Failed to parse notification data:", e)
      }
    }
    const bookingId = parsedData?.booking_id
    if (bookingId) {
      if (item.type === 'message_new') {
        router.push({ pathname: '/(artisan)/chat' as any, params: { bookingId } })
      } else {
        router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId } })
      }
    }
  }

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
  }

  const unread = notifs.filter(n => !n.read).length

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    markBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
    markTxt: { fontSize: 12, color: '#FFF', fontWeight: '600' },
    body: { flex: 1, backgroundColor: C.background },
    banner: { backgroundColor: NAVY + '12', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    unreadItem: { backgroundColor: NAVY + '05' },
    iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY, borderWidth: 2, borderColor: C.background },
    title: { fontSize: 14, fontWeight: '700', color: C.text },
    body_: { fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 18 },
    time: { fontSize: 11, color: C.textMuted, marginTop: 4 },
    emptyWrap: { alignItems: 'center', paddingTop: 80 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('notif.title')}</Text>
        {unread > 0 && (
          <TouchableOpacity style={s.markBtn} onPress={markAllRead}>
            <Text style={s.markTxt}>{t('notif.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
          <ActivityIndicator color={NAVY} />
        </View>
      ) : (
        <FlatList
          style={s.body}
          data={notifs}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
          ListHeaderComponent={unread > 0 ? (
            <View style={s.banner}>
              <BellIcon size={16} color={NAVY} />
              <Text style={s.bannerTxt}>{unread} {t('notif.title').toLowerCase()}</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <BellIcon size={48} color={C.textMuted} />
              <Text style={s.emptyTxt}>{t('notif.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.default
            const Icon = cfg.icon
            return (
              <TouchableOpacity style={[s.item, !item.read && s.unreadItem]} onPress={() => handleTap(item)} activeOpacity={0.7}>
                <View style={{ position: 'relative' }}>
                  <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}><Icon size={20} color={cfg.color} /></View>
                  {!item.read && <View style={s.dot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.title, !item.read && { color: NAVY }]}>{item.title}</Text>
                  {item.body ? <Text style={s.body_}>{item.body}</Text> : null}
                  <Text style={s.time}>{fmtTime(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
      <AudioFAB pageText={`Notifications. ${notifs.length} total. ${unread} unread.`} />
    </SafeAreaView>
  )
}