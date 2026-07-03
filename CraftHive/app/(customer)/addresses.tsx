// app/(customer)/addresses.tsx — FINAL
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
import { useLang } from '../../src/context/LanguageContext'
import { ArrowLeftIcon, MapPinIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const LABELS = ['Home', 'Work', 'School', 'Other']

export default function CustomerAddresses() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()
  const { t } = useLang()

  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [label, setLabel] = useState('Home')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('addresses').select('*')
      .eq('user_id', user?.id)
      .order('is_default', { ascending: false })
    setAddresses(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null); setLabel('Home'); setAddress(''); setCity('')
    setModal(true)
  }

  const openEdit = (item: any) => {
    setEditing(item); setLabel(item.label); setAddress(item.address); setCity(item.city || '')
    setModal(true)
  }

  const save = async () => {
    if (!address.trim()) { Alert.alert('Required', 'Enter an address.'); return }
    setSaving(true)
    if (editing) {
      await supabase.from('addresses').update({ label, address: address.trim(), city: city.trim() || null }).eq('id', editing.id)
    } else {
      await supabase.from('addresses').insert({ user_id: user?.id, label, address: address.trim(), city: city.trim() || null, is_default: addresses.length === 0 })
    }
    setSaving(false); setModal(false); load()
  }

  const setDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user?.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    load()
  }

  const remove = (id: string) => Alert.alert('Delete Address', 'Remove this address?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('addresses').delete().eq('id', id); load() } },
  ])

  const LABEL_ICONS: Record<string, string> = { Home: '🏠', Work: '🏢', School: '🎓', Other: '📍' }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, backgroundColor: C.background },
    card: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    iconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    iconTxt: { fontSize: 22 },
    info: { flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    labelTxt: { fontSize: 15, fontWeight: '800', color: C.text },
    defaultBadge: { backgroundColor: NAVY + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    defaultTxt: { fontSize: 11, color: NAVY, fontWeight: '700' },
    addrTxt: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
    cityTxt: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyTxt: { fontSize: 15, color: C.textSecondary, marginTop: 12 },
    emptyTxt2: { fontSize: 13, color: C.textMuted, marginTop: 6 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    labelsRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
    labelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
    labelBtnTxt: { fontSize: 14, fontWeight: '600' },
    lbl: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
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
        <Text style={s.headerTitle}>My Addresses</Text>
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
          data={addresses}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <MapPinIcon size={48} color={C.textMuted} />
              <Text style={s.emptyTxt}>No addresses saved</Text>
              <Text style={s.emptyTxt2}>Tap + to add your home or work address</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.iconWrap}><Text style={s.iconTxt}>{LABEL_ICONS[item.label] || '📍'}</Text></View>
              <View style={s.info}>
                <View style={s.labelRow}>
                  <Text style={s.labelTxt}>{item.label}</Text>
                  {item.is_default && <View style={s.defaultBadge}><Text style={s.defaultTxt}>Default</Text></View>}
                </View>
                <Text style={s.addrTxt}>{item.address}</Text>
                {item.city ? <Text style={s.cityTxt}>{item.city}</Text> : null}
              </View>
              <View style={s.actions}>
                {!item.is_default && (
                  <TouchableOpacity style={s.iconBtn} onPress={() => setDefault(item.id)}>
                    <CheckIcon size={14} color={NAVY} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}>
                  <EditIcon size={14} color={NAVY} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => remove(item.id)}>
                  <TrashIcon size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editing ? 'Edit Address' : t('addr.add')}</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setModal(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Label</Text>
            <View style={s.labelsRow}>
              {LABELS.map(l => (
                <TouchableOpacity key={l}
                  style={[s.labelBtn, { borderColor: label === l ? NAVY : C.border, backgroundColor: label === l ? NAVY : 'transparent' }]}
                  onPress={() => setLabel(l)}>
                  <Text style={[s.labelBtnTxt, { color: label === l ? '#FFF' : C.text }]}>
                    {LABEL_ICONS[l]} {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.lbl}>Street Address *</Text>
            <TextInput style={s.input} value={address} onChangeText={setAddress}
              placeholder="e.g. 14 Ring Road East" placeholderTextColor={C.textMuted} />
            <Text style={s.lbl}>City</Text>
            <TextInput style={[s.input, { marginBottom: 20 }]} value={city} onChangeText={setCity}
              placeholder="e.g. Accra" placeholderTextColor={C.textMuted} />
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Address</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}