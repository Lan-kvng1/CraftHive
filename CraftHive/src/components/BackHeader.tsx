// src/components/BackHeader.tsx
// Reusable navy header with back button for all sub-screens
// Ensures consistent back navigation everywhere
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeftIcon } from './Icons'

const NAVY = '#0A2463'

interface Props {
  title: string
  right?: React.ReactNode
  onBack?: () => void   // override default router.back()
}

export default function BackHeader({ title, right, onBack }: Props) {
  const router = useRouter()
  return (
    <View style={s.header}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={onBack ?? (() => router.back())}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeftIcon size={20} color="#FFF" />
      </TouchableOpacity>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.right}>{right ?? null}</View>
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  right: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
})