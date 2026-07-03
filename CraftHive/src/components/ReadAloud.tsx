// src/components/ReadAloud.tsx
// Wrap any card, message bubble, or form field with this to let users
// tap that ONE piece of content and hear just it — independent of the
// page-level AudioFAB "Read Page" button.
//
// Usage:
//   <ReadAloud text={`${artisan.name}, ${artisan.trade}, rated ${artisan.rating} stars`}>
//     <ArtisanCard artisan={artisan} />
//   </ReadAloud>
//
// Only active when the user has Audio Reader turned on in Settings —
// otherwise it renders children untouched with zero overhead.
import React, { useState, useEffect, useRef } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import * as Speech from 'expo-speech'
import { useAudio } from '../context/AudioContext'
import { useLang } from '../context/LanguageContext'

interface Props {
  text: string
  children: React.ReactNode
  disabled?: boolean
}

// Module-level so only one ReadAloud region is ever speaking at a time,
// and so the page-level AudioFAB can be silenced if a card starts speaking.
let activeStopper: (() => void) | null = null

export default function ReadAloud({ text, children, disabled }: Props) {
  const { audioEnabled } = useAudio()
  const { speechLang } = useLang()
  const [speaking, setSpeaking] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (activeStopper === stop) {
        Speech.stop()
        activeStopper = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = () => {
    Speech.stop()
    if (mounted.current) setSpeaking(false)
    if (activeStopper === stop) activeStopper = null
  }

  const handlePress = () => {
    if (!audioEnabled || disabled || !text?.trim()) return

    // If something else (the page FAB or another card) is speaking, stop it first.
    if (activeStopper) activeStopper()

    if (speaking) {
      stop()
      return
    }

    setSpeaking(true)
    activeStopper = stop

    Speech.speak(text.trim(), {
      language: speechLang,
      rate: 0.85,
      pitch: 1.0,
      onDone: stop,
      onStopped: stop,
      onError: () => {
        // Retry once in Ghana English if the selected locale voice is missing
        if (speechLang !== 'en-GH') {
          Speech.speak(text.trim(), { language: 'en-GH', rate: 0.85, pitch: 1.0, onDone: stop, onStopped: stop, onError: stop })
        } else {
          stop()
        }
      },
    })
  }

  // Audio reader is off globally — render children with no wrapper behaviour at all
  if (!audioEnabled) return <>{children}</>

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      onLongPress={handlePress}
      delayLongPress={250}
      style={speaking ? s.speakingWrap : undefined}
    >
      {children}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  speakingWrap: {
    borderRadius: 12,
    backgroundColor: 'rgba(10,36,99,0.06)',
  },
})