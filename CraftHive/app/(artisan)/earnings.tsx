// app/(artisan)/earnings.tsx — FINAL
// Navy, useAppTheme, real DB data
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, TrendingUpIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

export default function ArtisanEarnings() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()

  const [stats, setStats] = useState({ gross: 0, total: 0, commission: 0, thisMonth: 0, thisWeek: 0, jobsCompleted: 0, pending: 0 })
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const { data: bks } = await supabase
      .from('bookings')
      .select('price, status, payment_status, scheduled_at, title, service_type, profiles:customer_id(full_name)')
      .eq('artisan_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (bks) {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      const monthAgo = new Date(now.getTime() - 30 * 86400000)
      
      // Only count jobs as 'completed earnings' if they are BOTH completed AND actually paid!
      const completed = bks.filter(b => b.status === 'completed' && b.payment_status === 'paid')
      // Pending escrow: Paid by customer, but job not completed yet
      const pending = bks.filter(b => b.payment_status === 'paid' && ['confirmed', 'in_progress', 'pending'].includes(b.status))

      // Platform takes 10% commission
      const COMMISSION = 0.10
      const gross = (price: number) => price || 0
      const net = (price: number) => Math.round((price || 0) * (1 - COMMISSION) * 100) / 100

      setStats({
        gross: completed.reduce((s, b) => s + gross(b.price), 0),
        total: completed.reduce((s, b) => s + net(b.price), 0),
        commission: completed.reduce((s, b) => s + gross(b.price) * COMMISSION, 0),
        thisMonth: completed.filter(b => new Date(b.scheduled_at) >= monthAgo).reduce((s, b) => s + net(b.price), 0),
        thisWeek: completed.filter(b => new Date(b.scheduled_at) >= weekAgo).reduce((s, b) => s + net(b.price), 0),
        jobsCompleted: completed.length,
        pending: pending.reduce((s, b) => s + net(b.price), 0),
      })
      
      // Pass the net function down to the history list
      setHistory(completed.slice(0, 20).map(b => ({ ...b, netPrice: net(b.price) })))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    heroCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 16, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
    heroLabel: { fontSize: 13, color: C.textSecondary, marginBottom: 6 },
    heroAmt: { fontSize: 44, fontWeight: '900', color: NAVY },
    heroSub: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 12 },
    statCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statNum: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 8 },
    statLbl: { fontSize: 11, color: C.textSecondary, marginTop: 3, textAlign: 'center' },
    pendingCard: { backgroundColor: GOLD + '20', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: GOLD + '50' },
    pendingTxt: { fontSize: 14, color: C.text, flex: 1 },
    pendingAmt: { fontSize: 16, fontWeight: '900', color: NAVY },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: C.text },
    histItem: { backgroundColor: C.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    histIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    histTitle: { fontSize: 14, fontWeight: '700', color: C.text },
    histSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    histAmt: { fontSize: 16, fontWeight: '900', color: '#16A34A' },
    emptyTxt: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 20 },
  })

  if (loading) return (
    <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
      <ActivityIndicator color={GOLD} size="large" />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Earnings</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}>

        {/* Total earnings hero */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Your Total Earnings (after 10% platform fee)</Text>
          <Text style={s.heroAmt}>₵{stats.total.toFixed(2)}</Text>
          <Text style={s.heroSub}>{stats.jobsCompleted} jobs · Gross ₵{stats.gross.toFixed(2)} · Platform fee ₵{stats.commission.toFixed(2)}</Text>
        </View>

        {/* This week / This month */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <CalendarIcon size={22} color={NAVY} />
            <Text style={s.statNum}>₵{stats.thisWeek}</Text>
            <Text style={s.statLbl}>This Week</Text>
          </View>
          <View style={s.statCard}>
            <TrendingUpIcon size={22} color={NAVY} />
            <Text style={s.statNum}>₵{stats.thisMonth}</Text>
            <Text style={s.statLbl}>This Month</Text>
          </View>
        </View>

        {/* Pending */}
        {stats.pending > 0 && (
          <View style={s.pendingCard}>
            <ClockIcon size={20} color={NAVY} />
            <Text style={s.pendingTxt}>Pending (in active jobs)</Text>
            <Text style={s.pendingAmt}>₵{stats.pending}</Text>
          </View>
        )}

        {/* Payout button */}
        <View style={{ marginHorizontal: 16, marginTop: 14 }}>
          <TouchableOpacity
            style={{ backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
            onPress={() => router.push('/(artisan)/payout-methods' as any)}>
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Manage Payout Methods</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Payment History</Text>
        </View>
        {history.length === 0
          ? <Text style={s.emptyTxt}>No completed jobs yet</Text>
          : history.map(b => (
            <View key={b.id || b.scheduled_at} style={s.histItem}>
              <View style={s.histIconWrap}><CheckCircleIcon size={20} color={NAVY} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.histTitle} numberOfLines={1}>{b.title || b.service_type}</Text>
                <Text style={s.histSub}>{(b.profiles as any)?.full_name || 'Customer'} · {fmtDate(b.scheduled_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.histAmt}>+₵{b.netPrice || 0}</Text>
                <Text style={{ fontSize: 10, color: C.textSecondary, marginTop: 2 }}>Gross: ₵{b.price}</Text>
              </View>
            </View>
          ))
        }
        <View style={{ height: 100 }} />
      </ScrollView>
      <AudioFAB pageText={`Earnings. Total GHC ${stats.total}. This month GHC ${stats.thisMonth}. ${stats.jobsCompleted} jobs completed.`} />
    </SafeAreaView>
  )
}