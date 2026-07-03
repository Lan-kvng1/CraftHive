// src/components/Skeleton.tsx
// Shimmer skeleton loader — drop-in replacement for any loading state
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, useColorScheme, ViewStyle } from 'react-native'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] })

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? '#334155' : '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  )
}

// ── Pre-built skeleton layouts ────────────────────────────────────────────

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const scheme = useColorScheme()
  const C = scheme === 'dark' ? '#1E293B' : '#FFFFFF'
  return (
    <View style={[{ backgroundColor: C, borderRadius: 16, padding: 16, marginBottom: 10 }, style]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBox width={46} height={46} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="70%" height={14} />
          <SkeletonBox width="45%" height={11} />
        </View>
        <SkeletonBox width={70} height={26} borderRadius={8} />
      </View>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12,
        borderTopWidth: 1, borderTopColor: scheme === 'dark' ? '#334155' : '#E2E8F0'
      }}>
        <SkeletonBox width="40%" height={11} />
        <SkeletonBox width={50} height={11} />
      </View>
    </View>
  )
}

export function SkeletonProfileHeader({ primaryColor }: { primaryColor: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 28, alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <SkeletonBox width={76} height={76} borderRadius={24} style={{ backgroundColor: primaryColor + '40' }} />
        <View style={{ gap: 10 }}>
          <SkeletonBox width={140} height={18} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <SkeletonBox width={100} height={13} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <SkeletonBox width={120} height={13} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
      </View>
    </View>
  )
}

export function SkeletonArtisanCard({ style }: { style?: ViewStyle }) {
  const scheme = useColorScheme()
  const C = scheme === 'dark' ? '#1E293B' : '#FFFFFF'
  return (
    <View style={[{ backgroundColor: C, borderRadius: 18, padding: 16, marginBottom: 10 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SkeletonBox width={52} height={52} borderRadius={16} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="60%" height={15} />
          <SkeletonBox width="40%" height={12} />
          <SkeletonBox width="35%" height={11} />
        </View>
        <SkeletonBox width={72} height={34} borderRadius={10} />
      </View>
      <View style={{
        flexDirection: 'row', gap: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: scheme === 'dark' ? '#334155' : '#E2E8F0'
      }}>
        <SkeletonBox width="28%" height={11} />
        <SkeletonBox width="28%" height={11} />
        <SkeletonBox width="28%" height={11} />
      </View>
    </View>
  )
}

export function SkeletonNotificationItem() {
  const scheme = useColorScheme()
  const C = scheme === 'dark' ? '#1E293B' : '#FFFFFF'
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: C, paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#334155' : '#E2E8F0',
      gap: 12,
    }}>
      <SkeletonBox width={46} height={46} borderRadius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox width="80%" height={14} />
        <SkeletonBox width="60%" height={12} />
        <SkeletonBox width="30%" height={10} />
      </View>
    </View>
  )
}

export function SkeletonEarningsHero() {
  const scheme = useColorScheme()
  const C = scheme === 'dark' ? '#1E293B' : '#FFFFFF'
  return (
    <View style={{
      backgroundColor: '#FFB80040', marginHorizontal: 16, marginTop: 14,
      borderRadius: 22, padding: 22, alignItems: 'center', gap: 10
    }}>
      <SkeletonBox width={120} height={14} style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />
      <SkeletonBox width={180} height={44} style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />
      <SkeletonBox width={140} height={13} style={{ backgroundColor: 'rgba(0,0,0,0.1)' }} />
    </View>
  )
}

// ── Page-level skeleton screens ───────────────────────────────────────────

export function HomePageSkeleton({ primaryColor }: { primaryColor: string }) {
  const scheme = useColorScheme()
  const bg = scheme === 'dark' ? '#0F172A' : '#F4F6FB'
  return (
    <View style={{ flex: 1, backgroundColor: primaryColor }}>
      {/* Header skeleton */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
        <SkeletonProfileHeader primaryColor={primaryColor} />
        <SkeletonBox width="100%" height={46} borderRadius={14}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </View>
      {/* Body */}
      <View style={{ flex: 1, backgroundColor: bg, padding: 16, gap: 10 }}>
        <SkeletonBox width="100%" height={110} borderRadius={20}
          style={{ backgroundColor: '#FFB80030' }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3].map(i => <SkeletonBox key={i} width="30%" height={80} borderRadius={16} />)}
        </View>
        <SkeletonArtisanCard />
        <SkeletonArtisanCard />
        <SkeletonArtisanCard />
      </View>
    </View>
  )
}

export function BookingsPageSkeleton({ primaryColor }: { primaryColor: string }) {
  const scheme = useColorScheme()
  const bg = scheme === 'dark' ? '#0F172A' : '#F4F6FB'
  return (
    <View style={{ flex: 1, backgroundColor: primaryColor }}>
      <View style={{ padding: 20, paddingBottom: 16 }}>
        <SkeletonBox width={160} height={22} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <SkeletonBox width={100} height={14} style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }} />
      </View>
      <View style={{ flex: 1, backgroundColor: bg, padding: 16, gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </View>
  )
}