// app/(artisan)/profile.tsx — FINAL
// sanitizeText on all fields before saving, plain text only
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, Modal, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase, getImageUrl } from '../../../src/lib/supabase'
import { useAuth } from '../../../src/context/AuthContext'
import { useLang } from '../../../src/context/LanguageContext'
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import AudioFAB from '../../../src/components/AudioFAB'
import Avatar from '../../../src/components/Avatar'
import {
  SettingsIcon, MapPinIcon, CheckCircleIcon, StarIcon,
  BriefcaseIcon, CalendarIcon, EditIcon, ChevronRightIcon,
  LogOutIcon, ToolIcon, TrendingUpIcon, GlobeIcon,
} from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#[0-9]+;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function ArtisanProfile() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile: authProfile, refreshProfile, signOut } = useAuth()
  const { t } = useLang()

  const [profile, setProfile] = useState<any>(null)
  const [artisan, setArtisan] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [stats, setStats] = useState({ completed: 0, earnings: 0 })

  // Edit modal
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editAvatar, setEditAvatar] = useState<string | null>(null)
  const [editAvatarErr, setEditAvatarErr] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data: ap } = await supabase.from('artisan_profiles').select('*').eq('user_id', user.id).single()
    const { data: sv } = await supabase.from('artisan_services').select('name').eq('artisan_id', user.id).limit(6)
    const { data: bk } = await supabase.from('bookings').select('status, price').eq('artisan_id', user.id)
    const { data: rv } = await supabase.from('reviews').select('rating').eq('artisan_id', user.id)
    setProfile(p)

    // Merge live counts into artisan profile so stats are always current
    if (ap && rv) {
      const avgRating = rv.length > 0
        ? parseFloat((rv.reduce((s, r) => s + (r.rating || 0), 0) / rv.length).toFixed(1))
        : null
      ap.rating = avgRating
      ap.total_reviews = rv.length
    }
    setArtisan(ap)
    setServices(sv || [])
    if (bk) {
      const done = bk.filter(b => b.status === 'completed')
      setStats({ completed: done.length, earnings: parseFloat((done.reduce((s, b) => s + (b.price || 0), 0) * 0.9).toFixed(2)) })
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const openEdit = () => {
    const p = profile || authProfile
    setEditName(p?.full_name || '')
    setEditPhone(p?.phone || '')
    setEditLocation(artisan?.location || '')
    setEditBio(artisan?.bio || '')
    setEditCategory(sanitizeText(artisan?.trade_category || ''))
    setEditAvatar(p?.avatar_url || null)
    setEditAvatarErr(false)
    setEditVisible(true)
  }

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setEditAvatar(r.assets[0].uri)
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setEditAvatar(r.assets[0].uri)
  }

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    try {
      const { compressImage } = require('../../../src/utils/compressImage')
      const { uploadToSupabase } = require('../../../src/utils/fileUpload')
      const compressed = await compressImage({ uri, maxDimension: 800, quality: 0.85 })
      const finalUri = compressed.uri
      const path = `${user?.id}/avatar_${Date.now()}.jpg`
      return await uploadToSupabase(finalUri, 'avatars', path, 'image/jpeg')
    } catch (e) {
      console.error('Avatar upload exception:', e)
      return null
    }
  }

  const saveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return }
    setSaving(true)

    let avatarUrl = editAvatar
    if (editAvatar && (editAvatar.startsWith('file://') || editAvatar.startsWith('content://') || editAvatar.startsWith('ph://'))) {
      const uploaded = await uploadAvatar(editAvatar)
      if (!uploaded) {
        setSaving(false)
        Alert.alert('Upload Failed', 'Failed to upload profile photo. Please try again.')
        return
      }
      avatarUrl = uploaded
    }

    // Sanitize everything before saving
    const { error: profErr } = await supabase.from('profiles').update({
      full_name: sanitizeText(editName),
      phone: sanitizeText(editPhone) || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', user?.id)

    if (profErr) {
      setSaving(false)
      Alert.alert('Save Failed', profErr.message)
      return
    }

    const { error: artErr } = await supabase.from('artisan_profiles').update({
      location: sanitizeText(editLocation) || null,
      bio: sanitizeText(editBio) || null,
      trade_category: sanitizeText(editCategory) || null,
    }).eq('user_id', user?.id)

    if (artErr) {
      setSaving(false)
      Alert.alert('Save Failed', artErr.message)
      return
    }

    setSaving(false)
    setEditVisible(false)
    await load()
    await refreshProfile()
  }

  const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout', style: 'destructive', onPress: async () => {
        await signOut()
        router.replace('/(auth)/login' as any)
      }
    },
  ])

  const initials = (n: string) => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'A'
  const displayName = profile?.full_name || authProfile?.full_name || 'Artisan'
  const tradeCategory = sanitizeText(artisan?.trade_category || '')

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    avatarWrap: { position: 'relative' },
    avatarImg: { width: 76, height: 76, borderRadius: 24, borderWidth: 3, borderColor: GOLD },
    avatarFall: { width: 76, height: 76, borderRadius: 24, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
    avatarTxt: { color: NAVY, fontWeight: '900', fontSize: 26 },
    editBubble: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: NAVY },
    profileInfo: { flex: 1, paddingTop: 4 },
    profileName: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaTxt: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
    body: { flex: 1, backgroundColor: C.background },
    bodyInner: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 },
    overviewCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 0, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
    overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    overviewTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    editLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statNum: { fontSize: 20, fontWeight: '900', color: C.text, marginTop: 8 },
    statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 3, textAlign: 'center' },
    bioCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16 },
    bioTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    bioTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    bioTxt: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
    servicesCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16 },
    servicesTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: NAVY + '12', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: NAVY + '30' },
    tagTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
    menuSection: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border, gap: 14 },
    menuRowLast: { borderBottomWidth: 0 },
    menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 15, color: C.text, flex: 1 },
    logoutBtn: { backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 14, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#FECACA' },
    logoutTxt: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
    // Edit modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    modalCloseTxt: { fontSize: 18, color: C.textSecondary },
    avatarEditRow: { alignItems: 'center', marginBottom: 20 },
    avatarPreview: { width: 90, height: 90, borderRadius: 28, borderWidth: 3, borderColor: GOLD },
    avatarFallLg: { width: 90, height: 90, borderRadius: 28, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD },
    avatarTxtLg: { color: NAVY, fontWeight: '900', fontSize: 30 },
    avatarBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
    avatarBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: NAVY + '12', borderWidth: 1, borderColor: NAVY },
    avatarBtnTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 7 },
    input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
    textarea: { height: 90, textAlignVertical: 'top' },
    saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  })

  const MenuRow = ({ icon, label, onPress, last = false }: any) => (
    <TouchableOpacity style={[s.menuRow, last && s.menuRowLast]} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuIcon}>{icon}</View>
      <Text style={s.menuLabel}>{label}</Text>
      <ChevronRightIcon size={16} color={C.textMuted} />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>{t('profile')}</Text>
          <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/(artisan)/settings' as any)}>
            <SettingsIcon size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={s.profileRow}>
          <TouchableOpacity style={s.avatarWrap} onPress={openEdit}>
            <Avatar
              uri={profile?.avatar_url}
              name={displayName}
              size={76}
              radius={24}
              fallbackBg={GOLD}
              fallbackTextColor={NAVY}
              borderWidth={3}
              borderColor={GOLD}
            />
            <View style={s.editBubble}><EditIcon size={13} color={NAVY} /></View>
          </TouchableOpacity>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{displayName}</Text>
            <View style={s.metaRow}>
              <CheckCircleIcon size={13} color="rgba(255,255,255,0.85)" />
              <Text style={s.metaTxt}>Verified Artisan</Text>
            </View>
            {tradeCategory ? (
              <View style={s.metaRow}>
                <ToolIcon size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.metaTxt}>{tradeCategory}</Text>
              </View>
            ) : null}
            <View style={s.metaRow}>
              <MapPinIcon size={13} color="rgba(255,255,255,0.75)" />
              <Text style={s.metaTxt}>{sanitizeText(artisan?.location || '') || 'Location not set'}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.bodyInner}>
          {/* Overview */}
          <View style={s.overviewCard}>
            <View style={s.overviewTop}>
              <Text style={s.overviewTitle}>Overview</Text>
              <TouchableOpacity onPress={openEdit}><Text style={s.editLink}>Edit Profile</Text></TouchableOpacity>
            </View>
            <View style={s.statsRow}>
              <View style={s.statItem}><BriefcaseIcon size={22} color={NAVY} /><Text style={s.statNum}>{stats.completed}</Text><Text style={s.statLabel}>Jobs Done</Text></View>
              <View style={s.statItem}><StarIcon size={22} color={GOLD} fill={artisan?.rating ? GOLD : 'none'} /><Text style={s.statNum}>{artisan?.rating ? artisan.rating.toFixed(1) : '—'}</Text><Text style={s.statLabel}>Rating {artisan?.total_reviews ? `(${artisan.total_reviews})` : ''}</Text></View>
              <View style={s.statItem}><CalendarIcon size={22} color={NAVY} /><Text style={s.statNum}>{artisan?.years_experience || 0}</Text><Text style={s.statLabel}>Yrs Exp</Text></View>
              <View style={s.statItem}><TrendingUpIcon size={22} color={NAVY} /><Text style={s.statNum}>₵{stats.earnings}</Text><Text style={s.statLabel}>Earnings</Text></View>
            </View>
          </View>

          {/* Bio */}
          <View style={s.bioCard}>
            <View style={s.bioTop}>
              <Text style={s.bioTitle}>About Me</Text>
              <TouchableOpacity onPress={openEdit}><Text style={s.editLink}>Edit</Text></TouchableOpacity>
            </View>
            <Text style={s.bioTxt}>
              {sanitizeText(artisan?.bio || '') || 'Add a bio to attract more customers.'}
            </Text>
          </View>

          {/* Services */}
          <View style={s.servicesCard}>
            <View style={s.servicesTop}>
              <Text style={s.bioTitle}>My Services</Text>
              <TouchableOpacity onPress={() => router.push('/(artisan)/manage-services' as any)}>
                <Text style={s.editLink}>Manage</Text>
              </TouchableOpacity>
            </View>
            <View style={s.tagsWrap}>
              {services.map(sv => (
                <View key={sv.name} style={s.tag}>
                  <Text style={s.tagTxt}>{sanitizeText(sv.name)}</Text>
                </View>
              ))}
              {services.length === 0 && <Text style={{ color: C.textSecondary, fontSize: 13 }}>No services added yet.</Text>}
            </View>
          </View>

          {/* Quick links */}
          <Text style={s.sectionLabel}>Manage</Text>
          <View style={s.menuSection}>
            <MenuRow icon={<CalendarIcon size={17} color={NAVY} />} label="Availability" onPress={() => router.push('/(artisan)/availability' as any)} />
            <MenuRow icon={<ToolIcon size={17} color={NAVY} />} label="Portfolio" onPress={() => router.push('/(artisan)/portfolio' as any)} />
            <MenuRow icon={<StarIcon size={17} color={NAVY} />} label="Reviews" onPress={() => router.push('/(artisan)/reviews' as any)} />
            <MenuRow icon={<TrendingUpIcon size={17} color={NAVY} />} label="Earnings" onPress={() => router.push('/(artisan)/earnings' as any)} last />
          </View>

          <Text style={s.sectionLabel}>Account</Text>
          <View style={s.menuSection}>
            <MenuRow icon={<GlobeIcon size={17} color={NAVY} />} label={t('language')} onPress={() => router.push('/(artisan)/language' as any)} />
            <MenuRow icon={<SettingsIcon size={17} color={NAVY} />} label={t('settings')} onPress={() => router.push('/(artisan)/settings' as any)} last />
          </View>

          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <LogOutIcon size={18} color="#EF4444" />
            <Text style={s.logoutTxt}>{t('logout')}</Text>
          </TouchableOpacity>
          <View style={{ height: 120 }} />
        </View>{/* bodyInner */}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setEditVisible(false)}>
                <Text style={s.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
              {/* Avatar */}
              <View style={s.avatarEditRow}>
                {(editAvatar && !editAvatarErr)
                  ? <Image
                      source={{ uri: (editAvatar.startsWith('file://') || editAvatar.startsWith('content://') || editAvatar.startsWith('ph://')) ? editAvatar : getImageUrl(editAvatar, 'avatars') }}
                      style={s.avatarPreview}
                      onError={() => setEditAvatarErr(true)}
                    />
                  : <View style={s.avatarFallLg}><Text style={s.avatarTxtLg}>{initials(editName || displayName)}</Text></View>
                }
                <View style={s.avatarBtns}>
                  <TouchableOpacity style={s.avatarBtn} onPress={pickAvatar}><Text style={s.avatarBtnTxt}>Gallery</Text></TouchableOpacity>
                  <TouchableOpacity style={s.avatarBtn} onPress={takePhoto}><Text style={s.avatarBtnTxt}>Camera</Text></TouchableOpacity>
                  {editAvatar && (
                    <TouchableOpacity style={[s.avatarBtn, { borderColor: '#EF4444' }]} onPress={() => setEditAvatar(null)}>
                      <Text style={[s.avatarBtnTxt, { color: '#EF4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={s.label}>Full Name *</Text>
              <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={C.textMuted} autoCapitalize="words" />

              <Text style={s.label}>Phone</Text>
              <TextInput style={s.input} value={editPhone} onChangeText={setEditPhone} placeholder="024 XXX XXXX" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />

              <Text style={s.label}>Trade / Category</Text>
              <TextInput style={s.input} value={editCategory} onChangeText={setEditCategory} placeholder="e.g. Carpenter, Plumber" placeholderTextColor={C.textMuted} />

              <Text style={s.label}>Location</Text>
              <TextInput style={s.input} value={editLocation} onChangeText={setEditLocation} placeholder="e.g. Accra, Ghana" placeholderTextColor={C.textMuted} />

              <Text style={s.label}>Bio</Text>
              <TextInput style={[s.input, s.textarea]} value={editBio} onChangeText={setEditBio} placeholder="Tell customers about yourself..." placeholderTextColor={C.textMuted} multiline />

              <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Changes</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AudioFAB pageText={`Profile. ${displayName}. ${tradeCategory}. ${stats.completed} jobs completed.`} />
    </SafeAreaView>
  )
}