// app/(customer)/booking-status.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, CheckCircleIcon, MapPinIcon, PhoneIcon, ChatIcon, StarIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const GOLD = '#FFB800'

const STEPS = [
    { key: 'pending', label: 'Booking Confirmed' },
    { key: 'confirmed', label: 'Artisan Heading to You' },
    { key: 'in_progress', label: 'Work in Progress' },
    { key: 'completed', label: 'Job Completed' },
    { key: 'released', label: 'Payment Released' },
]

export default function CustomerBookingStatus() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
    const router = useRouter()
    const { C } = useAppTheme()
    const [booking, setBooking] = useState<any>(null)

    useEffect(() => {
        supabase.from('bookings')
            .select('*, artisan_profiles:artisan_id(rating, total_reviews, trade_category, profiles:user_id(full_name, phone))')
            .eq('id', bookingId).single().then(({ data }) => setBooking(data))
    }, [bookingId])

    const currentStep = booking?.status === 'pending' ? 0 : booking?.status === 'confirmed' ? 1 : booking?.status === 'in_progress' ? 2 : booking?.status === 'completed' ? 3 : 4

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: {
            backgroundColor: NAVY, paddingHorizontal: 16,
            paddingTop: 8, paddingBottom: 16,
            flexDirection: 'row', alignItems: 'center', gap: 12,
        },
        backBtn: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
        },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        body: { flex: 1, backgroundColor: C.background },
        section: {
            backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
            borderRadius: 16, padding: 16,
        },
        bookingTitle: { fontSize: 16, fontWeight: '700', color: C.text },
        bookingId: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
        statusBadge: {
            alignSelf: 'flex-start', borderRadius: 6,
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: NAVY + '15', marginTop: 8,
        },
        statusTxt: { fontSize: 12, fontWeight: '700', color: NAVY, textTransform: 'uppercase' },
        sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 },
        stepRow: { flexDirection: 'row', marginBottom: 0 },
        stepCol: { alignItems: 'center', width: 28 },
        stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
        stepLine: { width: 2, height: 32, marginLeft: 13 },
        stepLabel: { fontSize: 14, fontWeight: '600' },
        stepTime: { fontSize: 11, color: C.textMuted, marginTop: 1 },
        infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
        infoTxt: { fontSize: 14, color: C.text },
        artRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
        avatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
        artName: { fontSize: 15, fontWeight: '700', color: C.text },
        artMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
        artMetaTxt: { fontSize: 12, color: C.textSecondary },
        iconBtns: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
        iconBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: C.border,
        },
        priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
        priceLabel: { fontSize: 14, color: C.textSecondary },
        priceVal: { fontSize: 18, fontWeight: '800', color: C.text },
        ctaBtn: {
            backgroundColor: NAVY, borderRadius: 14, paddingVertical: 14,
            alignItems: 'center', marginHorizontal: 16, marginTop: 14,
        },
        ctaTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    })

    if (!booking) return null
    const artisan = booking.artisan_profiles as any
    const artisanName = artisan?.profiles?.full_name || 'Artisan'

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Booking Status</Text>
            </View>
            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                {/* Info */}
                <View style={s.section}>
                    <Text style={s.bookingTitle}>{booking.title || booking.service_type}</Text>
                    <Text style={s.bookingId}>#{booking.id?.slice(0, 8).toUpperCase()}</Text>
                    <View style={s.statusBadge}><Text style={s.statusTxt}>{booking.status.replace('_', ' ')}</Text></View>
                </View>

                {/* Progress */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Tracking Progress</Text>
                    {STEPS.map((step, i) => {
                        const done = i <= currentStep
                        const isLast = i === STEPS.length - 1
                        return (
                            <View key={step.key} style={{ flexDirection: 'row' }}>
                                <View style={s.stepCol}>
                                    <View style={[s.stepCircle, { backgroundColor: done ? NAVY : C.border }]}>
                                        {done
                                            ? <CheckCircleIcon size={16} color="#FFF" />
                                            : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.border }} />
                                        }
                                    </View>
                                    {!isLast && <View style={[s.stepLine, { backgroundColor: i < currentStep ? NAVY : C.border }]} />}
                                </View>
                                <View style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 20 }}>
                                    <Text style={[s.stepLabel, { color: done ? C.text : C.textMuted }]}>{step.label}</Text>
                                    {done && <Text style={s.stepTime}>{new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}</Text>}
                                </View>
                            </View>
                        )
                    })}
                </View>

                {/* Location */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Location</Text>
                    <View style={s.infoRow}>
                        <MapPinIcon size={16} color={NAVY} />
                        <Text style={s.infoTxt}>{booking.address || 'No address'}</Text>
                    </View>
                </View>

                {/* Artisan */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Artisan</Text>
                    <View style={s.artRow}>
                        <View style={s.avatar}><Text style={s.avatarTxt}>{artisanName[0]}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.artName}>{artisanName}</Text>
                            <View style={s.artMeta}>
                                <StarIcon size={12} color={GOLD} fill={GOLD} />
                                <Text style={s.artMetaTxt}>{artisan?.rating || '0.0'} ({artisan?.total_reviews || 0})</Text>
                            </View>
                        </View>
                        <View style={s.iconBtns}>
                            <TouchableOpacity style={s.iconBtn}><PhoneIcon size={16} color={NAVY} /></TouchableOpacity>
                            <TouchableOpacity style={s.iconBtn} onPress={() => router.push({ pathname: '/(customer)/chat' as any, params: { bookingId: booking.id } })}><ChatIcon size={16} color={NAVY} /></TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Price */}
                <View style={s.section}>
                    <View style={s.priceRow}>
                        <Text style={s.priceLabel}>Price</Text>
                        <Text style={s.priceVal}>₵{booking.price}</Text>
                    </View>
                </View>

                {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                    <TouchableOpacity style={s.ctaBtn} onPress={() => router.push({ pathname: '/(customer)/tracking' as any, params: { bookingId: booking.id } })}>
                        <Text style={s.ctaTxt}>📍 Track Artisan Live</Text>
                    </TouchableOpacity>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}