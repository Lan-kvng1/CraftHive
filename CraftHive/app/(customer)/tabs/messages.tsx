// app/(customer)/messages.tsx — FINAL
// Shows list of conversations (one per booking that has messages or is active)
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase, getImageUrl } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import AudioFAB from '../../../src/components/AudioFAB'
import Avatar from '../../../src/components/Avatar'
import { ChatIcon, CheckCircleIcon, ToolIcon } from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

export default function CustomerMessages() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all bookings for this customer that are confirmed or beyond
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, title, service_type, status, artisan_id, created_at')
      .eq('customer_id', user.id)
      .in('status', ['confirmed', 'in_progress', 'completed', 'pending'])
      .order('created_at', { ascending: false })

    if (!bookings || bookings.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const artisanIds = [...new Set(bookings.map(b => b.artisan_id))]

    // Get artisan profiles
    const { data: artisanProfiles } = await supabase
      .from('artisan_profiles')
      .select('user_id, trade_category')
      .in('user_id', artisanIds)

    // Get artisan names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', artisanIds)

    // Get last message per booking
    const bookingIds = bookings.map(b => b.id)
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('booking_id, content, created_at, sender_id, read')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })

    // Get unread counts
    const { data: unreadMsgs } = await supabase
      .from('messages')
      .select('booking_id')
      .in('booking_id', bookingIds)
      .eq('receiver_id', user.id)
      .eq('read', false)

    const unreadMap: Record<string, number> = {}
    unreadMsgs?.forEach(m => {
      unreadMap[m.booking_id] = (unreadMap[m.booking_id] || 0) + 1
    })

    const lastMsgMap: Record<string, any> = {}
    lastMessages?.forEach(m => {
      if (!lastMsgMap[m.booking_id]) lastMsgMap[m.booking_id] = m
    })

    const convs = bookings.map(booking => {
      const ap = artisanProfiles?.find(a => a.user_id === booking.artisan_id)
      const profile = profiles?.find(p => p.id === booking.artisan_id)
      const lastMsg = lastMsgMap[booking.id]
      return {
        bookingId: booking.id,
        artisanId: booking.artisan_id,
        artisanName: profile?.full_name || 'Artisan',
        artisanAvatar: profile?.avatar_url || null,
        tradeCategory: (ap?.trade_category || '').replace(/&#[0-9]+;/g, '').trim(),
        bookingTitle: booking.title || booking.service_type || 'Booking',
        status: booking.status,
        lastMessage: lastMsg?.content || null,
        lastTime: lastMsg?.created_at || booking.created_at,
        unread: unreadMap[booking.id] || 0,
        isMyMsg: lastMsg?.sender_id === user.id,
      }
    })

    setConversations(convs)
    setLoading(false)
  }, [user])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
  }

  const statusColor: Record<string, string> = {
    pending: '#F5A623', confirmed: NAVY,
    in_progress: '#8B5CF6', completed: '#22C55E',
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    body: { flex: 1, backgroundColor: C.background },
    item: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
      backgroundColor: C.card, gap: 12,
    },
    unreadItem: { backgroundColor: NAVY + '05' },
    avatarImg: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: GOLD },
    avatarFall: { width: 52, height: 52, borderRadius: 16, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD },
    avatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 18 },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    nameTxt: { fontSize: 15, fontWeight: '800', color: C.text },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    tradeTxt: { fontSize: 12, color: C.textSecondary, marginBottom: 3 },
    lastMsg: { fontSize: 13, color: C.textSecondary },
    lastMsgUnread: { color: C.text, fontWeight: '600' },
    rightCol: { alignItems: 'flex-end', gap: 6 },
    timeTxt: { fontSize: 11, color: C.textMuted },
    unreadBadge: { backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
    unreadTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    emptyWrap: { alignItems: 'center', paddingTop: 80 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
    emptyTxt2: { fontSize: 13, color: C.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  })

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages {totalUnread > 0 ? `(${totalUnread})` : ''}</Text>
        <Text style={s.headerSub}>Chat with your artisans</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      ) : (
        <FlatList
          style={s.body}
          data={conversations}
          keyExtractor={i => i.bookingId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <ChatIcon size={52} color={C.textMuted} />
              <Text style={s.emptyTxt}>No conversations yet</Text>
              <Text style={s.emptyTxt2}>Book an artisan to start chatting with them</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.item, item.unread > 0 && s.unreadItem]}
              onPress={() => {
                setConversations(prev => prev.map(c => c.bookingId === item.bookingId ? { ...c, unread: 0 } : c))
                router.push({
                  pathname: '/(customer)/chat' as any,
                  params: { bookingId: item.bookingId, otherName: item.artisanName }
                })
              }}
              activeOpacity={0.7}>
              <Avatar
                uri={item.artisanAvatar}
                name={item.artisanName}
                size={52}
                radius={16}
                borderWidth={2}
                borderColor={GOLD}
              />
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.nameTxt} numberOfLines={1}>{item.artisanName}</Text>
                  <View style={[s.statusDot, { backgroundColor: statusColor[item.status] || '#94A3B8' }]} />
                </View>
                <Text style={s.tradeTxt} numberOfLines={1}>{item.tradeCategory || item.bookingTitle}</Text>
                <Text style={[s.lastMsg, item.unread > 0 && s.lastMsgUnread]} numberOfLines={1}>
                  {item.lastMessage
                    ? (item.isMyMsg ? `You: ${item.lastMessage}` : item.lastMessage)
                    : 'Tap to start chatting'
                  }
                </Text>
              </View>
              <View style={s.rightCol}>
                <Text style={s.timeTxt}>{fmtTime(item.lastTime)}</Text>
                {item.unread > 0 && (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadTxt}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <AudioFAB pageText={`Messages. ${conversations.length} conversations. ${totalUnread} unread.`} />
    </SafeAreaView>
  )
}