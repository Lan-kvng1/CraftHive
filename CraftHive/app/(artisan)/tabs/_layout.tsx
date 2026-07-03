// app/(artisan)/tabs/_layout.tsx  ← NEW FILE
// The 4 visible bottom tabs. Only home/bookings/messages/profile go here.
import React from 'react'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { HomeIcon, CalendarIcon, ChatIcon } from '../../../src/components/Icons'
import { useLang } from '../../../src/context/LanguageContext'

const NAVY = '#0B1F4D'
const INACTIVE = '#94A3B8'

function PersonIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

export default function ArtisanTabsLayout() {
  const { t } = useLang()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('nav.home'), tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: t('nav.myJobs'), tabBarIcon: ({ color, size }) => <CalendarIcon size={size} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: t('nav.chat'), tabBarIcon: ({ color, size }) => <ChatIcon size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ({ color, size }) => <PersonIcon color={color} size={size} /> }} />
    </Tabs>
  )
}