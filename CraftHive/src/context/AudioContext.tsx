// src/context/AudioContext.tsx
// Controls whether audio reader is enabled globally
import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AudioCtx {
  audioEnabled: boolean
  setAudioEnabled: (v: boolean) => void
}

const AudioContext = createContext<AudioCtx>({
  audioEnabled: false,
  setAudioEnabled: () => { },
})

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioEnabled, setAudioState] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('crafthive_audio').then(v => {
      if (v === 'true') setAudioState(true)
    })
  }, [])

  const setAudioEnabled = (v: boolean) => {
    setAudioState(v)
    AsyncStorage.setItem('crafthive_audio', v ? 'true' : 'false')
  }

  return (
    <AudioContext.Provider value={{ audioEnabled, setAudioEnabled }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => useContext(AudioContext)