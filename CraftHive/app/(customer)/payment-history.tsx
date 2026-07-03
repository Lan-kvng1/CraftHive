// app/(customer)/payment-history.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import { ArrowLeftIcon, TrendingUpIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const TABS = ['All', 'Payments', 'Refunds']

export default function CustomerPaymentHistory() {
  const { t } = useLang()
  const { user } = useAuth()
  const router = useRouter()
  const { C } = useAppTheme()
  const [tab, setTab] = useState('All')
  const [all, setAll] = useState<any[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Step 1: fetch bookings
    const { data: bks } = await supabase
      .from('bookings')
      .select('id, title, service_type, status, price, artisan_id, created_at, updated_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (!bks || bks.length === 0) { setAll([]); setTotalSpent(0); setLoading(false); return }

    // Step 2: fetch artisan names separately (avoids FK ambiguity)
    const artisanIds = [...new Set(bks.map((b: any) => b.artisan_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name').in('id', artisanIds)
    const profileMap: Record<string, string> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name })

    const mapped = bks.map((b: any) => ({
      id: b.id,
      title: b.title || b.service_type || 'Service',
      artisan: profileMap[b.artisan_id] || 'Artisan',
      date: new Date(b.updated_at || b.created_at).toLocaleDateString('en-GH', {
        month: 'long', day: 'numeric', year: 'numeric',
      }),
      amount: b.price || 0,
      type: b.status === 'cancelled' ? 'refund' : 'payment',
      status: b.status === 'completed' ? t('payment.paid')
        : b.status === 'cancelled' ? t('payment.refunded')
          : t('payment.pending'),
    }))

    const paid = mapped.filter((a: any) => a.status === t('payment.paid'))
    setTotalSpent(paid.reduce((s: number, p: any) => s + p.amount, 0))
    setAll(mapped)
    setLoading(false)
  }, [user])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const items = tab === 'All' ? all
    : tab === t('payment.payments') ? all.filter(a => a.type === 'payment')
      : all.filter(a => a.type === 'refund')

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    heroCard: { backgroundColor: NAVY, marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 20 },
    heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    heroAmt: { fontSize: 36, fontWeight: '900', color: '#FFF', marginVertical: 4 },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendTxt: { fontSize: 12, color: GOLD, fontWeight: '600' },
    tabRow: { flexDirection: 'row', backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    tabTxt: { fontSize: 13, fontWeight: '600' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    artisan: { fontSize: 12, color: NAVY, fontWeight: '600' },
    title: { fontSize: 14, fontWeight: '600', color: C.text },
    date: { fontSize: 11, color: C.textMuted, marginTop: 1 },
    amt: { fontSize: 15, fontWeight: '700' },
    status: { fontSize: 11, textAlign: 'right', marginTop: 2 },
    empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
    emptyTxt: { fontSize: 16, color: C.textSecondary, marginTop: 12, textAlign: 'center' },
    emptyIcon: { fontSize: 48 },
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
        {/* Hero total */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Total Spent</Text>
          <Text style={s.heroAmt}>₵{totalSpent.toFixed(0)}</Text>
          <View style={s.trendRow}>
            <TrendingUpIcon size={13} color={GOLD} />
            <Text style={s.trendTxt}>Across {all.filter(a => a.status === t('payment.paid')).length} completed bookings</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t}
              style={[s.tabBtn, { backgroundColor: tab === t ? NAVY : 'transparent' }]}
              onPress={() => setTab(t)}>
              <Text style={[s.tabTxt, { color: tab === t ? '#FFF' : C.textSecondary }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          contentContainerStyle={{ paddingBottom: 100 }}
          data={items}
          keyExtractor={i => i.id}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🧾</Text>
              <Text style={s.emptyTxt}>
                {loading ? 'Loading...' : t('payment.noTransactions')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.item}>
              <View style={s.iconWrap}>
                <Text style={{ fontSize: 20 }}>{item.type === 'refund' ? '↩️' : '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.artisan}>To {item.artisan}</Text>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.date}>{item.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.amt, {
                  color: item.type === 'refund' ? '#22C55E'
                    : item.status === t('payment.pending') ? '#F5A623'
                      : C.text
                }]}>
                  {item.type === 'refund' ? '+' : '-'}₵{item.amount}
                </Text>
                <Text style={[s.status, {
                  color: item.status === t('payment.paid') ? '#22C55E'
                    : item.status === t('payment.refunded') ? NAVY
                      : '#F5A623'
                }]}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}