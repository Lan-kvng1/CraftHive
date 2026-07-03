// app/(artisan)/payment-history.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon } from '../../src/components/Icons'

const G = '#1B4332'
const TABS = ['All', 'Received', 'Payouts']

export default function ArtisanPaymentHistory() {
    const { user } = useAuth()
    const router = useRouter()
    const { C } = useAppTheme()
    const [tab, setTab] = useState('All')
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            if (!user) return
            const { data } = await supabase.from('bookings')
                .select('*, profiles:customer_id(full_name)')
                .eq('artisan_id', user.id).order('created_at', { ascending: false })
            const all = (data || []).map(b => ({
                id: b.id,
                title: b.status === 'completed' ? 'Payment Received' : 'Pending Payment',
                sub: b.title || b.service_type,
                date: new Date(b.updated_at || b.created_at).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' }),
                amount: b.price || 0,
                type: b.status === 'completed' ? 'received' : 'pending',
                status: b.status === 'completed' ? 'Completed' : 'Pending',
            }))
            setItems(tab === 'All' ? all : tab === 'Received' ? all.filter(a => a.type === 'received') : all.filter(a => a.type !== 'received'))
        }
        load()
    }, [tab, user])

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: G },
        header: { backgroundColor: G, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        body: { flex: 1, backgroundColor: C.background },
        tabRow: { flexDirection: 'row', backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border },
        tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
        tabTxt: { fontSize: 13, fontWeight: '600' },
        item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
        iconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
        iconTxt: { fontSize: 20 },
        itemTitle: { fontSize: 14, fontWeight: '600', color: C.text },
        itemSub: { fontSize: 12, color: C.textSecondary },
        itemDate: { fontSize: 11, color: C.textMuted, marginTop: 1 },
        amt: { fontSize: 15, fontWeight: '700' },
        status: { fontSize: 11, textAlign: 'right' },
        empty: { alignItems: 'center', marginTop: 60 },
        emptyTxt: { fontSize: 16, color: C.textSecondary, marginTop: 12 },
    })

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Payment History</Text>
            </View>
            <View style={s.body}>
                <View style={s.tabRow}>
                    {TABS.map(t => (
                        <TouchableOpacity key={t} style={[s.tabBtn, { backgroundColor: tab === t ? G : 'transparent' }]} onPress={() => setTab(t)}>
                            <Text style={[s.tabTxt, { color: tab === t ? '#FFF' : C.textSecondary }]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <FlatList
                    contentContainerStyle={{ paddingBottom: 100 }}
                    data={items}
                    keyExtractor={i => i.id}
                    ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTxt}>No transactions found</Text></View>}
                    renderItem={({ item }) => (
                        <View style={s.item}>
                            <View style={s.iconWrap}><Text style={s.iconTxt}>{item.type === 'received' ? '✅' : '⏳'}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.itemTitle}>{item.title}</Text>
                                <Text style={s.itemSub}>{item.sub}</Text>
                                <Text style={s.itemDate}>{item.date}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[s.amt, { color: item.type === 'received' ? '#22C55E' : C.textSecondary }]}>
                                    {item.type === 'received' ? '+' : ''}₵{item.amount}
                                </Text>
                                <Text style={[s.status, { color: item.status === 'Completed' ? '#22C55E' : '#F5A623' }]}>{item.status}</Text>
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}