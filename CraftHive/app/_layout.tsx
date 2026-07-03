// app/_layout.tsx
// ROOT STACK — handles ALL navigation.
// (customer) and (artisan) groups contain their 4 tabs.
// All sub-screens are registered in this root Stack for proper back nav.
import { Stack } from 'expo-router'
import { Platform } from 'react-native'
import { ThemeProvider } from '../src/context/ThemeContext'
import { LangProvider } from '../src/context/LanguageContext'
import { AuthProvider } from '../src/context/AuthContext'
import { NotificationProvider } from '../src/context/NotificationContext'
import { AudioProvider } from '../src/context/AudioContext'
import { DataSaverProvider } from '../src/context/DataSaverContext'
import { setupNotificationHandler } from '../src/lib/notifications'

// Register foreground notification handler once at app startup
setupNotificationHandler()

const SLIDE = Platform.OS === 'ios' ? 'default' : 'slide_from_right'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <NotificationProvider>
            <AudioProvider>
              <DataSaverProvider>
                <Stack
                  initialRouteName="(auth)"
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    animation: SLIDE,
                    animationDuration: 250,
                    contentStyle: { backgroundColor: '#FFFFFF' },
                  }}
                >
                  {/* Entry + Auth — no back gesture */}
                  <Stack.Screen name="index" options={{ animation: 'none', gestureEnabled: false }} />
                  <Stack.Screen name="(auth)" options={{ animation: 'none', gestureEnabled: false }} />

                  {/* Tab groups — no swipe off the tab bar itself */}
                  <Stack.Screen name="(customer)" options={{ animation: 'none', gestureEnabled: false }} />
                  <Stack.Screen name="(artisan)" options={{ animation: 'none', gestureEnabled: false }} />
                </Stack>
              </DataSaverProvider>
            </AudioProvider>
          </NotificationProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}