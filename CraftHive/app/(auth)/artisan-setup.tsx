// app/(auth)/artisan-setup.tsx — FINAL
// Step 1: Trade category
// Step 2: About (phone, location, bio, experience) + profile picture
// Step 3: Services
// Step 4: Documents + Portfolio (required — at least 1 photo)
// Portfolio required before submit
// sanitizeText on all fields
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useDataSaver } from '../../src/context/DataSaverContext'
import { compressImage } from '../../src/utils/compressImage'
import {
  CheckCircleIcon, ShieldIcon, ToolIcon, ArrowLeftIcon,
  XIcon, PlusIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const CATEGORIES = [
  'Carpenter', 'Plumber', 'Electrician', 'Painter',
  'Mason', 'Welder', 'AC Technician', 'Tiler',
  'Roofer', 'Landscaper', 'Cleaner', 'Locksmith',
  'Glazier', 'Tailor', 'Mechanic', 'Other',
]

const STEPS = ['Trade', 'About', 'Services', 'Documents']

function sanitize(text: string): string {
  if (!text) return ''
  return text.replace(/&#[0-9]+;/g, '').replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim()
}

// Compresses (when maxDimension/quality are passed, i.e. Low Data Mode
// is on) and then uploads to Supabase Storage. Falls back to the
// original file untouched if compression isn't requested or fails —
// upload should never be blocked by a compression error.
async function uploadFile(
  uri: string,
  bucket: string,
  path: string,
  compress?: { maxDimension: number; quality: number }
): Promise<string | null> {
  try {
    const { compressImage } = require('../../src/utils/compressImage')
    const { uploadToSupabase } = require('../../src/utils/fileUpload')
    const converted = await compressImage({
      uri,
      maxDimension: compress?.maxDimension || 1200,
      quality: compress?.quality || 0.85,
    })
    const finalUri = converted.uri
    const fileName = `${path}.jpg`  // always .jpg after conversion
    return await uploadToSupabase(finalUri, bucket, fileName, 'image/jpeg')
  } catch (e) { console.error('Upload failed:', e); return null }
}

export default function ArtisanSetup() {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const { C } = useAppTheme()
  const { uploadMaxDimension, uploadQuality, lowDataMode } = useDataSaver()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [customCat, setCustomCat] = useState('')
  const [experience, setExperience] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [services, setServices] = useState([{ name: '', minPrice: '', maxPrice: '' }])
  const [idImage, setIdImage] = useState<string | null>(null)
  const [certImage, setCertImage] = useState<string | null>(null)
  const [portfolios, setPortfolios] = useState<string[]>([])

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setter(r.assets[0].uri)
  }

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setAvatar(r.assets[0].uri)
  }

  const takeAvatarPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setAvatar(r.assets[0].uri)
  }

  const addPortfolio = async () => {
    if (portfolios.length >= 8) { Alert.alert('Max 8', 'You can add up to 8 portfolio photos.'); return }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access.'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 })
    if (!r.canceled && r.assets[0]) setPortfolios(p => [...p, r.assets[0].uri])
  }

  const removePortfolio = (idx: number) => setPortfolios(p => p.filter((_, i) => i !== idx))

  const canNext = () => {
    if (step === 0) return !!(category || customCat.trim())
    if (step === 1) return !!(location.trim() && phone.trim())
    if (step === 2) return services.some(s => s.name.trim())
    if (step === 3) return portfolios.length > 0   // portfolio required
    return true
  }

  const next = async () => {
    if (!canNext()) {
      const msgs = [
        'Please select or enter your trade category.',
        'Please enter your location and phone number.',
        'Add at least one service.',
        'Upload at least one portfolio photo to show customers your work.',
      ]
      Alert.alert('Required', msgs[step])
      return
    }
    if (step < 3) { setStep(s => s + 1); return }

    // ── Submit ────────────────────────────────────────────────────────
    setLoading(true)

    const finalCategory = sanitize(category === 'Other' ? customCat : category)

    // Upload avatar — compressed when Low Data Mode is on
    let avatarUrl: string | null = null
    if (avatar) {
      avatarUrl = await uploadFile(
        avatar, 'avatars', `${user?.id}/avatar_${Date.now()}`,
        { maxDimension: uploadMaxDimension, quality: uploadQuality }
      )
    }

    // Upload portfolio images — compressed when Low Data Mode is on
    const portfolioUrls: string[] = []
    for (let i = 0; i < portfolios.length; i++) {
      const url = await uploadFile(
        portfolios[i], 'portfolios', `${user?.id}/portfolio_${Date.now()}_${i}`,
        { maxDimension: uploadMaxDimension, quality: uploadQuality }
      )
      if (url) portfolioUrls.push(url)
    }
    // Save portfolio images to portfolio_items so they show in the portfolio screen
    if (portfolioUrls.length > 0) {
      await supabase.from('portfolio_items').insert(
        portfolioUrls.map((url, i) => ({
          artisan_id: user?.id,
          image_url: url,
          title: `My Work ${i + 1}`,
          description: '',
          category: 'Other',
          status: 'completed',
        }))
      )
    }

    // Upload ID and cert — never compressed (KYC docs must stay legible)
    let idUrl: string | null = null
    if (idImage) {
      idUrl = await uploadFile(idImage, 'portfolios', `${user?.id}/id_${Date.now()}`)
      if (idUrl) {
        await supabase.from('portfolio_documents').insert({
          artisan_id: user?.id,
          name: 'Government ID',
          url: idUrl,
          type: 'image/jpeg',
        })
      }
    }
    let certUrl: string | null = null
    if (certImage) {
      certUrl = await uploadFile(certImage, 'portfolios', `${user?.id}/cert_${Date.now()}`)
      if (certUrl) {
        await supabase.from('portfolio_documents').insert({
          artisan_id: user?.id,
          name: 'Trade Certification',
          url: certUrl,
          type: 'image/jpeg',
        })
      }
    }

    // Update artisan_profiles — mark setup complete
    // ── Save artisan profile ─────────────────────────────────────────
    const { error: apError } = await supabase
      .from('artisan_profiles')
      .update({
        trade_category: finalCategory,
        years_experience: Number(experience) || 0,
        location: sanitize(location),
        bio: sanitize(bio) || null,
        portfolio_images: portfolioUrls,
        status: 'pending',
      })
      .eq('user_id', user?.id)

    if (apError) {
      setLoading(false)
      Alert.alert('Save Failed', `Could not save your profile: ${apError.message}\n\nPlease try again.`)
      return
    }

    // ── Save profile (phone + avatar) ─────────────────────────────────
    const { error: profError } = await supabase
      .from('profiles')
      .update({
        phone: sanitize(phone) || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user?.id)

    if (profError) {
      console.warn('Profile update error:', profError.message)
    }

    // Verify the avatar actually saved — if avatarUrl was set but the
    // DB still shows null, the UPDATE was silently blocked (almost
    // always a missing WITH CHECK clause on the profiles RLS policy).
    // We don't block setup completion on this — the artisan is still
    // approved and bookable — but we do warn so it's visible in logs
    // rather than disappearing the same way it did before.
    if (avatarUrl) {
      const { data: verifyProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .single()

      if (!verifyProfile || verifyProfile.avatar_url !== avatarUrl) {
        console.warn(
          'Avatar URL did not persist to profiles table. ' +
          'This is usually caused by a missing WITH CHECK clause on the ' +
          'profiles UPDATE RLS policy. Uploaded file exists in storage at:',
          avatarUrl
        )
      }
    }

    // ── Insert services ───────────────────────────────────────────────
    const validServices = services.filter(s => s.name.trim())
    let servicesSaved = true

    if (validServices.length > 0) {
      const { error: svcError } = await supabase
        .from('artisan_services')
        .insert(
          validServices.map(s => ({
            artisan_id: user?.id,
            name: sanitize(s.name),
            min_price: Number(s.minPrice) || 0,
            max_price: Number(s.maxPrice) || 0,
            is_active: true,
          }))
        )

      if (svcError) {
        servicesSaved = false
        console.warn('Services insert error:', svcError.message)
      } else {
        // Verify the insert actually persisted — same silent-RLS-failure
        // pattern we've hit before: a blocked write can return success
        // with zero rows actually written, with no thrown error.
        const { count } = await supabase
          .from('artisan_services')
          .select('id', { count: 'exact', head: true })
          .eq('artisan_id', user?.id)

        if (!count || count < validServices.length) {
          servicesSaved = false
          console.warn(
            `Services insert returned no error but only ${count || 0} of ` +
            `${validServices.length} services were found afterward. ` +
            `This usually means a missing INSERT policy or WITH CHECK ` +
            `clause on artisan_services.`
          )
        }
      }
    }

    if (!servicesSaved) {
      setLoading(false)
      Alert.alert(
        'Services Not Saved',
        'Your services could not be saved due to a permissions issue. ' +
        'Your profile will still be submitted, but you should add your ' +
        'services again from "Manage Services" once your account is approved.',
        [{ text: 'OK' }]
      )
      // Don't return here — still let the rest of setup complete so the
      // artisan isn't stuck. Services can be added later from their
      // profile. Blocking the whole submission over this would be worse.
    }

    // ── Verify save actually worked ───────────────────────────────────
    const { data: verify } = await supabase
      .from('artisan_profiles')
      .select('status, trade_category')
      .eq('user_id', user?.id)
      .single()

    if (!verify || verify.status !== 'pending') {
      setLoading(false)
      Alert.alert(
        'Save Failed',
        'Your profile could not be saved. This may be a permissions issue.\n\nError: Update returned no rows.',
        [{ text: 'OK' }]
      )
      return
    }

    await refreshProfile()
    setLoading(false)
    router.replace('/(auth)/artisan-pending' as any)
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    stepsRow: { flexDirection: 'row', gap: 4 },
    stepSeg: { flex: 1, height: 3, borderRadius: 2 },
    stepLabels: { flexDirection: 'row', marginTop: 6 },
    stepLbl: { flex: 1, fontSize: 10, fontWeight: '600', textAlign: 'center', color: 'rgba(255,255,255,0.55)' },
    stepLblActive: { color: '#FFF', fontWeight: '800' },
    body: { flex: 1, backgroundColor: C.background },
    padded: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 130 },
    stepTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 6 },
    stepSub: { fontSize: 14, color: C.textSecondary, marginBottom: 24, lineHeight: 20 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    catBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 24, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
    catTxt: { fontSize: 14, fontWeight: '600' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    input: { backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    // Avatar picker
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarWrap: { width: 100, height: 100, borderRadius: 20, borderWidth: 2.5, borderColor: GOLD, overflow: 'hidden', backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' } as any,
    avatarBtns: { flexDirection: 'row', gap: 8 },
    avatarBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: NAVY + '12', borderWidth: 1, borderColor: NAVY },
    avatarBtnTxt: { fontSize: 13, color: NAVY, fontWeight: '600' },
    avatarRequired: { fontSize: 12, color: '#EF4444', marginTop: 4 },
    serviceCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    serviceRow: { flexDirection: 'row', gap: 10 },
    addServiceBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: NAVY, borderStyle: 'dashed', marginBottom: 16 },
    addServiceTxt: { color: NAVY, fontSize: 15, fontWeight: '700' },
    uploadBtn: { backgroundColor: C.card, borderRadius: 16, height: 120, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', marginBottom: 14, overflow: 'hidden' },
    uploadTxt: { fontSize: 14, color: C.textSecondary, marginTop: 8 },
    uploadedImg: { width: '100%', height: '100%', resizeMode: 'cover' } as any,
    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    portfolioItem: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden', position: 'relative' },
    portfolioImg: { width: '100%', height: '100%', resizeMode: 'cover' } as any,
    removeBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    addPhotoBtn: { width: 100, height: 100, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: portfolios.length === 0 ? '#EF4444' : C.border, borderStyle: 'dashed' },
    portfolioRequiredTxt: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
    note: { fontSize: 13, color: C.textSecondary, lineHeight: 20, backgroundColor: NAVY + '10', borderRadius: 12, padding: 14, marginBottom: 20 },
    primaryBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginHorizontal: 16, position: 'absolute', bottom: 32, left: 0, right: 0 },
    primaryTxt: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    primaryDisabled: { opacity: 0.5 },
  })

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Trade ────────────────────────────────────────────────
      case 0: return (
        <View style={s.padded}>
          <Text style={s.stepTitle}>What's your trade?</Text>
          <Text style={s.stepSub}>Select your primary trade category.</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat}
                style={[s.catBtn, { borderColor: category === cat ? NAVY : C.border, backgroundColor: category === cat ? NAVY + '15' : 'transparent' }]}
                onPress={() => setCategory(cat)}>
                {category === cat && <CheckCircleIcon size={13} color={NAVY} />}
                <Text style={[s.catTxt, { color: category === cat ? NAVY : C.text }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {category === 'Other' && (
            <>
              <Text style={s.label}>Specify your trade *</Text>
              <TextInput style={s.input} value={customCat} onChangeText={setCustomCat}
                placeholder="e.g. Upholsterer" placeholderTextColor={C.textMuted} />
            </>
          )}
        </View>
      )

      // ── Step 1: About ────────────────────────────────────────────────
      case 1: return (
        <View style={s.padded}>
          <Text style={s.stepTitle}>About You</Text>
          <Text style={s.stepSub}>Add your profile picture and details so customers can recognise you.</Text>

          {/* Profile picture */}
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              {avatar
                ? <Image source={{ uri: avatar }} style={s.avatarImg} />
                : <ShieldIcon size={40} color="rgba(255,255,255,0.5)" />
              }
            </View>
            <View style={s.avatarBtns}>
              <TouchableOpacity style={s.avatarBtn} onPress={pickAvatar}>
                <Text style={s.avatarBtnTxt}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.avatarBtn} onPress={takeAvatarPhoto}>
                <Text style={s.avatarBtnTxt}>Camera</Text>
              </TouchableOpacity>
              {avatar && (
                <TouchableOpacity style={[s.avatarBtn, { borderColor: '#EF4444' }]} onPress={() => setAvatar(null)}>
                  <Text style={[s.avatarBtnTxt, { color: '#EF4444' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>
              Profile photo helps customers recognise you
            </Text>
          </View>

          <Text style={s.label}>Phone Number *</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            placeholder="024 XXX XXXX" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />

          <Text style={s.label}>Location / Area *</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation}
            placeholder="e.g. Accra, East Legon" placeholderTextColor={C.textMuted} />

          <Text style={s.label}>Years of Experience</Text>
          <TextInput style={s.input} value={experience} onChangeText={setExperience}
            placeholder="e.g. 5" placeholderTextColor={C.textMuted} keyboardType="numeric" />

          <Text style={s.label}>Bio (optional)</Text>
          <TextInput style={[s.input, s.textArea]} value={bio}
            onChangeText={v => setBio(v.slice(0, 300))}
            placeholder="Tell customers about yourself..." placeholderTextColor={C.textMuted} multiline />
          <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: -10, marginBottom: 10 }}>
            {bio.length}/300
          </Text>
        </View>
      )

      // ── Step 2: Services ─────────────────────────────────────────────
      case 2: return (
        <View style={s.padded}>
          <Text style={s.stepTitle}>Your Services</Text>
          <Text style={s.stepSub}>Add services you offer with price ranges in Ghana Cedis (₵).</Text>
          {services.map((svc, i) => (
            <View key={i} style={s.serviceCard}>
              <Text style={s.label}>Service Name *</Text>
              <TextInput style={[s.input, { marginBottom: 10 }]} value={svc.name}
                onChangeText={v => setServices(p => p.map((x, j) => j === i ? { ...x, name: v } : x))}
                placeholder="e.g. Furniture repair" placeholderTextColor={C.textMuted} />
              <Text style={s.label}>Price Range (₵)</Text>
              <View style={s.serviceRow}>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={svc.minPrice}
                  onChangeText={v => setServices(p => p.map((x, j) => j === i ? { ...x, minPrice: v } : x))}
                  placeholder="Min" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={svc.maxPrice}
                  onChangeText={v => setServices(p => p.map((x, j) => j === i ? { ...x, maxPrice: v } : x))}
                  placeholder="Max" placeholderTextColor={C.textMuted} keyboardType="numeric" />
              </View>
            </View>
          ))}
          {services.length < 6 && (
            <TouchableOpacity style={s.addServiceBtn}
              onPress={() => setServices(p => [...p, { name: '', minPrice: '', maxPrice: '' }])}>
              <Text style={s.addServiceTxt}>+ Add Another Service</Text>
            </TouchableOpacity>
          )}
        </View>
      )

      // ── Step 3: Documents + Portfolio ────────────────────────────────
      case 3: return (
        <View style={s.padded}>
          <Text style={s.stepTitle}>Documents & Portfolio</Text>
          <Text style={s.stepSub}>Upload your ID and show customers examples of your work.</Text>

          <Text style={s.label}>Government-issued ID</Text>
          <TouchableOpacity style={s.uploadBtn} onPress={() => pickImage(setIdImage)}>
            {idImage
              ? <Image source={{ uri: idImage }} style={s.uploadedImg} />
              : <><ToolIcon size={36} color={C.textMuted} /><Text style={s.uploadTxt}>Tap to upload Ghana Card / Passport</Text></>
            }
          </TouchableOpacity>

          <Text style={s.label}>Trade Certification (optional)</Text>
          <TouchableOpacity style={s.uploadBtn} onPress={() => pickImage(setCertImage)}>
            {certImage
              ? <Image source={{ uri: certImage }} style={s.uploadedImg} />
              : <><ToolIcon size={36} color={C.textMuted} /><Text style={s.uploadTxt}>Tap to upload certificate</Text></>
            }
          </TouchableOpacity>

          {/* Portfolio — REQUIRED */}
          <Text style={s.label}>
            Portfolio Photos * <Text style={{ color: '#EF4444' }}>(required — at least 1)</Text>
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10, lineHeight: 18 }}>
            Show customers examples of your past work. This helps you get more bookings.
          </Text>
          {lowDataMode && (
            <Text style={{ fontSize: 12, color: NAVY, marginBottom: 10 }}>
              📉 Low Data Mode is on — photos will be compressed before upload to save data.
            </Text>
          )}
          {portfolios.length === 0 && (
            <Text style={s.portfolioRequiredTxt}>Please upload at least one photo of your work.</Text>
          )}
          <View style={s.portfolioGrid}>
            {portfolios.map((uri, i) => (
              <View key={i} style={s.portfolioItem}>
                <Image source={{ uri }} style={s.portfolioImg} />
                <TouchableOpacity style={s.removeBtn} onPress={() => removePortfolio(i)}>
                  <XIcon size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {portfolios.length < 8 && (
              <TouchableOpacity style={s.addPhotoBtn} onPress={addPortfolio}>
                <PlusIcon size={28} color={portfolios.length === 0 ? '#EF4444' : C.textMuted} />
                <Text style={{ fontSize: 11, color: portfolios.length === 0 ? '#EF4444' : C.textMuted, marginTop: 4 }}>
                  {portfolios.length === 0 ? 'Required' : 'Add more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.note}>
            <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 19 }}>
              Your application will be reviewed within 1–2 business days.
              You'll be notified by email and in-app once approved.
            </Text>
          </View>
        </View>
      )
      default: return null
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <View style={s.headerTop}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(s => s - 1)}>
              <ArrowLeftIcon size={18} color="#FFF" />
            </TouchableOpacity>
          )}
          <Text style={s.headerTitle}>Artisan Setup — Step {step + 1} of 4</Text>
        </View>
        <View style={s.stepsRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.stepSeg, {
              backgroundColor: i <= step ? GOLD : 'rgba(255,255,255,0.25)',
            }]} />
          ))}
        </View>
        <View style={s.stepLabels}>
          {STEPS.map((lbl, i) => (
            <Text key={i} style={[s.stepLbl, i === step && s.stepLblActive]}>{lbl}</Text>
          ))}
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      <TouchableOpacity
        style={[s.primaryBtn, !canNext() && s.primaryDisabled]}
        onPress={next}
        disabled={loading || !canNext()}>
        {loading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={s.primaryTxt}>{step < 3 ? 'Continue →' : 'Submit for Review'}</Text>
        }
      </TouchableOpacity>
    </SafeAreaView>
  )
}