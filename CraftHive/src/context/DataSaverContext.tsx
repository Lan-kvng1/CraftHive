// src/context/DataSaverContext.tsx
// Global "Low Data Mode" toggle. When ON, images across the app are
// compressed before upload and served at reduced resolution/quality
// for display, and off-screen list images defer loading until visible.
//
// This does NOT touch real-time messaging or polling — per product
// decision, low-data mode in this version is image-only.
import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface DataSaverCtx {
  lowDataMode: boolean
  setLowDataMode: (v: boolean) => void
  // Quality (0–1) to use for Supabase Storage uploads when compressing
  uploadQuality: number
  // Max width/height (px) to downscale images to before upload
  uploadMaxDimension: number
  // Suggested display quality multiplier for remote image rendering hints
  displayQuality: number
}

const DataSaverContext = createContext<DataSaverCtx>({
  lowDataMode: false,
  setLowDataMode: () => { },
  uploadQuality: 0.8,
  uploadMaxDimension: 1600,
  displayQuality: 1,
})

const STORAGE_KEY = 'crafthive_low_data_mode'

export function DataSaverProvider({ children }: { children: React.ReactNode }) {
  const [lowDataMode, setLowDataState] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'true') setLowDataState(true)
    })
  }, [])

  const setLowDataMode = (v: boolean) => {
    setLowDataState(v)
    AsyncStorage.setItem(STORAGE_KEY, v ? 'true' : 'false')
  }

  const value: DataSaverCtx = {
    lowDataMode,
    setLowDataMode,
    // Aggressive but still legible compression when low-data is on
    uploadQuality: lowDataMode ? 0.45 : 0.8,
    uploadMaxDimension: lowDataMode ? 800 : 1600,
    displayQuality: lowDataMode ? 0.5 : 1,
  }

  return (
    <DataSaverContext.Provider value={value}>
      {children}
    </DataSaverContext.Provider>
  )
}

export const useDataSaver = () => useContext(DataSaverContext)