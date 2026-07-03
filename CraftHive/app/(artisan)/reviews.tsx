// app/(artisan)/reviews.tsx — FINAL
// Shows all reviews received by the artisan
import React, { useEffect, useState, useCallback } from 'react'
import {
    View, Text, StyleSheet, FlatList,
    RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, StarIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

export default function ArtisanReviews() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { user } = useAuth()

    const [reviews, setReviews] = useState<any[]>([])
    const [stats, setStats] = useState({ avg: 0, total: 0, breakdown: [0, 0, 0, 0, 0] })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const load = async () => {
        let res = await supabase
            .from('reviews')
            .select('*')
            .eq('artisan_id', user?.id)
            .neq('status', 'flagged')
            .order('created_at', { ascending: false })

        if (res.error && res.error.message.includes('column') && res.error.message.includes('status')) {
            res = await supabase
                .from('reviews')
                .select('*')
                .eq('artisan_id', user?.id)
                .order('created_at', { ascending: false })
        }
        const data = res.data

        if (data) {
            // Fetch reviewer profiles separately to avoid FK ambiguity
            const reviewerIds = [...new Set(data.map((r: any) => r.reviewer_id).filter(Boolean))]
            let profileMap: Record<string, any> = {}
            if (reviewerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles').select('id, full_name, avatar_url')
                    .in('id', reviewerIds)
                profiles?.forEach((p: any) => { profileMap[p.id] = p })
            }
            const enriched = data.map((r: any) => ({ ...r, profiles: profileMap[r.reviewer_id] || null }))
            const total = enriched.length
            const avg = total > 0 ? enriched.reduce((s: number, r: any) => s + r.rating, 0) / total : 0
            const breakdown = [5, 4, 3, 2, 1].map(n => enriched.filter((r: any) => r.rating === n).length)
            setStats({ avg, total, breakdown })
            setReviews(enriched)
        }
        setLoading(false)
    }

    useFocusEffect(useCallback(() => { load() }, []))

    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' })

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        body: { flex: 1, backgroundColor: C.background },
        summaryCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 16, borderRadius: 22, padding: 20 },
        summaryRow: { flexDirection: 'row', gap: 20, alignItems: 'center', marginBottom: 16 },
        avgNum: { fontSize: 52, fontWeight: '900', color: NAVY },
        starsRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
        totalTxt: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
        breakdown: { flex: 1, gap: 6 },
        barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        barLabel: { fontSize: 12, color: C.textSecondary, width: 12, textAlign: 'right' },
        barBg: { flex: 1, height: 7, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
        barFill: { height: '100%', backgroundColor: GOLD, borderRadius: 4 },
        barCount: { fontSize: 11, color: C.textMuted, width: 20 },
        reviewItem: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 10, borderRadius: 18, padding: 16 },
        reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
        reviewAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
        reviewAvatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
        reviewerName: { fontSize: 14, fontWeight: '700', color: C.text },
        reviewDate: { fontSize: 11, color: C.textMuted, marginTop: 2 },
        reviewStars: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
        commentTxt: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },
        emptyWrap: { alignItems: 'center', paddingTop: 60 },
        emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
        emptyTxt2: { fontSize: 13, color: C.textMuted, marginTop: 6, textAlign: 'center' },
    })

    const maxBreakdown = Math.max(...stats.breakdown, 1)

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Reviews</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
                    <ActivityIndicator color={NAVY} size="large" />
                </View>
            ) : (
                <FlatList
                    style={s.body}
                    data={reviews}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={NAVY} />}
                    ListHeaderComponent={
                        <View style={s.summaryCard}>
                            <View style={s.summaryRow}>
                                {/* Average score */}
                                <View>
                                    <Text style={s.avgNum}>{stats.avg > 0 ? stats.avg.toFixed(1) : '—'}</Text>
                                    <View style={s.starsRow}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <StarIcon key={n} size={16} color={GOLD} fill={n <= Math.round(stats.avg) ? GOLD : 'none'} />
                                        ))}
                                    </View>
                                    <Text style={s.totalTxt}>{stats.total} review{stats.total !== 1 ? 's' : ''}</Text>
                                </View>
                                {/* Breakdown bars */}
                                <View style={s.breakdown}>
                                    {[5, 4, 3, 2, 1].map((star, i) => (
                                        <View key={star} style={s.barRow}>
                                            <Text style={s.barLabel}>{star}</Text>
                                            <View style={s.barBg}>
                                                <View style={[s.barFill, { width: `${(stats.breakdown[i] / maxBreakdown) * 100}%` }]} />
                                            </View>
                                            <Text style={s.barCount}>{stats.breakdown[i]}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={s.emptyWrap}>
                            <StarIcon size={52} color={C.textMuted} />
                            <Text style={s.emptyTxt}>No reviews yet</Text>
                            <Text style={s.emptyTxt2}>Complete jobs and customers will leave reviews here</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const reviewer = (item.profiles as any)
                        const name = reviewer?.full_name || 'Customer'
                        return (
                            <View style={s.reviewItem}>
                                <View style={s.reviewTop}>
                                    <View style={s.reviewAvatar}>
                                        <Text style={s.reviewAvatarTxt}>{name[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.reviewerName}>{name}</Text>
                                        <Text style={s.reviewDate}>{fmtDate(item.created_at)}</Text>
                                    </View>
                                    <View style={s.reviewStars}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <StarIcon key={n} size={14} color={GOLD} fill={n <= item.rating ? GOLD : 'none'} />
                                        ))}
                                    </View>
                                </View>
                                {item.comment && <Text style={s.commentTxt}>{item.comment}</Text>}
                            </View>
                        )
                    }}
                />
            )}
            <AudioFAB pageText={`Reviews. ${stats.avg > 0 ? stats.avg.toFixed(1) : 'No'} average rating from ${stats.total} reviews.`} />
        </SafeAreaView>
    )
}