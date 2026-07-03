// app/(artisan)/portfolio.tsx
// Simple upload gallery — images with descriptions, and documents.
// No categories filter, no profile card, just their uploaded work.
import React, { useState, useCallback } from 'react'
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, TextInput, Alert, Modal, Dimensions,
    ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { supabase, getImageUrl } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import AudioFAB from '../../src/components/AudioFAB'
import SmartImage from '../../src/components/SmartImage'
import { ArrowLeftIcon, PlusIcon, XIcon, TrashIcon } from '../../src/components/Icons'
import { compressImage } from '../../src/utils/compressImage'
import { uploadToSupabase } from '../../src/utils/fileUpload'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const { width: W } = Dimensions.get('window')
const COL = (W - 40) / 2

interface ImageItem {
    id: string
    image_url: string
    title: string
    description: string
    created_at: string
}

interface DocItem {
    id: string
    name: string
    url: string
    type: string
    created_at: string
}

export default function ArtisanPortfolio() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { user } = useAuth()
    const { t } = useLang()

    const [images, setImages] = useState<ImageItem[]>([])
    const [docs, setDocs] = useState<DocItem[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'images' | 'docs'>('images')

    // View / edit image
    const [viewItem, setViewItem] = useState<ImageItem | null>(null)
    const [editItem, setEditItem] = useState<ImageItem | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editDesc, setEditDesc] = useState('')
    const [editSaving, setEditSaving] = useState(false)

    // Add image form
    const [addVisible, setAddVisible] = useState(false)
    const [newUri, setNewUri] = useState<string | null>(null)
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const [{ data: imgs }, { data: ds }] = await Promise.all([
            supabase.from('portfolio_items').select('id, image_url, title, description, created_at')
                .eq('artisan_id', user.id).order('created_at', { ascending: false }),
            supabase.from('portfolio_documents').select('*')
                .eq('artisan_id', user.id).order('created_at', { ascending: false }),
        ])
        setImages(imgs || [])
        setDocs(ds || [])
        setLoading(false)
    }, [user])

    useFocusEffect(useCallback(() => { load() }, [load]))

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.85,
        })
        if (!r.canceled && r.assets[0]) setNewUri(r.assets[0].uri)
    }

    const openEdit = (item: ImageItem) => {
        setEditItem(item); setEditTitle(item.title); setEditDesc(item.description || '')
        setViewItem(null)
    }

    const saveEdit = async () => {
        if (!editItem) return
        setEditSaving(true)
        await supabase.from('portfolio_items').update({
            title: editTitle.trim() || 'My Work',
            description: editDesc.trim(),
        }).eq('id', editItem.id)
        setImages(p => p.map(i => i.id === editItem.id
            ? { ...i, title: editTitle.trim() || 'My Work', description: editDesc.trim() }
            : i))
        setEditSaving(false); setEditItem(null)
    }

    const saveImage = async () => {
        if (!newUri) { Alert.alert('Required', 'Please select an image.'); return }
        setSaving(true)
        try {
            const comp = await compressImage({ uri: newUri })
            const path = `portfolio/${user?.id}/${Date.now()}.jpg`
            const publicUrl = await uploadToSupabase(comp.uri, 'portfolios', path, 'image/jpeg')
            if (!publicUrl) throw new Error('Upload failed')
            const { error } = await supabase.from('portfolio_items').insert({
                artisan_id: user?.id,
                image_url: publicUrl,
                title: newTitle.trim() || 'My Work',
                description: newDesc.trim(),
                category: 'Other',
                status: 'completed',
            })
            if (error) throw error
            setAddVisible(false); setNewUri(null); setNewTitle(''); setNewDesc('')
            await load()
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Upload failed')
        } finally { setSaving(false) }
    }

    const deleteImage = (id: string) =>
        Alert.alert(t('common.delete'), 'Remove this image?', [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'), style: 'destructive', onPress: async () => {
                    await supabase.from('portfolio_items').delete().eq('id', id)
                    setViewItem(null)
                    setImages(p => p.filter(i => i.id !== id))
                }
            },
        ])

    const uploadDoc = async () => {
        try {
            const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true })
            if (r.canceled || !r.assets?.[0]) return
            const asset = r.assets[0]
            const path = `documents/${user?.id}/${Date.now()}_${asset.name}`
            const contentType = asset.mimeType || 'application/octet-stream'
            const publicUrl = await uploadToSupabase(asset.uri, 'portfolios', path, contentType)
            if (!publicUrl) throw new Error('Upload failed')
            const { error } = await supabase.from('portfolio_documents').insert({
                artisan_id: user?.id,
                name: asset.name,
                url: publicUrl,
                type: contentType,
            })
            if (error) throw error
            await load()
            Alert.alert('Uploaded ✓', `${asset.name} added.`)
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Upload failed')
        }
    }

    const deleteDoc = (id: string) =>
        Alert.alert(t('common.delete'), 'Remove this document?', [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'), style: 'destructive', onPress: async () => {
                    await supabase.from('portfolio_documents').delete().eq('id', id)
                    setDocs(p => p.filter(d => d.id !== id))
                }
            },
        ])

    const docEmoji = (type: string) =>
        type?.includes('pdf') ? '📄' : type?.includes('image') ? '🖼️'
            : type?.includes('word') ? '📝' : '📎'

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', flex: 1 },
        addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
        body: { flex: 1, backgroundColor: C.background },
        // Tabs
        tabRow: { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
        tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3 },
        tabTxt: { fontSize: 14, fontWeight: '700' },
        // Image grid
        grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4 },
        gridItem: { width: COL, borderRadius: 14, overflow: 'hidden', backgroundColor: C.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
        gridImg: { width: '100%', height: COL },
        gridCaption: { padding: 10 },
        gridTitle: { fontSize: 13, fontWeight: '700', color: C.text },
        gridDesc: { fontSize: 11, color: C.textSecondary, marginTop: 3, lineHeight: 16 },
        gridDate: { fontSize: 10, color: C.textMuted, marginTop: 4 },
        // Doc list
        docCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: C.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
        docIconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
        docName: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
        docDate: { fontSize: 11, color: C.textMuted, marginTop: 3 },
        delBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
        // Empty
        empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
        emptyIcon: { fontSize: 56, marginBottom: 16 },
        emptyTxt: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
        emptySub: { fontSize: 13, color: C.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
        emptyBtn: { marginTop: 20, backgroundColor: NAVY, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
        emptyBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
        // Add image modal
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 40, maxHeight: '90%' },
        sheetHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
        sheetTitle: { fontSize: 20, fontWeight: '900', color: C.text },
        imgPicker: { width: '100%', height: 200, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border, borderStyle: 'dashed', overflow: 'hidden', marginBottom: 16 },
        lbl: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6, marginTop: 12 },
        inp: { backgroundColor: C.surface, borderRadius: 12, padding: 14, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
        saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
        saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
        // Full view modal
        fullOverlay: { flex: 1, backgroundColor: '#000' },
        fullImg: { width: W, height: W },
        fullBody: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
        fullTitle: { fontSize: 20, fontWeight: '900', color: C.text },
        fullDesc: { fontSize: 14, color: C.text, lineHeight: 22, marginTop: 10 },
        fullDate: { fontSize: 12, color: C.textMuted, marginTop: 8 },
        closeBtn: { position: 'absolute', top: 48, right: 14, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
        fullDelBtn: { position: 'absolute', top: 48, left: 14, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,38,38,0.8)', alignItems: 'center', justifyContent: 'center' },
    })

    const fmtDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Portfolio</Text>
                <TouchableOpacity style={s.addBtn}
                    onPress={tab === 'images' ? () => setAddVisible(true) : uploadDoc}>
                    <PlusIcon size={18} color={NAVY} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={s.tabRow}>
                {(['images', 'docs'] as const).map(t => (
                    <TouchableOpacity key={t} style={[s.tabBtn, { borderBottomColor: tab === t ? NAVY : 'transparent' }]}
                        onPress={() => setTab(t)}>
                        <Text style={[s.tabTxt, { color: tab === t ? NAVY : C.textSecondary }]}>
                            {t === 'images' ? `Photos (${images.length})` : `Documents (${docs.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.body}>
                {loading ? (
                    <View style={s.empty}><ActivityIndicator color={NAVY} size="large" /></View>
                ) : tab === 'images' ? (
                    images.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📷</Text>
                            <Text style={s.emptyTxt}>No photos yet</Text>
                            <Text style={s.emptySub}>Upload photos of your completed work to showcase your skills to customers</Text>
                            <TouchableOpacity style={s.emptyBtn} onPress={() => setAddVisible(true)}>
                                <Text style={s.emptyBtnTxt}>+ Upload Your First Photo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={s.grid}>
                                {images.map(item => (
                                    <TouchableOpacity key={item.id} style={s.gridItem} onPress={() => setViewItem(item)}>
                                        <SmartImage source={{ uri: item.image_url }} bucket="portfolios" style={s.gridImg} resizeMode="cover" />
                                        <View style={s.gridCaption}>
                                            <Text style={s.gridTitle} numberOfLines={1}>{item.title}</Text>
                                            {item.description ? (
                                                <Text style={s.gridDesc} numberOfLines={2}>{item.description}</Text>
                                            ) : null}
                                            <Text style={s.gridDate}>{fmtDate(item.created_at)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ height: 100 }} />
                        </ScrollView>
                    )
                ) : (
                    docs.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>📁</Text>
                            <Text style={s.emptyTxt}>No documents yet</Text>
                            <Text style={s.emptySub}>Upload your certificates, trade qualifications, ID, and other credentials</Text>
                            <TouchableOpacity style={s.emptyBtn} onPress={uploadDoc}>
                                <Text style={s.emptyBtnTxt}>+ Upload Document</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}>
                            {docs.map(doc => (
                                <View key={doc.id} style={s.docCard}>
                                    <View style={s.docIconBox}>
                                        <Text style={{ fontSize: 24 }}>{docEmoji(doc.type)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
                                        <Text style={s.docDate}>{fmtDate(doc.created_at)}</Text>
                                    </View>
                                    <TouchableOpacity style={s.delBtn} onPress={() => deleteDoc(doc.id)}>
                                        <TrashIcon size={14} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )
                )}
            </View>

            {/* Full image view */}
            <Modal visible={!!viewItem} animationType="slide" onRequestClose={() => setViewItem(null)}>
                {viewItem && (
                    <SafeAreaView style={s.fullOverlay} edges={['top']}>
                        <StatusBar style="light" />
                        <TouchableOpacity style={s.closeBtn} onPress={() => setViewItem(null)}>
                            <XIcon size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.fullDelBtn} onPress={() => deleteImage(viewItem.id)}>
                            <TrashIcon size={14} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 48, right: 58, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(11,31,77,0.8)', alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => openEdit(viewItem)}>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>✎</Text>
                        </TouchableOpacity>
                        <ScrollView>
                            <SmartImage source={{ uri: viewItem.image_url }} bucket="portfolios" style={s.fullImg} resizeMode="cover" forceLoad />
                            <View style={s.fullBody}>
                                <Text style={s.fullTitle}>{viewItem.title}</Text>
                                {viewItem.description ? <Text style={s.fullDesc}>{viewItem.description}</Text> : null}
                                <Text style={s.fullDate}>Uploaded {fmtDate(viewItem.created_at)}</Text>
                                <View style={{ height: 40 }} />
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>

            {/* Add photo modal */}
            <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
                <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.sheet}>
                        <View style={s.sheetHdr}>
                            <Text style={s.sheetTitle}>Add Photo</Text>
                            <TouchableOpacity onPress={() => setAddVisible(false)}>
                                <XIcon size={20} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
                                {newUri
                                    ? <Image source={{ uri: newUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    : <View style={{ alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 42 }}>📷</Text>
                                        <Text style={{ fontSize: 13, color: C.textSecondary, fontWeight: '600' }}>Tap to choose a photo</Text>
                                    </View>
                                }
                            </TouchableOpacity>

                            <Text style={s.lbl}>Title</Text>
                            <TextInput style={s.inp} value={newTitle} onChangeText={setNewTitle}
                                placeholder="e.g. Kitchen renovation" placeholderTextColor={C.textMuted} />

                            <Text style={s.lbl}>Description</Text>
                            <TextInput style={[s.inp, { height: 90, textAlignVertical: 'top' }]}
                                value={newDesc} onChangeText={setNewDesc} multiline
                                placeholder="Describe the work — materials used, scope, customer request..." placeholderTextColor={C.textMuted} />

                            <TouchableOpacity style={s.saveBtn} onPress={saveImage} disabled={saving}>
                                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Upload Photo</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit image modal */}
            <Modal visible={!!editItem} transparent animationType="slide" onRequestClose={() => setEditItem(null)}>
                <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.sheet}>
                        <View style={s.sheetHdr}>
                            <Text style={s.sheetTitle}>Edit Photo</Text>
                            <TouchableOpacity onPress={() => setEditItem(null)}>
                                <XIcon size={20} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.lbl}>Title</Text>
                        <TextInput style={s.inp} value={editTitle} onChangeText={setEditTitle}
                            placeholder="e.g. Kitchen renovation" placeholderTextColor={C.textMuted} />
                        <Text style={s.lbl}>Description</Text>
                        <TextInput style={[s.inp, { height: 90, textAlignVertical: 'top' }]}
                            value={editDesc} onChangeText={setEditDesc} multiline
                            placeholder="Describe the work..." placeholderTextColor={C.textMuted} />
                        <TouchableOpacity style={s.saveBtn} onPress={saveEdit} disabled={editSaving}>
                            {editSaving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <AudioFAB pageText={`Portfolio. ${images.length} photos. ${docs.length} documents.`} />
        </SafeAreaView>
    )
}