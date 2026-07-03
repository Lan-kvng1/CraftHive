// app/(artisan)/payout-methods.tsx — FINAL
import React, { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon, XIcon, CreditCardIcon, ShieldIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const TYPES = [
    { key: 'momo_mtn', label: 'MTN MoMo', icon: '📱', color: '#FFCC00' },
    { key: 'momo_voda', label: 'Vodafone Cash', icon: '📱', color: '#E60028' },
    { key: 'momo_airtel', label: 'AirtelTigo Money', icon: '📱', color: '#EF4444' },
    { key: 'bank', label: 'Bank Transfer', icon: '🏦', color: '#22C55E' },
    { key: 'ghipss', label: 'GhIPSS', icon: '💳', color: '#3B82F6' },
]

export default function PayoutMethods() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { user } = useAuth()
    const [methods, setMethods] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [selType, setSelType] = useState(TYPES[0].key)
    const [accName, setAccName] = useState('')
    const [accNum, setAccNum] = useState('')
    const [saving, setSaving] = useState(false)

    const load = async () => {
        const { data } = await supabase.from('payment_methods')
            .select('*').eq('user_id', user?.id).order('is_default', { ascending: false })
        setMethods(data || [])
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    const save = async () => {
        if (!accNum.trim()) { Alert.alert('Required', 'Enter your account number or phone.'); return }
        setSaving(true)
        const t = TYPES.find(x => x.key === selType)!
        await supabase.from('payment_methods').insert({
            user_id: user?.id, type: selType, provider: t.label,
            account_name: accName.trim() || null, account_number: accNum.trim(),
            is_default: methods.length === 0,
        })
        setSaving(false); setModal(false); load()
    }

    const setDefault = async (id: string) => {
        await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user?.id)
        await supabase.from('payment_methods').update({ is_default: true }).eq('id', id)
        load()
    }

    const remove = (id: string) => Alert.alert('Remove', 'Remove this payout method?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => { await supabase.from('payment_methods').delete().eq('id', id); load() } },
    ])

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        body: { flex: 1, backgroundColor: C.background },
        card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
        iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
        iconTxt: { fontSize: 26 },
        info: { flex: 1 },
        typeTxt: { fontSize: 15, fontWeight: '800', color: C.text },
        numTxt: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
        defaultBadge: { backgroundColor: NAVY + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
        defaultTxt: { fontSize: 11, color: NAVY, fontWeight: '700' },
        actions: { flexDirection: 'row', gap: 8 },
        iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
        addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: NAVY, borderStyle: 'dashed' },
        addNewTxt: { color: NAVY, fontSize: 15, fontWeight: '700' },
        secNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 16 },
        secTxt: { fontSize: 12, color: C.textSecondary, flex: 1, lineHeight: 17 },
        emptyWrap: { alignItems: 'center', paddingTop: 80 },
        emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
        modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
        modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
        typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
        typeBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
        typeBtnTxt: { fontSize: 13, fontWeight: '600' },
        label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
        input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
        saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
        saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    })

    const mask = (n: string) => n.length <= 4 ? n : '•••• ' + n.slice(-4)

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Payout Methods</Text>
                <TouchableOpacity style={s.addBtn} onPress={() => { setSelType(TYPES[0].key); setAccName(''); setAccNum(''); setModal(true) }}>
                    <PlusIcon size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
                    <ActivityIndicator color={NAVY} />
                </View>
            ) : (
                <FlatList
                    style={s.body}
                    data={methods}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={s.emptyWrap}>
                            <CreditCardIcon size={48} color={C.textMuted} />
                            <Text style={s.emptyTxt}>No payout methods added</Text>
                        </View>
                    }
                    ListFooterComponent={
                        <View>
                            <TouchableOpacity style={s.addNewBtn} onPress={() => { setSelType(TYPES[0].key); setAccName(''); setAccNum(''); setModal(true) }}>
                                <PlusIcon size={18} color={NAVY} />
                                <Text style={s.addNewTxt}>Add Payout Method</Text>
                            </TouchableOpacity>
                            <View style={s.secNote}>
                                <ShieldIcon size={16} color={NAVY} />
                                <Text style={s.secTxt}>Your payout details are encrypted and stored securely.</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const t = TYPES.find(x => x.key === item.type)
                        return (
                            <View style={s.card}>
                                <View style={[s.iconWrap, { backgroundColor: (t?.color || NAVY) + '18' }]}>
                                    <Text style={s.iconTxt}>{t?.icon || '💳'}</Text>
                                </View>
                                <View style={s.info}>
                                    <Text style={s.typeTxt}>{t?.label || item.provider}</Text>
                                    <Text style={s.numTxt}>{mask(item.account_number)}</Text>
                                    {item.account_name ? <Text style={{ fontSize: 12, color: C.textMuted }}>{item.account_name}</Text> : null}
                                    {item.is_default && <View style={s.defaultBadge}><Text style={s.defaultTxt}>Default</Text></View>}
                                </View>
                                <View style={s.actions}>
                                    {!item.is_default && (
                                        <TouchableOpacity style={s.iconBtn} onPress={() => setDefault(item.id)}>
                                            <CheckIcon size={14} color={NAVY} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={s.iconBtn} onPress={() => remove(item.id)}>
                                        <TrashIcon size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    }}
                />
            )}

            <Modal visible={modal} transparent animationType="slide">
                <View style={s.overlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Add Payout Method</Text>
                            <TouchableOpacity style={s.modalClose} onPress={() => setModal(false)}>
                                <XIcon size={16} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.label}>Select Type</Text>
                        <View style={s.typesGrid}>
                            {TYPES.map(t => (
                                <TouchableOpacity key={t.key}
                                    style={[s.typeBtn, { borderColor: selType === t.key ? NAVY : C.border, backgroundColor: selType === t.key ? NAVY : 'transparent' }]}
                                    onPress={() => setSelType(t.key)}>
                                    <Text>{t.icon}</Text>
                                    <Text style={[s.typeBtnTxt, { color: selType === t.key ? '#FFF' : C.text }]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={s.label}>{selType.startsWith('momo') ? 'Phone Number' : 'Account Number'} *</Text>
                        <TextInput style={s.input} value={accNum} onChangeText={setAccNum}
                            placeholder={selType.startsWith('momo') ? '024 XXX XXXX' : 'Account number'}
                            placeholderTextColor={C.textMuted}
                            keyboardType={selType.startsWith('momo') ? 'phone-pad' : 'default'} />
                        <Text style={s.label}>Account Name</Text>
                        <TextInput style={[s.input, { marginBottom: 20 }]} value={accName} onChangeText={setAccName}
                            placeholder="Name on account" placeholderTextColor={C.textMuted} autoCapitalize="words" />
                        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Add Method</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <AudioFAB pageText={`Payout methods. ${methods.length} methods saved.`} />
        </SafeAreaView>
    )
}