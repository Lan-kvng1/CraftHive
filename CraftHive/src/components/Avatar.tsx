// src/components/Avatar.tsx
// Shows a profile picture; falls back to a styled initial letter on error or empty URI.
// Handles 0-byte / broken images by tracking onError state per instance.
import React, { useState } from 'react'
import { View, Text, Image } from 'react-native'
import { getImageUrl } from '../lib/supabase'

const NAVY = '#0B1F4D'

interface Props {
  uri?: string | null
  name?: string
  size: number
  radius?: number
  fallbackBg?: string
  fallbackTextColor?: string
  borderWidth?: number
  borderColor?: string
  style?: any
  bucket?: string
}

export default function Avatar({
  uri, name, size, radius, fallbackBg = NAVY, fallbackTextColor = '#FFF',
  borderWidth = 0, borderColor = 'transparent', style, bucket = 'avatars',
}: Props) {
  const [error, setError] = useState(false)
  const r = radius !== undefined ? radius : size / 2
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'
  const resolved = uri ? getImageUrl(uri, bucket) : ''

  const base = {
    width: size, height: size, borderRadius: r,
    ...(borderWidth > 0 ? { borderWidth, borderColor } : {}),
  }

  if (!resolved || error) {
    return (
      <View style={[base, { backgroundColor: fallbackBg, alignItems: 'center' as const, justifyContent: 'center' as const }, style]}>
        <Text style={{ color: fallbackTextColor, fontWeight: '900' as const, fontSize: Math.round(size * 0.37) }}>
          {initial}
        </Text>
      </View>
    )
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={[base, style]}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  )
}
