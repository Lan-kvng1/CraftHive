// app/(artisan)/manage-booking.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { ArrowLeftIcon, CheckCircleIcon, PhoneIcon, ChatIcon } from '../../src/components/Icons'

const G = '#1B4332'
const STEPS = ['Pending', 'Confirmed', 'In Progress', 'Completed']

export default function ManageBooking() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
    const router = useRouter()
    const { C } = useAppTheme()
    const [booking, setBooking] = useState<any>(null)

    useEffect(() => {
        supabase.from('bookings').select('*, profiles:customer_id(full_name, phone)')
            .eq('id', bookingId).single().then(({ data }) => setBooking(data))
    }, [])

    const currentStep = booking?.status === 'pending' ? 0 : booking?.status === 'confirmed' ? 1 : booking?.status === 'in_progress' ? 2 : 3
    const nextStatus = ['confirmed', 'in_progress', 'completed']

    const advance = async () => {
        if (currentStep >= 3) return
        const ns = nextStatus[currentStep]
        await supabase.from('bookings').update({ status: ns }).eq('id', bookingId)
        setBooking((b: any) => ({ ...b, status: ns }))
    }

    const cancel = () => Alert.alert('Cancel Booking', 'This cannot be undone.', [
        { text: 'No', style: 'cancel' },
        {
            text: 'Cancel Booking', style: 'destructive', onPress: async () => {
                await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
                router.back()
            }
        },
    ])

    const statusColor = (s: string) => ({ pending: '#F5A623', confirmed: '#3E92CC', in_progress: G, completed: '#22C55E' }[s] || '#94A3B8')
    const btnLabel = ['Mark as Confirmed', 'Mark as In Progress', 'Mark as Completed', 'Completed'][currentStep]

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: G },
        header: {
            backgroundColor: G, paddingHorizontal: 16,
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
        card: {
            backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
            borderRadius: 16, padding: 16,
        },
        cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
        badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
        badgeTxt: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
        sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
        stepperRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
        stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
        stepLine: { flex: 1, height: 2 },
        infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
        infoLabel: { fontSize: 14, color: C.textSecondary },
        infoVal: { fontSize: 14, fontWeight: '600', color: C.text },
        customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: G, alignItems: 'center', justifyContent: 'center' },
        avatarTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
        custName: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
        custPhone: { fontSize: 12, color: C.textSecondary },
        iconBtns: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
        iconBtn: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: C.border,
        },
        noteTxt: { fontSize: 14, color: C.text, lineHeight: 20 },
        primaryBtn: {
            backgroundColor: G, borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', marginHorizontal: 16, marginTop: 16,
        },
        primaryTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
        dangerBtn: {
            borderRadius: 14, paddingVertical: 14, alignItems: 'center',
            marginHorizontal: 16, marginTop: 10, marginBottom: 20,
            borderWidth: 1.5, borderColor: '#EF4444',
        },
        dangerTxt: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
    })

    if (!booking) return null

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Manage Booking</Text>
            </View>
            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                {/* Status + Stepper */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>{booking.title || booking.service_type}</Text>
                    <View style={[s.badge, { backgroundColor: statusColor(booking.status) + '20', marginBottom: 14 }]}>
                        <Text style={[s.badgeTxt, { color: statusColor(booking.status) }]}>{booking.status.replace('_', ' ')}</Text>
                    </View>
                    <Text style={[s.sectionTitle, { marginBottom: 14 }]}>Progress</Text>
                    <View style={s.stepperRow}>
                        {STEPS.map((step, i) => (
                            <React.Fragment key={step}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={[s.stepCircle, { backgroundColor: i <= currentStep ? G : C.border }]}>
                                        {i < currentStep
                                            ? <CheckCircleIcon size={16} color="#FFF" />
                                            : <Text style={{ color: i === currentStep ? '#FFF' : C.textMuted, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                                        }
                                    </View>
                                </View>
                                {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < currentStep ? G : C.border }]} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Schedule */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Schedule</Text>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Date</Text>
                        <Text style={s.infoVal}>{new Date(booking.scheduled_at).toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Time</Text>
                        <Text style={s.infoVal}>{new Date(booking.scheduled_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Price</Text>
                        <Text style={[s.infoVal, { color: G, fontSize: 16 }]}>₵{booking.price}</Text>
                    </View>
                    {booking.address && (
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Location</Text>
                            <Text style={[s.infoVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{booking.address}</Text>
                        </View>
                    )}
                </View>

                {/* Notes */}
                {booking.notes && (
                    <View style={s.card}>
                        <Text style={s.sectionTitle}>Customer Note</Text>
                        <Text style={s.noteTxt}>{booking.notes}</Text>
                    </View>
                )}

                {/* Customer */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Customer</Text>
                    <View style={s.customerRow}>
                        <View style={s.avatar}>
                            <Text style={s.avatarTxt}>{(booking.profiles?.full_name || 'C')[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.custName}>{booking.profiles?.full_name}</Text>
                            <Text style={s.custPhone}>{booking.profiles?.phone}</Text>
                        </View>
                        <View style={s.iconBtns}>
                            <TouchableOpacity style={s.iconBtn}><PhoneIcon size={15} color={G} /></TouchableOpacity>
                            <TouchableOpacity style={s.iconBtn} onPress={() => router.push({ pathname: '/(artisan)/chat' as any, params: { bookingId: booking.id } })}>
                                <ChatIcon size={15} color={G} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {currentStep < 3 && (
                    <TouchableOpacity style={s.primaryBtn} onPress={advance}>
                        <Text style={s.primaryTxt}>{btnLabel}</Text>
                    </TouchableOpacity>
                )}
                {currentStep < 3 && (
                    <TouchableOpacity style={s.dangerBtn} onPress={cancel}>
                        <Text style={s.dangerTxt}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
                {currentStep >= 3 && <View style={{ height: 40 }} />}
            </ScrollView>
        </SafeAreaView>
    )
}