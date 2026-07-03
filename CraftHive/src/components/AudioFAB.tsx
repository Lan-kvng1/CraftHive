// src/components/AudioFAB.tsx — FINAL
// Only renders when audio reader is enabled in Settings
// Tap to speak page text, tap again to stop
// Stops automatically when component unmounts (screen navigation)
// Run: npx expo install expo-speech
import React, { useState, useEffect, useRef } from 'react'
import { TouchableOpacity, StyleSheet, Animated, View, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import { useAudio } from '../context/AudioContext'
import { useLang } from '../context/LanguageContext'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const RED = '#EF4444'

interface Props {
  pageText: string
}

export default function AudioFAB({ pageText }: Props) {
  const { audioEnabled } = useAudio()
  const { speechLang } = useLang()
  const [speaking, setSpeaking] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      Speech.stop()
      pulseRef.current?.stop()
    }
  }, [])

  // Stop if reader is disabled while speaking
  useEffect(() => {
    if (!audioEnabled && speaking) stopAll()
  }, [audioEnabled])

  const startPulse = () => {
    pulseRef.current?.stop()
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    )
    pulseRef.current.start()
  }

  const stopAll = () => {
    Speech.stop()
    pulseRef.current?.stop()
    pulseRef.current = null
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start()
    if (mounted.current) setSpeaking(false)
  }

  const handlePress = async () => {
    if (speaking) { stopAll(); return }

    if (!pageText?.trim()) return

    setSpeaking(true)
    startPulse()

    Speech.speak(pageText.trim(), {
      language: speechLang,
      rate: 0.85,
      pitch: 1.0,
      onDone: () => stopAll(),
      onError: () => {
        // Some Android devices don't have every locale installed.
        // Fall back to English rather than failing silently.
        if (speechLang !== 'en-GH') {
          Speech.speak(pageText.trim(), {
            language: 'en-GH',
            rate: 0.85,
            pitch: 1.0,
            onDone: () => stopAll(),
            onError: () => stopAll(),
            onStopped: () => stopAll(),
          })
        } else {
          stopAll()
        }
      },
      onStopped: () => stopAll(),
    })
  }

  // Don't render at all if audio reader is off
  if (!audioEnabled) return null

  return (
    <Animated.View style={[s.container, { transform: [{ scale: pulseAnim }] }]}>
      {speaking && <View style={s.ripple} />}
      <TouchableOpacity
        style={[s.btn, speaking && s.btnActive]}
        onPress={handlePress}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {speaking ? <StopIcon /> : <SpeakerIcon />}
      </TouchableOpacity>
    </Animated.View>
  )
}

const SpeakerIcon = () => (
  <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <View style={{ width: 8, height: 14, backgroundColor: '#FFF', borderRadius: 2 }} />
      <View style={{ gap: 3 }}>
        <View style={{ width: 4, height: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }} />
        <View style={{ width: 6, height: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
        <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
        <View style={{ width: 6, height: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
        <View style={{ width: 4, height: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }} />
      </View>
    </View>
  </View>
)

const StopIcon = () => (
  <View style={{ width: 18, height: 18, backgroundColor: '#FFF', borderRadius: 3 }} />
)

const s = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, right: 20,
    zIndex: 9999, elevation: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  btn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 10,
  },
  btnActive: { backgroundColor: RED },
  ripple: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: RED, opacity: 0.35,
  },
})