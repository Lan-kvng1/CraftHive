// app/(artisan)/_layout.tsx  ← REPLACES current _layout.tsx
// Stack wrapping (tabs) group + all sub-screens.
// This gives proper back navigation: Settings → Profile → Home
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

const SLIDE = Platform.OS === 'ios' ? 'default' : 'slide_from_right'

export default function ArtisanStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: SLIDE,
        animationDuration: 250,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      {/* The 4 tab screens live in (tabs) subfolder — no back gesture on tabs */}
      <Stack.Screen name="tabs" options={{ animation: 'none', gestureEnabled: false }} />

      {/* All sub-screens push with slide animation + swipe-back gesture */}
      <Stack.Screen name="notifications" />
      <Stack.Screen name="job-detail" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="manage-services" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="payout-methods" />
      <Stack.Screen name="payment-history" />
      <Stack.Screen name="portfolio" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="language" />
      <Stack.Screen name="help-support" />
    </Stack>
  )
}