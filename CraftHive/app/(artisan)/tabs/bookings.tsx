// app/(artisan)/bookings.tsx — FINAL
// Navy-blue, useAppTheme, real DB, AudioFAB
import React, { useEffect, useState, useCallback } from 'react'
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import { useLang } from '../../../src/context/LanguageContext'
import AudioFAB from '../../../src/components/AudioFAB'
import {
    CalendarIcon, ChevronRightIcon, ClockIcon,
    CheckCircleIcon, XIcon, ToolIcon,
} from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const TABS = ['All', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']

const STATUS_MAP: Record<string, string> = {
    'All': '', 'Pending': 'pending', 'Confirmed': 'confirmed',
    'In Progress': 'in_progress', 'Completed': 'completed', 'Cancelled': 'cancelled',
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    confirmed: { bg: NAVY + '15', text: NAVY },
    in_progress: { bg: '#EDE9FE', text: '#7C3AED' },
    completed: { bg: '#DCFCE7', text: '#16A34A' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function ArtisanBookings() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { user } = useAuth()
    const { t } = useLang()
    const [tab, setTab] = useState('All')
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async () => {
        if (!user) return
        let q = supabase
            .from('bookings')
            .select('*, profiles:customer_id(full_name, avatar_url)')
            .eq('artisan_id', user.id)
            .order('scheduled_at', { ascending: false })
        const status = STATUS_MAP[tab]
        if (status) q = q.eq('status', status)
        const { data } = await q
        setBookings(data || [])
        setLoading(false)
    }, [user, tab])

    useEffect(() => { load() }, [load])

    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })
    const fmtTime = (d: string) =>
        new Date(d).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
        headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
        headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
        tabsWrap: { backgroundColor: NAVY, paddingBottom: 12 },
        tabScroll: { paddingHorizontal: 16 },
        tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1.5 },
        tabTxt: { fontSize: 13, fontWeight: '700' },
        body: { flex: 1, backgroundColor: C.background },
        card: {
            backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
            borderRadius: 18, padding: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        },
        cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
        titleTxt: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, marginRight: 8 },
        badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
        badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
        metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
        metaTxt: { fontSize: 13, color: C.textSecondary },
        divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
        cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        customerTxt: { fontSize: 13, color: C.textSecondary },
        priceTxt: { fontSize: 16, fontWeight: '900', color: NAVY },
        viewBtn: { backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
        viewTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
        emptyWrap: { alignItems: 'center', paddingTop: 80 },
        emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
    })

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <Text style={s.headerTitle}>My Bookings</Text>
                <Text style={s.headerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
            </View>

            {/* Tabs */}
            <View style={s.tabsWrap}>
                <FlatList
                    horizontal data={TABS} keyExtractor={t => t}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.tabScroll}
                    renderItem={({ item }) => {
                        const active = tab === item
                        return (
                            <TouchableOpacity
                                style={[s.tab, { borderColor: active ? GOLD : 'rgba(255,255,255,0.2)', backgroundColor: active ? GOLD : 'transparent' }]}
                                onPress={() => setTab(item)}>
                                <Text style={[s.tabTxt, { color: active ? NAVY : 'rgba(255,255,255,0.7)' }]}>{item}</Text>
                            </TouchableOpacity>
                        )
                    }}
                />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
                    <ActivityIndicator color={NAVY} size="large" />
                </View>
            ) : (
                <FlatList
                    style={s.body}
                    data={bookings}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
                    ListEmptyComponent={
                        <View style={s.emptyWrap}>
                            <CalendarIcon size={48} color={C.textMuted} />
                            <Text style={s.emptyTxt}>No {tab !== 'All' ? tab.toLowerCase() : ''} bookings yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const sc = STATUS_COLOR[item.status] || { bg: C.surface, text: C.textSecondary }
                        const custName = (item.profiles as any)?.full_name || 'Customer'
                        return (
                            <TouchableOpacity style={s.card} onPress={() => router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId: item.id } })}>
                                <View style={s.cardTop}>
                                    <Text style={s.titleTxt} numberOfLines={2}>{item.title || item.service_type}</Text>
                                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                                        <Text style={[s.badgeTxt, { color: sc.text }]}>{item.status.replace('_', ' ')}</Text>
                                    </View>
                                </View>
                                <View style={s.metaRow}>
                                    <CalendarIcon size={14} color={NAVY} />
                                    <Text style={s.metaTxt}>{fmtDate(item.scheduled_at)}</Text>
                                    <ClockIcon size={14} color={NAVY} />
                                    <Text style={s.metaTxt}>{fmtTime(item.scheduled_at)}</Text>
                                </View>
                                {item.address && (
                                    <View style={s.metaRow}>
                                        <ToolIcon size={14} color={C.textSecondary} />
                                        <Text style={s.metaTxt} numberOfLines={1}>{item.address}</Text>
                                    </View>
                                )}
                                <View style={s.divider} />
                                <View style={s.cardBottom}>
                                    <View>
                                        <Text style={{ fontSize: 11, color: C.textMuted }}>Customer</Text>
                                        <Text style={s.customerTxt}>{custName}</Text>
                                    </View>
                                    <Text style={s.priceTxt}>₵{item.price || 0}</Text>
                                    <TouchableOpacity style={s.viewBtn}
                                        onPress={() => router.push({ pathname: '/(artisan)/job-detail' as any, params: { bookingId: item.id } })}>
                                        <Text style={s.viewTxt}>View</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                />
            )}
            <AudioFAB pageText={`Bookings. ${bookings.length} ${tab} bookings.`} />
        </SafeAreaView>
    )
}