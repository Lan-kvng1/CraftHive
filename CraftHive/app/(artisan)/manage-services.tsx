// app/(artisan)/manage-services.tsx — FINAL
import React, { useEffect, useState, useCallback } from 'react'
import {
    View, KeyboardAvoidingView, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, TextInput, Alert, Switch, ActivityIndicator,
} from 'react-native'
import { Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, PlusIcon, EditIcon, TrashIcon, XIcon, ToolIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'

export default function ManageServices() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { user } = useAuth()

    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<any>(null)
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [active, setActive] = useState(true)
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        const { data } = await supabase.from('artisan_services')
            .select('*').eq('artisan_id', user?.id).order('created_at', { ascending: false })
        setServices(data || [])
        setLoading(false)
    }, [user])

    useEffect(() => { load() }, [load])

    const openAdd = () => {
        setEditing(null); setName(''); setDesc(''); setMinPrice(''); setMaxPrice(''); setActive(true)
        setModal(true)
    }

    const openEdit = (item: any) => {
        setEditing(item); setName(item.name || ''); setDesc(item.description || '')
        setMinPrice(String(item.min_price || '')); setMaxPrice(String(item.max_price || ''))
        setActive(item.is_active !== false); setModal(true)
    }

    const save = async () => {
        if (!name.trim()) { Alert.alert('Required', 'Enter a service name.'); return }
        setSaving(true)
        const payload = {
            artisan_id: user?.id,
            name: name.trim(),
            description: desc.trim() || null,
            min_price: Number(minPrice) || 0,
            max_price: Number(maxPrice) || 0,
            is_active: active,
        }
        if (editing) {
            await supabase.from('artisan_services').update(payload).eq('id', editing.id)
        } else {
            await supabase.from('artisan_services').insert(payload)
        }
        setSaving(false); setModal(false); load()
    }

    const del = (id: string, name: string) => Alert.alert('Delete', `Remove "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Delete', style: 'destructive', onPress: async () => {
                await supabase.from('artisan_services').delete().eq('id', id); load()
            }
        },
    ])

    const toggle = async (id: string, current: boolean) => {
        await supabase.from('artisan_services').update({ is_active: !current }).eq('id', id)
        load()
    }

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        body: { flex: 1, backgroundColor: C.background },
        card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
        cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
        iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
        cardInfo: { flex: 1 },
        nameTxt: { fontSize: 15, fontWeight: '800', color: C.text },
        descTxt: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
        priceTxt: { fontSize: 13, color: NAVY, fontWeight: '700', marginTop: 4 },
        cardBtm: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
        iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
        iconsRow: { flexDirection: 'row', gap: 8 },
        emptyWrap: { alignItems: 'center', paddingTop: 80 },
        emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
        modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
        label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
        input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
        priceRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
        activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
        saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
        saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    })

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Services</Text>
                <TouchableOpacity style={s.addBtn} onPress={openAdd}>
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
                    data={services}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={s.emptyWrap}>
                            <ToolIcon size={48} color={C.textMuted} />
                            <Text style={s.emptyTxt}>No services added yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={s.card}>
                            <View style={s.cardTop}>
                                <View style={s.iconWrap}><ToolIcon size={20} color={NAVY} /></View>
                                <View style={s.cardInfo}>
                                    <Text style={s.nameTxt}>{item.name}</Text>
                                    {item.description ? <Text style={s.descTxt} numberOfLines={2}>{item.description}</Text> : null}
                                    <Text style={s.priceTxt}>₵{item.min_price} – ₵{item.max_price}</Text>
                                </View>
                            </View>
                            <View style={s.cardBtm}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Switch value={item.is_active !== false} onValueChange={() => toggle(item.id, item.is_active !== false)} trackColor={{ true: NAVY }} thumbColor="#FFF" />
                                    <Text style={{ fontSize: 13, color: C.textSecondary }}>{item.is_active !== false ? 'Active' : 'Inactive'}</Text>
                                </View>
                                <View style={s.iconsRow}>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}>
                                        <EditIcon size={14} color={NAVY} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => del(item.id, item.name)}>
                                        <TrashIcon size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}

            <Modal visible={modal} transparent animationType="slide">
                <View style={s.overlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editing ? 'Edit Service' : 'Add Service'}</Text>
                            <TouchableOpacity style={s.modalClose} onPress={() => setModal(false)}>
                                <XIcon size={16} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.label}>Service Name *</Text>
                        <TextInput style={s.input} value={name} onChangeText={setName}
                            placeholder="e.g. Furniture Repair" placeholderTextColor={C.textMuted} />
                        <Text style={s.label}>Description</Text>
                        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc}
                            placeholder="Describe this service..." placeholderTextColor={C.textMuted} multiline />
                        <Text style={s.label}>Price Range (₵)</Text>
                        <View style={s.priceRow}>
                            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={minPrice} onChangeText={setMinPrice}
                                placeholder="Min" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={maxPrice} onChangeText={setMaxPrice}
                                placeholder="Max" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                        </View>
                        <View style={[s.activeRow, { marginTop: 14 }]}>
                            <Text style={s.label}>Active (visible to customers)</Text>
                            <Switch value={active} onValueChange={setActive} trackColor={{ true: NAVY }} thumbColor="#FFF" />
                        </View>
                        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Service</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <AudioFAB pageText={`Manage services. ${services.length} services listed.`} />
        </SafeAreaView>
    )
}