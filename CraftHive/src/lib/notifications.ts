import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Call this once at app startup (in _layout.tsx) so foreground notifications are visible
export function setupNotificationHandler() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    })
}

// Request permission, get Expo push token, save to Supabase
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    // Expo Go does not support remote push tokens from SDK 53+
    const isExpoGo = Constants.appOwnership === 'expo'
    if (isExpoGo) {
        console.log('Expo Go — skipping remote push token registration')
        return null
    }

    if (!Device.isDevice) {
        console.log('Push notifications only work on a real device')
        return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied')
        return null
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'CraftHive',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFB800',
            sound: 'default',
        })

        await Notifications.setNotificationChannelAsync('bookings', {
            name: 'New Bookings',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0A2463',
            sound: 'default',
        })
    }

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        process.env.EXPO_PUBLIC_PROJECT_ID

    if (!projectId) {
        console.log('No EAS project ID — skipping push token (Expo Go limitation)')
        return null
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
        const token = tokenData.data
        await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
        return token
    } catch (err) {
        console.warn('Failed to get push token:', err)
        return null
    }
}

// Send a local notification immediately — works in Expo Go for testing
export async function sendLocalNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: null,
    })
}
