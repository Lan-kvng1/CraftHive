// app/(customer)/profile.tsx — FINAL
// avg_rating from DB only, no hardcoded values
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
import { useAppTheme } from '../../../src/hooks/useAppTheme'
import AudioFAB from '../../../src/components/AudioFAB'
import Avatar from '../../../src/components/Avatar'
import {
  SettingsIcon, MapPinIcon, PhoneIcon, MailIcon,
  CalendarIcon, HeartIcon, StarIcon, CreditCardIcon,
  ChevronRightIcon, LogOutIcon, EditIcon, BriefcaseIcon,
  CheckCircleIcon, XIcon,
} from '../../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

function sanitize(t: string) {
  return t?.replace(/&#[0-9]+;/g, '').replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim() || ''
}

export default function CustomerProfile() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user, profile: authProfile, refreshProfile, signOut } = useAuth()

  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    bookings: 0, completed: 0, upcoming: 0,
    inProgress: 0, cancelled: 0, spent: 0, avgRating: 0, saved: 0,
  })

  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editAvatar, setEditAvatar] = useState<string | null>(null)
  const [editAvatarErr, setEditAvatarErr] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data: b } = await supabase
      .from('bookings').select('status, price').eq('customer_id', user.id)

    // Count saved artisans
    const { count: savedCount } = await supabase
      .from('saved_artisans').select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id)

    // Avg rating = average of ratings customer gave to artisans
    const { data: reviews } = await supabase
      .from('reviews').select('rating').eq('reviewer_id', user.id)

    if (b) {
      const completed = b.filter(x => x.status === 'completed')
      const avgRating = reviews && reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10
        : 0
      setStats({
        bookings: b.length,
        completed: completed.length,
        upcoming: b.filter(x => ['pending', 'confirmed'].includes(x.status)).length,
        inProgress: b.filter(x => x.status === 'in_progress').length,
        cancelled: b.filter(x => x.status === 'cancelled').length,
        spent: completed.reduce((s, x) => s + (x.price || 0), 0),
        avgRating,
        saved: savedCount || 0,
      })
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const openEdit = () => {
    const p = profile || authProfile
    setEditName(p?.full_name || '')
    setEditPhone(p?.phone || '')
    setEditLocation(p?.location || '')
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
    const { error } = await supabase.from('profiles').update({
      full_name: sanitize(editName),
      phone: sanitize(editPhone) || null,
      location: sanitize(editLocation) || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', user?.id)

    if (error) {
      setSaving(false)
      Alert.alert('Save Failed', error.message)
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

  const displayName = profile?.full_name || authProfile?.full_name || 'Customer'
  const avatarUrl = profile?.avatar_url || authProfile?.avatar_url
  const resolvedAvatarUrl = avatarUrl ? getImageUrl(avatarUrl, 'avatars') : null
  const initials = (n: string) => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    settingsBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    avatarWrap: { position: 'relative' },
    avatarImg: { width: 76, height: 76, borderRadius: 24, borderWidth: 3, borderColor: GOLD, overflow: 'hidden' },
    avatarFall: { width: 76, height: 76, borderRadius: 24, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
    avatarTxt: { color: NAVY, fontWeight: '900', fontSize: 26 },
    editBubble: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: NAVY },
    profileInfo: { flex: 1, paddingTop: 4 },
    profileName: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaTxt: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
    body: { flex: 1, backgroundColor: C.background },
    bodyInner: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: C.background, paddingTop: 20 },
    overviewCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 0, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
    overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    overviewTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    editLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statNum: { fontSize: 20, fontWeight: '900', color: C.text, marginTop: 8 },
    statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 3, textAlign: 'center' },
    bookingsCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16 },
    bookingsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    bookingsTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    bookingsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    bookingItem: { alignItems: 'center', flex: 1 },
    bookingIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    bookingNum: { fontSize: 18, fontWeight: '900', color: C.text },
    bookingLbl: { fontSize: 11, color: C.textSecondary, textAlign: 'center', marginTop: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
    menuSection: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border, gap: 14 },
    menuRowLast: { borderBottomWidth: 0 },
    menuIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 15, color: C.text, flex: 1 },
    logoutBtn: { backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 14, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#FECACA' },
    logoutTxt: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    avatarEditRow: { alignItems: 'center', marginBottom: 20 },
    avatarPreview: { width: 100, height: 100, borderRadius: 24, borderWidth: 3, borderColor: GOLD, overflow: 'hidden' },
    avatarFallLg: { width: 90, height: 90, borderRadius: 28, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
    avatarTxtLg: { color: NAVY, fontWeight: '900', fontSize: 30 },
    avatarBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
    avatarBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: NAVY + '12', borderWidth: 1, borderColor: NAVY },
    avatarBtnTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
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

  const BookingItem = ({ icon, color, bg, count, label }: any) => (
    <View style={s.bookingItem}>
      <View style={[s.bookingIconWrap, { backgroundColor: bg }]}>{icon}</View>
      <Text style={s.bookingNum}>{count}</Text>
      <Text style={s.bookingLbl}>{label}</Text>
    </View>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity style={s.settingsBtn}
            onPress={() => router.push('/(customer)/settings' as any)}>
            <SettingsIcon size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={s.profileRow}>
          <TouchableOpacity style={s.avatarWrap} onPress={openEdit}>
            <Avatar
              uri={avatarUrl}
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
            {profile?.email && <View style={s.metaRow}><MailIcon size={13} color="rgba(255,255,255,0.75)" /><Text style={s.metaTxt} numberOfLines={1}>{profile.email}</Text></View>}
            {profile?.phone && <View style={s.metaRow}><PhoneIcon size={13} color="rgba(255,255,255,0.75)" /><Text style={s.metaTxt}>{profile.phone}</Text></View>}
            {profile?.location && <View style={s.metaRow}><MapPinIcon size={13} color="rgba(255,255,255,0.75)" /><Text style={s.metaTxt}>{sanitize(profile.location)}</Text></View>}
          </View>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.bodyInner}>
          {/* Overview — all values from DB */}
          <View style={s.overviewCard}>
            <View style={s.overviewTop}>
              <Text style={s.overviewTitle}>Quick Overview</Text>
              <TouchableOpacity onPress={openEdit}><Text style={s.editLink}>Edit Profile</Text></TouchableOpacity>
            </View>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <CalendarIcon size={22} color={NAVY} />
                <Text style={s.statNum}>{stats.bookings}</Text>
                <Text style={s.statLabel}>Bookings</Text>
              </View>
              <View style={s.statItem}>
                <StarIcon size={22} color={stats.avgRating > 0 ? GOLD : C.textMuted} fill={stats.avgRating > 0 ? GOLD : 'none'} />
                <Text style={s.statNum}>{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}</Text>
                <Text style={s.statLabel}>Avg Rating</Text>
              </View>
              <View style={s.statItem}>
                <HeartIcon size={22} color="#EF4444" />
                <Text style={s.statNum}>{stats.saved}</Text>
                <Text style={s.statLabel}>Saved</Text>
              </View>
              <TouchableOpacity style={s.statItem}
                onPress={() => router.push('/(customer)/payment-history' as any)}>
                <CreditCardIcon size={22} color={NAVY} />
                <Text style={s.statNum}>₵{stats.spent}</Text>
                <Text style={[s.statLabel, { color: NAVY, fontWeight: '700' }]}>Spent ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* My Bookings — all from DB */}
          <View style={s.bookingsCard}>
            <View style={s.bookingsTop}>
              <Text style={s.bookingsTitle}>My Bookings</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/tabs/bookings' as any)}>
                <Text style={{ fontSize: 13, color: NAVY, fontWeight: '700' }}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={s.bookingsRow}>
              <BookingItem icon={<CalendarIcon size={20} color={NAVY} />} bg={NAVY + '12'} count={stats.upcoming} label="Upcoming" />
              <BookingItem icon={<BriefcaseIcon size={20} color="#F59E0B" />} bg="#FEF3C7" count={stats.inProgress} label="In Progress" />
              <BookingItem icon={<CheckCircleIcon size={20} color="#22C55E" />} bg="#DCFCE7" count={stats.completed} label="Completed" />
              <BookingItem icon={<XIcon size={20} color="#EF4444" />} bg="#FEE2E2" count={stats.cancelled} label="Cancelled" />
            </View>
          </View>

          {/* Account links */}
          <Text style={s.sectionLabel}>My Account</Text>
          <View style={s.menuSection}>
            <MenuRow icon={<HeartIcon size={17} color={NAVY} />} label="Saved Artisans" onPress={() => router.push('/(customer)/saved-artisans' as any)} />
            <MenuRow icon={<MapPinIcon size={17} color={NAVY} />} label="My Addresses" onPress={() => router.push('/(customer)/addresses' as any)} />
            <MenuRow icon={<CreditCardIcon size={17} color={NAVY} />} label="Payment Methods" onPress={() => router.push('/(customer)/payment-methods' as any)} />
            <MenuRow icon={<StarIcon size={17} color={NAVY} />} label="My Reviews" onPress={() => router.push('/(customer)/my-reviews' as any)} last />
          </View>

          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <LogOutIcon size={18} color="#EF4444" />
            <Text style={s.logoutTxt}>Logout</Text>
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
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
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
              <Text style={s.label}>Location</Text>
              <TextInput style={s.input} value={editLocation} onChangeText={setEditLocation} placeholder="e.g. Accra, Ghana" placeholderTextColor={C.textMuted} />
              <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Changes</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AudioFAB pageText={`Profile. ${displayName}. ${stats.bookings} bookings. ${stats.completed} completed. ${stats.avgRating > 0 ? `Average rating ${stats.avgRating.toFixed(1)}` : 'No ratings yet'}. Total spent ₵${stats.spent}.`} />
    </SafeAreaView>
  )
}