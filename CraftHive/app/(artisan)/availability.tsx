// app/(artisan)/availability.tsx
// Spec: working days+times, break time, vacation mode, timezone, day toggles
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import AudioFAB from '../../src/components/AudioFAB'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, CheckIcon, XIcon, GlobeIcon } from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const totalMin = i * 30
  const h = Math.floor(totalMin / 60) % 12 || 12
  const m = totalMin % 60 === 0 ? '00' : '30'
  const ampm = Math.floor(totalMin / 60) < 12 ? 'AM' : 'PM'
  return `${h}:${m} ${ampm}`
})
const TIMEZONES = [
  'Africa/Accra (GMT+0)', 'Africa/Lagos (GMT+1)', 'Europe/London (GMT+0/+1)',
  'Europe/Paris (GMT+1/+2)', 'America/New_York (GMT-5/-4)', 'America/Los_Angeles (GMT-8/-7)',
  'Asia/Dubai (GMT+4)', 'Asia/Kolkata (GMT+5:30)',
]

type DaySchedule = { enabled: boolean; start: string; end: string; breakStart: string; breakEnd: string }
type Schedule = Record<string, DaySchedule>

const DEFAULT: Schedule = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { enabled: day !== 'Sunday', start: '8:00 AM', end: '6:00 PM', breakStart: '12:00 PM', breakEnd: '1:00 PM' }
}), {} as Schedule)

