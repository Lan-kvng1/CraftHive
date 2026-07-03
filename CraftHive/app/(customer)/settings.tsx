// app/(customer)/settings.tsx — FINAL
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useAudio } from '../../src/context/AudioContext'
import { useNotifications } from '../../src/context/NotificationContext'
import { useLang, LANGUAGE_OPTIONS } from '../../src/context/LanguageContext'
import { useDataSaver } from '../../src/context/DataSaverContext'
import { supabase } from '../../src/lib/supabase'
import AudioFAB from '../../src/components/AudioFAB'
import {
  ArrowLeftIcon, ShieldIcon, BellIcon, GlobeIcon,
  VolumeIcon, ChevronRightIcon, LogOutIcon,
  CheckIcon, XIcon, SettingsIcon, TrendingUpIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'

export default function CustomerSettings() {
  const router = useRouter()
  const { C, mode, setMode } = useAppTheme()
  const { user, profile, signOut } = useAuth()
  const { audioEnabled, setAudioEnabled } = useAudio()  // ← wired to AudioContext
  const { t, language } = useLang()
  const { lowDataMode, setLowDataMode } = useDataSaver()

  const { prefs, setPrefs } = useNotifications()
  const notifBookings = prefs.bookings
  const notifMessages = prefs.messages
  const notifPromos = prefs.promos
  const [pwVisible, setPwVisible] = useState(false)
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [themeVisible, setThemeVisible] = useState(false)

  const currentLangLabel = LANGUAGE_OPTIONS.find(l => l.code === language)?.nativeName || 'English'

  const handleLogout = () => Alert.alert(t('common.logout'), 'Are you sure you want to logout?', [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('common.logout'), style: 'destructive', onPress: async () => {
        await signOut()
        router.replace('/(auth)/login' as any)
      }
    },
  ])

  const handleDeleteAccount = () => Alert.alert(
    t('settings.deleteAccount'),
    'This will permanently delete your account and all your data. This cannot be undone.',
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: () =>
          Alert.alert('Request Submitted', 'Our team will process your deletion request within 7 business days.')
      },
    ]
  )

  const changePassword = async () => {
    if (!pwNew.trim()) { Alert.alert(t('common.required'), 'Enter a new password.'); return }
    if (pwNew.length < 6) { Alert.alert(t('common.error'), 'Password must be at least 6 characters.'); return }
    if (pwNew !== pwConfirm) { Alert.alert(t('common.error'), 'Passwords do not match.'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    setPwLoading(false)
    if (error) { Alert.alert(t('common.error'), error.message); return }
    setPwVisible(false); setPwNew(''); setPwConfirm('')
    Alert.alert(t('common.success'), 'Password updated successfully.')
  }

  const THEMES = [
    { key: 'light', label: t('settings.themeLight'), desc: t('settings.themeDesc.light') },
    { key: 'dark', label: t('settings.themeDark'), desc: t('settings.themeDesc.dark') },
    { key: 'system', label: t('settings.themeSystem'), desc: t('settings.themeDesc.system') },
  ]

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
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    sectionLabel: {
      fontSize: 11, fontWeight: '800', color: C.textMuted,
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginHorizontal: 16, marginTop: 24, marginBottom: 8,
    },
    section: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 15,
      borderBottomWidth: 1, borderBottomColor: C.border, gap: 14,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: 15, color: C.text, flex: 1 },
    rowValue: { fontSize: 13, color: C.textSecondary },
    dangerSection: { backgroundColor: '#FEF2F2', marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#FECACA' },
    dangerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
    dangerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
    dangerLabel: { fontSize: 15, color: '#EF4444', flex: 1 },
    logoutBtn: { backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 14, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#FECACA' },
    logoutTxt: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
    versionTxt: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 20 },
    audioNote: { fontSize: 12, color: C.textSecondary, marginHorizontal: 16, marginTop: 6, lineHeight: 17 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    input: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 14 },
    saveBtn: { backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
    saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    themeOpt: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border },
    themeOptLast: { borderBottomWidth: 0 },
    themeOptIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: NAVY + '12', alignItems: 'center', justifyContent: 'center' },
    themeLabel: { fontSize: 15, fontWeight: '700', color: C.text },
    themeDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  })

  const Row = ({ icon: Icon, label, value, onPress, right, last = false }: any) => (
    <TouchableOpacity style={[s.row, last && s.rowLast]} onPress={onPress} activeOpacity={0.7}>
      <View style={s.rowIcon}><Icon size={17} color={NAVY} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {right !== undefined ? right : <ChevronRightIcon size={16} color={C.textMuted} />}
    </TouchableOpacity>
  )

  const ThemeIcon = () => (
    <View style={{ width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: NAVY, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: '#FFF' }} />
      <View style={{ flex: 1, backgroundColor: '#1E293B' }} />
    </View>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>

        <Text style={s.sectionLabel}>{t('settings.account')}</Text>
        <View style={s.section}>
          <Row icon={ShieldIcon} label={t('settings.changePw')} onPress={() => setPwVisible(true)} last />
        </View>

        <Text style={s.sectionLabel}>{t('settings.notifications')}</Text>
        <View style={s.section}>
          <View style={s.row}>
            <View style={s.rowIcon}><BellIcon size={17} color={NAVY} /></View>
            <Text style={s.rowLabel}>{t('settings.bookingUpdates')}</Text>
            <Switch value={notifBookings} onValueChange={(v) => setPrefs({ bookings: v })} trackColor={{ true: NAVY }} thumbColor="#FFF" />
          </View>
          <View style={s.row}>
            <View style={s.rowIcon}><BellIcon size={17} color={NAVY} /></View>
            <Text style={s.rowLabel}>{t('settings.messages')}</Text>
            <Switch value={notifMessages} onValueChange={(v) => setPrefs({ messages: v })} trackColor={{ true: NAVY }} thumbColor="#FFF" />
          </View>
          <View style={[s.row, s.rowLast]}>
            <View style={s.rowIcon}><ShieldIcon size={17} color={NAVY} /></View>
            <Text style={s.rowLabel}>{t('settings.promotions')}</Text>
            <Switch value={notifPromos} onValueChange={(v) => setPrefs({ promos: v })} trackColor={{ true: NAVY }} thumbColor="#FFF" />
          </View>
        </View>

        <Text style={s.sectionLabel}>{t('settings.preferences')}</Text>
        <View style={s.section}>
          <Row
            icon={ThemeIcon}
            label={t('settings.theme')}
            value={THEMES.find(th => th.key === mode)?.label || t('settings.themeSystem')}
            onPress={() => setThemeVisible(true)}
          />
          <Row
            icon={GlobeIcon}
            label={t('settings.language')}
            value={currentLangLabel}
            onPress={() => router.push('/(customer)/language' as any)}
          />
          {/* Audio reader toggle — wired to AudioContext */}
          <View style={[s.row, s.rowLast]}>
            <View style={s.rowIcon}><VolumeIcon size={17} color={NAVY} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{t('settings.audioReader')}</Text>
            </View>
            <Switch
              value={audioEnabled}
              onValueChange={setAudioEnabled}
              trackColor={{ true: NAVY, false: '#CBD5E1' }}
              thumbColor="#FFF"
            />
          </View>
        </View>
        {audioEnabled && (
          <Text style={s.audioNote}>{t('settings.audioOn')}</Text>
        )}

        <View style={s.section}>
          <View style={[s.row, s.rowLast]}>
            <View style={s.rowIcon}><TrendingUpIcon size={17} color={NAVY} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{t('settings.lowDataMode')}</Text>
            </View>
            <Switch
              value={lowDataMode}
              onValueChange={setLowDataMode}
              trackColor={{ true: NAVY, false: '#CBD5E1' }}
              thumbColor="#FFF"
            />
          </View>
        </View>
        {lowDataMode && (
          <Text style={s.audioNote}>{t('settings.lowDataModeDesc')}</Text>
        )}

        <Text style={s.sectionLabel}>{t('settings.support')}</Text>
        <View style={s.section}>
          <Row icon={ShieldIcon} label={t('settings.helpSupport')} onPress={() => router.push('/(customer)/help-support' as any)} />
          <Row icon={ShieldIcon} label={t('settings.rateCraftHive')} onPress={() => router.push('/(customer)/rate-app' as any)} />
          <Row icon={ShieldIcon} label={t('settings.terms')} onPress={() => router.push('/(auth)/terms' as any)} />
          <Row icon={ShieldIcon} label={t('settings.privacy')} onPress={() => router.push('/(auth)/privacy' as any)} last />
        </View>

        <Text style={s.sectionLabel}>{t('settings.dangerZone')}</Text>
        <View style={s.dangerSection}>
          <TouchableOpacity style={s.dangerRow} onPress={handleDeleteAccount}>
            <View style={s.dangerIcon}><ShieldIcon size={17} color="#EF4444" /></View>
            <Text style={s.dangerLabel}>{t('settings.deleteAccount')}</Text>
            <ChevronRightIcon size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOutIcon size={18} color="#EF4444" />
          <Text style={s.logoutTxt}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={s.versionTxt}>CraftHive v1.0.0 · Made with love in Ghana</Text>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={pwVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('settings.changePw')}</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setPwVisible(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.label}>{t('settings.newPassword')}</Text>
            <TextInput style={s.input} value={pwNew} onChangeText={setPwNew}
              placeholder={t('settings.atLeast6')} placeholderTextColor={C.textMuted}
              secureTextEntry autoCapitalize="none" />
            <Text style={s.label}>{t('settings.confirmNewPassword')}</Text>
            <TextInput style={s.input} value={pwConfirm} onChangeText={setPwConfirm}
              placeholder={t('settings.reenterPassword')} placeholderTextColor={C.textMuted}
              secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={s.saveBtn} onPress={changePassword} disabled={pwLoading}>
              {pwLoading ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>{t('settings.updatePw')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal visible={themeVisible} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('settings.chooseTheme')}</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setThemeVisible(false)}>
                <XIcon size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            {THEMES.map((theme, i) => (
              <TouchableOpacity key={theme.key}
                style={[s.themeOpt, i === THEMES.length - 1 && s.themeOptLast]}
                onPress={() => { setMode(theme.key as any); setThemeVisible(false) }}>
                <View style={s.themeOptIcon}>
                  {theme.key === 'light' && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }} />}
                  {theme.key === 'dark' && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#1E293B' }} />}
                  {theme.key === 'system' && <SettingsIcon size={18} color={NAVY} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.themeLabel}>{theme.label}</Text>
                  <Text style={s.themeDesc}>{theme.desc}</Text>
                </View>
                {mode === theme.key && <CheckIcon size={18} color={NAVY} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <AudioFAB pageText={`${t('settings.title')}. ${t('settings.changePw')}, ${t('settings.notifications')}, ${t('settings.theme')}, ${t('settings.language')}, ${t('settings.audioReader')}.`} />
    </SafeAreaView>
  )
}