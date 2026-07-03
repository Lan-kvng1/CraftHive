// app/(customer)/notifications.tsx — FINAL (real DB data)
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
import { ArrowLeftIcon, BellIcon, CheckCircleIcon, CalendarIcon, ChatIcon, TagIcon, ShieldIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  booking_new: { icon: CalendarIcon, color: NAVY, bg: NAVY + '15' },
  booking_confirmed: { icon: CheckCircleIcon, color: '#22C55E', bg: '#DCFCE7' },
  booking_completed: { icon: CheckCircleIcon, color: '#22C55E', bg: '#DCFCE7' },
  booking_cancelled: { icon: ShieldIcon, color: '#EF4444', bg: '#FEE2E2' },
  message_new: { icon: ChatIcon, color: NAVY, bg: NAVY + '15' },
  payment_received: { icon: TagIcon, color: GOLD, bg: GOLD + '20' },
  default: { icon: BellIcon, color: NAVY, bg: NAVY + '15' },
}

export default function CustomerNotifications() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()
  const { refreshUnread } = useNotifications()
  const { t } = useLang()

  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false)
    setNotifications(n => n.map(x => ({ ...x, read: true })))
    refreshUnread()
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x))
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
        router.push({ pathname: '/(customer)/chat' as any, params: { bookingId } })
      } else {
        router.push({ pathname: '/(customer)/booking-detail' as any, params: { bookingId } })
      }
    }
  }

  useEffect(() => { load() }, [])

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
    markAllTxt: { fontSize: 12, color: '#FFF', fontWeight: '600' },
    body: { flex: 1, backgroundColor: C.background },
    unreadBanner: { backgroundColor: NAVY + '12', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    unreadTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    unreadItem: { backgroundColor: NAVY + '05' },
    iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY, borderWidth: 2, borderColor: C.background },
    title: { fontSize: 14, fontWeight: '700', color: C.text },
    body_: { fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 18 },
    time: { fontSize: 11, color: C.textMuted, marginTop: 4 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 14 },
  })

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('notif.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
            <Text style={s.markAllTxt}>{t('notif.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
          <ActivityIndicator color={NAVY} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 100 }}
          style={s.body}
          data={notifications}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
          ListHeaderComponent={
            unreadCount > 0 ? (
              <View style={s.unreadBanner}>
                <BellIcon size={16} color={NAVY} />
                <Text style={s.unreadTxt}>{unreadCount} {t('notif.title').toLowerCase()}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <BellIcon size={48} color={C.textMuted} />
              <Text style={s.emptyTxt}>{t('notif.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.default
            const Icon = cfg.icon
            return (
              <TouchableOpacity
                style={[s.item, !item.read && s.unreadItem]}
                onPress={() => handleTap(item)}
                activeOpacity={0.7}>
                <View style={{ position: 'relative' }}>
                  <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}>
                    <Icon size={20} color={cfg.color} />
                  </View>
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
    </SafeAreaView>
  )
}