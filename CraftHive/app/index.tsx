// app/index.tsx
// Must NOT call router before Root Layout mounts.
// Solution: render nothing, use a ref to delay navigation by one frame.
import { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

export default function Index() {
  const router = useRouter()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    // requestAnimationFrame ensures Root Layout is fully mounted
    requestAnimationFrame(() => {
      router.replace('/(auth)/splash' as any)
    })
  }, [])

  return <View style={s.wrap} />
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B1F4D' },
})