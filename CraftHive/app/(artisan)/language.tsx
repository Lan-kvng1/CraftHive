// app/(artisan)/language.tsx — FINAL (mirrors customer language screen)
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useLang, LANGUAGE_OPTIONS, Language } from '../../src/context/LanguageContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, CheckIcon, GlobeIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'

export default function ArtisanLanguage() {
    const router = useRouter()
    const { C } = useAppTheme()
    const { language, setLanguage, t } = useLang()

    const onSelect = (code: Language) => {
        setLanguage(code)
        setTimeout(() => router.back(), 300)
    }

    const ghanaLangs = LANGUAGE_OPTIONS.filter(l => l.flag === '🇬🇭')
    const otherLangs = LANGUAGE_OPTIONS.filter(l => l.flag !== '🇬🇭')

    const s = StyleSheet.create({
        safe: { flex: 1, backgroundColor: NAVY },
        header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
        backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
        body: { flex: 1, backgroundColor: C.background },
        infoCard: { backgroundColor: C.card, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12 },
        infoTxt: { fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 19 },
        sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
        note: { fontSize: 12, color: C.textMuted, marginHorizontal: 16, marginBottom: 4, fontStyle: 'italic' },
        section: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
        langRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, gap: 14 },
        langRowLast: { borderBottomWidth: 0 },
        flag: { fontSize: 26 },
        langInfo: { flex: 1 },
        langName: { fontSize: 15, fontWeight: '700', color: C.text },
        nativeName: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
        activeRow: { backgroundColor: NAVY + '08' },
    })

    const LangRow = ({ item, last = false }: any) => (
        <TouchableOpacity
            style={[s.langRow, last && s.langRowLast, language === item.code && s.activeRow]}
            onPress={() => onSelect(item.code as Language)} activeOpacity={0.7}>
            <Text style={s.flag}>{item.flag}</Text>
            <View style={s.langInfo}>
                <Text style={[s.langName, language === item.code && { color: NAVY }]}>{item.name}</Text>
                <Text style={s.nativeName}>{item.nativeName}</Text>
            </View>
            {language === item.code && <CheckIcon size={20} color={NAVY} />}
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar style="light" />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <ArrowLeftIcon size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{t('settings.language')}</Text>
            </View>
            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                <View style={s.infoCard}>
                    <GlobeIcon size={18} color={NAVY} />
                    <Text style={s.infoTxt}>{t('language.info')}</Text>
                </View>
                <Text style={s.sectionLabel}>{t('language.ghana')}</Text>
                <Text style={s.note}>{t('language.ghanaNote')}</Text>
                <View style={s.section}>
                    {ghanaLangs.map((l, i) => <LangRow key={l.code} item={l} last={i === ghanaLangs.length - 1} />)}
                </View>
                <Text style={s.sectionLabel}>{t('language.other')}</Text>
                <View style={s.section}>
                    {otherLangs.map((l, i) => <LangRow key={l.code} item={l} last={i === otherLangs.length - 1} />)}
                </View>
                <View style={{ height: 80 }} />
            </ScrollView>
            <AudioFAB pageText={t('language.audioHint')} />
        </SafeAreaView>
    )
}