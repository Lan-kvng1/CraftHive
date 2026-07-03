// app/(auth)/_layout.tsx — FINAL
// Stack navigator with correct gesture config per screen
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="splash"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
      }}
    >
      {/* No back gesture on splash/login/onboarding */}
      <Stack.Screen name="splash" options={{ gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="login" options={{ gestureEnabled: false, animation: 'none' }} />

      {/* Back gesture enabled on these */}
      <Stack.Screen name="register" options={{ gestureEnabled: true }} />
      <Stack.Screen name="artisan-setup" options={{ gestureEnabled: true }} />
      <Stack.Screen name="artisan-pending" options={{ gestureEnabled: false }} />
      <Stack.Screen name="forgot-password" options={{ gestureEnabled: true }} />
      <Stack.Screen name="terms" options={{ gestureEnabled: true }} />
      <Stack.Screen name="privacy" options={{ gestureEnabled: true }} />
    </Stack>
  )
}