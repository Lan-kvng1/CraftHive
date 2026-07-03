// app/(customer)/_layout.tsx  ← REPLACES current _layout.tsx
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

const SLIDE = Platform.OS === 'ios' ? 'default' : 'slide_from_right'

export default function CustomerStackLayout() {
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
      <Stack.Screen name="tabs" options={{ animation: 'none', gestureEnabled: false }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="artisan-detail" />
      <Stack.Screen name="book-artisan" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="payment-history" />
      <Stack.Screen name="review" />
      <Stack.Screen name="dispute" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="language" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="saved-artisans" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="rate-app" />
      <Stack.Screen name="my-reviews" />
    </Stack>
  )
}