export default function ArtisanAvailability() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { user } = useAuth()
  const { t } = useLang()

  const [schedule, setSchedule] = useState<Schedule>(DEFAULT)
  const [vacation, setVacation] = useState(false)
  const [timezone, setTimezone] = useState('Africa/Accra (GMT+0)')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<{ day: string; field: 'start' | 'end' | 'breakStart' | 'breakEnd' } | null>(null)
  const [tzPickerOpen, setTzPickerOpen] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('artisan_profiles').select('availability').eq('user_id', user?.id).single()
    if (data?.availability) {
      const av = data.availability
      if (av.schedule) setSchedule(av.schedule)
      if (av.vacation !== undefined) setVacation(av.vacation)
      if (av.timezone) setTimezone(av.timezone)
    }
    setLoading(false)
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const toggle = (day: string) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }))

  const setTime = (day: string, field: 'start' | 'end' | 'breakStart' | 'breakEnd', value: string) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: value } }))

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('artisan_profiles')
      .update({ availability: { schedule, vacation, timezone } }).eq('user_id', user?.id)
    setSaving(false)
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Saved ✓', t('availability.saved'))
  }

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', flex: 1 },
    body: { flex: 1, backgroundColor: C.background },
    section: { marginHorizontal: 16, marginTop: 16 },
    sectionLbl: { fontSize: 12, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    // Vacation card
    vacCard: { backgroundColor: vacation ? '#FEF3C7' : C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: vacation ? 1.5 : 0, borderColor: '#F59E0B' },
    vacText: { flex: 1 },
    vacTitle: { fontSize: 15, fontWeight: '800', color: vacation ? '#92400E' : C.text },
    vacSub: { fontSize: 12, color: vacation ? '#B45309' : C.textSecondary, marginTop: 2 },
    // Timezone
    tzCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    tzTxt: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },
    // Day cards
    dayCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayName: { fontSize: 15, fontWeight: '800', color: C.text },
    timeGrid: { marginTop: 12, gap: 8 },
    timeRow: { flexDirection: 'row', gap: 8 },
    timeBtn: { flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1.5 },
    timeLbl: { fontSize: 10, color: C.textMuted, marginBottom: 2 },
    timeTxt: { fontSize: 13, fontWeight: '700', color: NAVY },
    breakLbl: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 4, marginBottom: 4 },
    // Save
    saveBtn: { backgroundColor: NAVY, marginHorizontal: 16, marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
    saveTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    // Picker overlay
    pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
    pickerSheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '60%' },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    pickerTitle: { fontSize: 18, fontWeight: '900', color: C.text },
    pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    pickerTxt: { flex: 1, fontSize: 15 },
  })

  if (loading) return (
    <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
      <ActivityIndicator color={GOLD} size="large" />
    </SafeAreaView>
  )

  const activeDays = DAYS.filter(d => schedule[d]?.enabled).length

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Availability</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Vacation mode */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>Vacation Mode</Text>
          <View style={s.vacCard}>
            <View style={s.vacText}>
              <Text style={s.vacTitle}>{vacation ? '🌴 You are on vacation' : t('availability.vacation')}</Text>
              <Text style={s.vacSub}>{vacation ? t('availability.vacationPause') : t('availability.vacationDesc')}</Text>
            </View>
            <Switch value={vacation} onValueChange={setVacation}
              trackColor={{ true: '#F59E0B', false: C.border }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Timezone */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>Time Zone</Text>
          <TouchableOpacity style={s.tzCard} onPress={() => setTzPickerOpen(true)}>
            <GlobeIcon size={18} color={NAVY} />
            <Text style={s.tzTxt}>{timezone}</Text>
            <Text style={{ fontSize: 18, color: C.textMuted }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Working hours */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>Working Hours · {activeDays} days active</Text>
          {DAYS.map(day => {
            const d = schedule[day]
            return (
              <View key={day} style={[s.dayCard, vacation && { opacity: 0.4 }]}>
                <View style={s.dayRow}>
                  <Text style={s.dayName}>{day}</Text>
                  <Switch value={d.enabled} onValueChange={() => toggle(day)}
                    trackColor={{ true: NAVY, false: C.border }} thumbColor="#FFF" disabled={vacation} />
                </View>
                {d.enabled && !vacation && (
                  <View style={s.timeGrid}>
                    {/* Working hours */}
                    <View style={s.timeRow}>
                      <TouchableOpacity style={[s.timeBtn, { borderColor: NAVY }]}
                        onPress={() => setPickerOpen({ day, field: 'start' })}>
                        <Text style={s.timeLbl}>Start Time</Text>
                        <Text style={s.timeTxt}>{d.start}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.timeBtn, { borderColor: NAVY }]}
                        onPress={() => setPickerOpen({ day, field: 'end' })}>
                        <Text style={s.timeLbl}>End Time</Text>
                        <Text style={s.timeTxt}>{d.end}</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Break time */}
                    <Text style={s.breakLbl}>☕ Break Time</Text>
                    <View style={s.timeRow}>
                      <TouchableOpacity style={[s.timeBtn, { borderColor: C.border }]}
                        onPress={() => setPickerOpen({ day, field: 'breakStart' })}>
                        <Text style={s.timeLbl}>Break Start</Text>
                        <Text style={[s.timeTxt, { color: C.textSecondary }]}>{d.breakStart}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.timeBtn, { borderColor: C.border }]}
                        onPress={() => setPickerOpen({ day, field: 'breakEnd' })}>
                        <Text style={s.timeLbl}>Break End</Text>
                        <Text style={[s.timeTxt, { color: C.textSecondary }]}>{d.breakEnd}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveTxt}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Time picker */}
      {pickerOpen && (
        <View style={s.pickerOverlay}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>
                {pickerOpen.field === 'start' ? t('availability.startTime')
                  : pickerOpen.field === 'end' ? t('availability.endTime')
                    : pickerOpen.field === 'breakStart' ? t('availability.breakStart')
                      : t('availability.breakEnd')} — {pickerOpen.day}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(null)}>
                <XIcon size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}>
              {HOURS.map(h => {
                const selected = schedule[pickerOpen.day][pickerOpen.field] === h
                return (
                  <TouchableOpacity key={h} style={s.pickerRow}
                    onPress={() => { setTime(pickerOpen.day, pickerOpen.field, h); setPickerOpen(null) }}>
                    <Text style={[s.pickerTxt, { color: selected ? NAVY : C.text, fontWeight: selected ? '800' : '400' }]}>{h}</Text>
                    {selected && <CheckIcon size={18} color={NAVY} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Timezone picker */}
      {tzPickerOpen && (
        <View style={s.pickerOverlay}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setTzPickerOpen(false)}>
                <XIcon size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}>
              {TIMEZONES.map(tz => {
                const selected = timezone === tz
                return (
                  <TouchableOpacity key={tz} style={s.pickerRow}
                    onPress={() => { setTimezone(tz); setTzPickerOpen(false) }}>
                    <Text style={[s.pickerTxt, { color: selected ? NAVY : C.text, fontWeight: selected ? '800' : '400' }]}>{tz}</Text>
                    {selected && <CheckIcon size={18} color={NAVY} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      )}

      <AudioFAB pageText={`Availability settings. ${activeDays} working days active. Vacation mode is ${vacation ? 'on' : 'off'}.`} />
    </SafeAreaView>
  )
}