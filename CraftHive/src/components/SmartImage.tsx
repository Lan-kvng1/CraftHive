// src/components/SmartImage.tsx
// Drop-in replacement for React Native's <Image> used in lists, grids,
// and cards (artisan cards, portfolio grids, recent bookings, chat
// avatars). Two things it adds over plain <Image>:
//
// 1. Lazy mount — the real <Image> isn't rendered until this component
//    has been on screen for a brief moment, avoiding loading images for
//    cards that are scrolled past quickly. Implemented with a tiny
//    requestAnimationFrame-based defer rather than IntersectionObserver
//    (not available in React Native).
//
// 2. Low Data Mode awareness — when enabled, shows a lightweight grey
//    placeholder instead of starting the image load at all, with a tap
//    to reveal. This is the most direct way to cut data usage: many
//    images in a long list are simply never loaded.
//
// Usage (same props as Image, plus optional `forceLoad`):
//   <SmartImage source={{ uri: artisan.avatar_url }} style={s.avatar} />
import React, { useState, useEffect, useRef } from 'react'
import { Image, ImageProps, View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useDataSaver } from '../context/DataSaverContext'
import { useLang } from '../context/LanguageContext'
import { getImageUrl } from '../lib/supabase'

interface Props extends ImageProps {
  // Skip lazy-defer and low-data placeholder entirely (e.g. for a hero
  // image the user is clearly about to look at — artisan detail header).
  forceLoad?: boolean
  fallbackIcon?: React.ReactNode
  bucket?: string
}

export default function SmartImage({ forceLoad = false, fallbackIcon, bucket = 'avatars', style, source, ...rest }: Props) {
  const { lowDataMode } = useDataSaver()
  const { t } = useLang()
  const [shouldRender, setShouldRender] = useState(forceLoad)
  const [revealedInLowData, setRevealedInLowData] = useState(forceLoad)
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!forceLoad) {
      // Defer mounting the real <Image> by one frame so fast scrolling
      // past a long list doesn't kick off a network request for every
      // card that flies by.
      const raf = requestAnimationFrame(() => {
        if (mounted.current) setShouldRender(true)
      })
      return () => { mounted.current = false; cancelAnimationFrame(raf) }
    }
    return () => { mounted.current = false }
  }, [forceLoad])

  const uri = (source as any)?.uri
  const resolvedUri = uri ? getImageUrl(uri, bucket) : ''
  const isInvalidLocalUri = typeof uri === 'string' && 
    (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://'))

  if (hasError || isInvalidLocalUri) {
    return (
      <View style={[style, s.placeholder]}>
        {fallbackIcon || <Text style={s.placeholderTxt}>👤</Text>}
      </View>
    )
  }

  // Low Data Mode: don't even mount the Image until the user taps to reveal it.
  if (lowDataMode && !revealedInLowData) {
    return (
      <TouchableOpacity
        style={[style, s.placeholder]}
        activeOpacity={0.7}
        onPress={() => setRevealedInLowData(true)}
      >
        {fallbackIcon || <Text style={s.placeholderTxt}>📷</Text>}
        <Text style={s.placeholderLabel} numberOfLines={1}>{t('common.tapToLoad') || 'Tap to load image'}</Text>
      </TouchableOpacity>
    )
  }

  if (!shouldRender) {
    return <View style={[style, s.placeholder]} />
  }

  const finalSource = source && typeof source === 'object' && 'uri' in source
    ? { ...source, uri: resolvedUri }
    : source

  return (
    <View style={[style, { overflow: 'hidden', position: 'relative' }]}>
      <Image
        {...rest}
        source={finalSource}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }, !loaded && s.imageLoading]}
        onLoad={(e) => { setLoaded(true); rest.onLoad?.(e) }}
        onError={(e) => { setHasError(true); rest.onError?.(e) }}
      />
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, s.spinnerWrap]}>
          <ActivityIndicator size="small" color="#0A2463" />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E5E9F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderTxt: { fontSize: 20, opacity: 0.5 },
  placeholderLabel: { fontSize: 10, color: '#64748B', paddingHorizontal: 6 },
  imageLoading: { opacity: 0 },
  spinnerWrap: { alignItems: 'center', justifyContent: 'center' },
})