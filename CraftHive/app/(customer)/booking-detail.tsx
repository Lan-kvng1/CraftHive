// app/(customer)/booking-detail.tsx
import React, { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, Linking, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import MapView, { Marker, PROVIDER_GOOGLE } from '../../src/components/Map'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import {
    ArrowLeftIcon, MapPinIcon, PhoneIcon,
    ChatIcon, StarIcon, CheckCircleIcon,
} from '../../src/components/Icons'
import AudioFAB from '../../src/components/AudioFAB'
import Avatar from '../../src/components/Avatar'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ''

export default function CustomerBookingDetail() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
    const router = useRouter()
    const { C } = useAppTheme()
    const { t } = useLang()

    const [booking, setBooking] = useState<any>(null)
    const [hasReview, setHasReview] = useState(false)
    const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null)

    // ── Load booking ─────────────────────────────────────────
    useEffect(() => {
        if (!bookingId) return
        const load = async () => {
            const { data: b } = await supabase.from('bookings')
                .select('*, artisan_profiles:artisan_id(*, rating, total_reviews, trade_category, user_id)')
                .eq('id', bookingId).single()

            if (b?.artisan_id) {
                const { data: p } = await supabase.from('profiles')
                    .select('full_name, phone, avatar_url').eq('id', b.artisan_id).single()
                if (b.artisan_profiles) b.artisan_profiles.profiles = p || null
            }

            // Also check payments table in case payment_status column not updated
            if (b && !b.payment_status) {
                const { data: pmt } = await supabase.from('payments')
                    .select('status').eq('booking_id', bookingId)
                    .in('status', ['held', 'released']).maybeSingle()
                if (pmt) b.payment_status = 'paid'
            }

            setBooking(b)

            if (b?.status === 'completed') {
                const { data: rv } = await supabase.from('reviews')
                    .select('id').eq('booking_id', bookingId).maybeSingle()
                setHasReview(!!rv)
            }
        }
        load()
    }, [bookingId])

    // ── Geocode address → coords for inline map ──────────────
    useEffect(() => {
        if (!booking?.address) return
        const geocode = async () => {
            // Try Google Geocoding API first
            if (GMAPS_KEY) {
                try {
                    const res = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(booking.address)}&key=${GMAPS_KEY}`
                    )
                    const json = await res.json()
                    if (json.results?.[0]) {
                        const { lat, lng } = json.results[0].geometry.location
                        setDestCoords({ latitude: lat, longitude: lng })
                        return
                    }
                } catch { }
            }
            // Fallback: use Nominatim (no key needed, good for Ghana addresses)
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(booking.address)}&format=json&limit=1`,
                    { headers: { 'User-Agent': 'CraftHive/1.0' } }
                )
                const json = await res.json()
                if (json?.[0]) {
                    setDestCoords({ latitude: parseFloat(json[0].lat), longitude: parseFloat(json[0].lon) })
                }
            } catch { }
        }
        geocode()
    }, [booking?.address])

    // ── Helpers ───────────────────────────────────────────────
    const cancelBooking = () => Alert.alert('Cancel Booking', 'Are you sure?', [
        { text: 'No', style: 'cancel' },
        {
            text: 'Cancel', style: 'destructive', onPress: async () => {
                await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
                setBooking((b: any) => ({ ...b, status: 'cancelled' }))
            }
        },
    ])

    const statusColor = (s: string) => ({
        pending: '#F5A623', confirmed: '#3E92CC',
        in_progress: NAVY, completed: '#22C55E', cancelled: '#EF4444',
    }[s] || '#94A3B8')

    const openPhone = () => {
        const phone = booking?.artisan_profiles?.profiles?.phone
        if (phone) Linking.openURL(`tel:${phone}`)
    }

    // ── Loading state ─────────────────────────────────────────
    if (!booking) return (
        <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
            <StatusBar style="light" />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 16, opacity: 0.7 }}>Loading booking...</Text>
            </View>
        </SafeAreaView>
    )

    const artisan = booking.artisan_profiles
    const artisanName = artisan?.profiles?.full_name || 'Artisan'
    const sc = statusColor(booking.status)

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
        topCard: {
            backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
            borderRadius: 20, padding: 20,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
        },
        badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
        badgeTxt: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
        jobTitle: { fontSize: 20, fontWeight: '900', color: C.text, marginBottom: 4 },
        jobId: { fontSize: 12, color: C.textMuted },
        jobDate: { fontSize: 13, color: C.textSecondary, marginTop: 8 },
        priceRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border,
        },
        priceLabel: { fontSize: 14, color: C.textSecondary },
        priceVal: { fontSize: 22, fontWeight: '900', color: C.text },
        section: {
            backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
            borderRadius: 18, overflow: 'hidden',
        },
        sectionInner: { padding: 18 },
        sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
        infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
        infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
        infoLabel: { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
        infoVal: { fontSize: 14, color: C.text, marginTop: 2 },
        // Inline map
        mapContainer: {
            height: 180, marginHorizontal: 16, marginTop: 12,
            borderRadius: 18, overflow: 'hidden',
        },
        map: { flex: 1 },
        mapOverlay: {
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(10,36,99,0.82)',
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 14, paddingVertical: 10,
        },
        mapOverlayTxt: { flex: 1, fontSize: 13, color: '#FFF', fontWeight: '600' },
        mapTrackBtn: {
            backgroundColor: GOLD, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 6,
        },
        mapTrackBtnTxt: { fontSize: 12, fontWeight: '800', color: NAVY },
        mapNoCoords: {
            height: 180, marginHorizontal: 16, marginTop: 12,
            borderRadius: 18, backgroundColor: C.card,
            alignItems: 'center', justifyContent: 'center', gap: 8,
            borderWidth: 1, borderColor: C.border,
        },
        artRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
        artAvatar: {
            width: 52, height: 52, borderRadius: 16,
            backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
        },
        artAvatarTxt: { color: '#FFF', fontWeight: '800', fontSize: 18 },
        artName: { fontSize: 16, fontWeight: '700', color: C.text },
        artTrade: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
        artRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
        artRatingTxt: { fontSize: 12, color: C.textSecondary },
        artBtns: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
        circleBtn: {
            width: 40, height: 40, borderRadius: 14,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: NAVY, backgroundColor: NAVY + '0D',
        },
        reviewCard: {
            backgroundColor: GOLD + '18', marginHorizontal: 16, marginTop: 12,
            borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: GOLD,
            flexDirection: 'row', alignItems: 'center', gap: 14,
        },
        reviewTitle: { fontSize: 15, fontWeight: '800', color: C.text },
        reviewSub: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
        reviewBtn: {
            backgroundColor: GOLD, borderRadius: 12,
            paddingHorizontal: 16, paddingVertical: 10,
        },
        reviewBtnTxt: { fontSize: 13, fontWeight: '800', color: '#1A202C' },
        reviewedBadge: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: '#22C55E20', borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 8,
            alignSelf: 'flex-start', borderWidth: 1, borderColor: '#22C55E',
            marginHorizontal: 16, marginTop: 12,
        },
        reviewedTxt: { fontSize: 13, color: '#22C55E', fontWeight: '700' },
        primaryBtn: {
            backgroundColor: NAVY, borderRadius: 16, paddingVertical: 16,
            alignItems: 'center', marginHorizontal: 16, marginTop: 14,
            flexDirection: 'row', justifyContent: 'center', gap: 8,
        },
        primaryTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
        cancelBtn: {
            borderRadius: 16, paddingVertical: 14, alignItems: 'center',
            marginHorizontal: 16, marginTop: 10,
            borderWidth: 1.5, borderColor: '#EF4444',
        },
        cancelTxt: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
    })

    const canTrack = booking.status === 'confirmed' || booking.status === 'in_progress'

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Booking Details</Text>
            </View>

            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

                {/* ── Summary card ── */}
                <View style={s.topCard}>
                    <View style={[s.badge, { backgroundColor: sc + '20' }]}>
                        <Text style={[s.badgeTxt, { color: sc }]}>{booking.status.replace('_', ' ')}</Text>
                    </View>
                    <Text style={s.jobTitle}>{booking.title || booking.service_type || 'Service Booking'}</Text>
                    <Text style={s.jobDate}>
                        📅 {booking.scheduled_at
                            ? new Date(booking.scheduled_at).toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Date TBC'}
                        {booking.scheduled_at && ' · ' + new Date(booking.scheduled_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <View style={s.priceRow}>
                        <Text style={s.priceLabel}>Total</Text>
                        <Text style={s.priceVal}>{booking.price ? `₵${booking.price}` : 'To be quoted'}</Text>
                    </View>
                </View>

                {/* ── Inline map (no browser) ── */}
                {destCoords ? (
                    <View style={s.mapContainer}>
                        <MapView
                            style={s.map}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={{
                                ...destCoords,
                                latitudeDelta: 0.008,
                                longitudeDelta: 0.008,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                        >
                            <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 1 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 3 }}>
                                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>📍 Job Site</Text>
                                    </View>
                                    <View style={{ width: 2, height: 6, backgroundColor: NAVY }} />
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: NAVY }} />
                                </View>
                            </Marker>
                        </MapView>
                        {/* Overlay sits on top of map — captures taps that MapView would absorb */}
                        <TouchableOpacity
                            style={StyleSheet.absoluteFillObject}
                            activeOpacity={canTrack ? 0.15 : 1}
                            onPress={() => {
                                if (canTrack) {
                                    router.push({ pathname: '/(customer)/tracking' as any, params: { bookingId: booking.id } })
                                }
                            }}
                        />
                        <View style={s.mapOverlay} pointerEvents="none">
                            <MapPinIcon size={14} color="#FFF" />
                            <Text style={s.mapOverlayTxt} numberOfLines={1}>{booking.address}</Text>
                            {canTrack && (
                                <View style={s.mapTrackBtn}>
                                    <Text style={s.mapTrackBtnTxt}>Track Live →</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    // Address exists but geocoding in progress / failed
                    booking.address ? (
                        <View style={s.mapNoCoords}>
                            <Text style={{ fontSize: 28 }}>📍</Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{booking.address}</Text>
                            <Text style={{ fontSize: 12, color: C.textSecondary }}>Map loading...</Text>
                        </View>
                    ) : null
                )}

                {/* ── Location + notes ── */}
                <View style={s.section}>
                    <View style={s.sectionInner}>
                        <Text style={s.sectionTitle}>Job Details</Text>
                        <View style={s.infoRow}>
                            <View style={s.infoIconWrap}><MapPinIcon size={17} color={NAVY} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.infoLabel}>Address</Text>
                                <Text style={s.infoVal}>{booking.address || 'No address provided'}</Text>
                            </View>
                        </View>
                        {booking.description && (
                            <View style={s.infoRow}>
                                <View style={s.infoIconWrap}><Text style={{ fontSize: 17 }}>📝</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.infoLabel}>Notes</Text>
                                    <Text style={s.infoVal}>{booking.description}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Artisan ── */}
                <View style={s.section}>
                    <View style={s.sectionInner}>
                        <Text style={s.sectionTitle}>Artisan</Text>
                        <View style={s.artRow}>
                            <Avatar
                                uri={artisan?.profiles?.avatar_url}
                                name={artisanName}
                                size={52}
                                radius={16}
                            />
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={s.artName}>{artisanName}</Text>
                                    <CheckCircleIcon size={14} color={NAVY} />
                                </View>
                                <Text style={s.artTrade}>{artisan?.trade_category}</Text>
                                <View style={s.artRating}>
                                    <StarIcon size={12} color={GOLD} fill={GOLD} />
                                    <Text style={s.artRatingTxt}>{artisan?.rating || '0.0'} ({artisan?.total_reviews || 0})</Text>
                                </View>
                            </View>
                            <View style={s.artBtns}>
                                <TouchableOpacity style={s.circleBtn} onPress={openPhone}>
                                    <PhoneIcon size={18} color={NAVY} />
                                </TouchableOpacity>
                                <TouchableOpacity style={s.circleBtn}
                                    onPress={() => router.push({ pathname: '/(customer)/chat' as any, params: { bookingId: booking.id, otherName: artisanName } })}>
                                    <ChatIcon size={18} color={NAVY} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Review CTA ── */}
                {booking.status === 'completed' && (
                    hasReview ? (
                        <View style={s.reviewedBadge}>
                            <StarIcon size={16} color="#22C55E" fill="#22C55E" />
                            <Text style={s.reviewedTxt}>Review submitted — thank you!</Text>
                        </View>
                    ) : (
                        <View style={s.reviewCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.reviewTitle}>How was the service?</Text>
                                <Text style={s.reviewSub}>Rate {artisanName} and help others.</Text>
                            </View>
                            <TouchableOpacity style={s.reviewBtn}
                                onPress={() => router.push({ pathname: '/(customer)/review' as any, params: { bookingId: booking.id } })}>
                                <Text style={s.reviewBtnTxt}>⭐ Rate</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}

                {/* ── Track Live button (for confirmed/in_progress) ── */}
                {canTrack && (
                    <TouchableOpacity style={s.primaryBtn}
                        onPress={() => router.push({ pathname: '/(customer)/tracking' as any, params: { bookingId: booking.id } })}>
                        <Text style={{ fontSize: 18 }}>📍</Text>
                        <Text style={s.primaryTxt}>Track Artisan Live</Text>
                    </TouchableOpacity>
                )}

                {/* ── Payment button — only show if not paid and not cancelled ── */}
                {booking.price && booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                    <TouchableOpacity style={s.primaryBtn}
                        onPress={() => router.push({ pathname: '/(customer)/payment' as any, params: { bookingId: booking.id } })}>
                        <Text style={{ fontSize: 18 }}>💳</Text>
                        <Text style={s.primaryTxt}>Pay ₵{booking.price}</Text>
                    </TouchableOpacity>
                )}
                {booking.payment_status === 'paid' && (
                    <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#22C55E' }]}
                        onPress={() => router.push('/(customer)/payment-history' as any)}>
                        <Text style={{ fontSize: 18 }}>✅</Text>
                        <Text style={s.primaryTxt}>Payment Confirmed · View History</Text>
                    </TouchableOpacity>
                )}

                {/* ── Cancel ── */}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <TouchableOpacity style={s.cancelBtn} onPress={cancelBooking}>
                        <Text style={s.cancelTxt}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}

                {/* ── Dispute ── */}
                {(booking.status === 'completed' || booking.status === 'cancelled') && (
                    <TouchableOpacity style={[s.cancelBtn, { marginBottom: 20 }]}
                        onPress={() => router.push({ pathname: '/(customer)/dispute' as any, params: { bookingId: booking.id } })}>
                        <Text style={s.cancelTxt}>⚠️ Raise a Dispute</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            <AudioFAB pageText={`Booking details. ${booking.title || booking.service_type}. Status ${booking.status.replace('_', ' ')}. Artisan ${artisanName}. Price ${booking.price ? '₵' + booking.price : 'to be quoted'}.`} />
        </SafeAreaView>
    )
}