// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeCtx {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeCtx>({
  mode: 'system',
  setMode: () => { },
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem('crafthive_theme').then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setModeState(v)
      }
    })
  }, [])

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    AsyncStorage.setItem('crafthive_theme', m)
    if (m !== 'system') {
      Appearance.setColorScheme(m)
    } else {
      Appearance.setColorScheme(null)
    }
  }

  const systemScheme = Appearance.getColorScheme()
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark')

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)