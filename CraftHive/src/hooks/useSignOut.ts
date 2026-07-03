// src/hooks/useSignOut.ts
// Use this hook everywhere instead of calling signOut directly.
// It signs out AND navigates to login in one call.
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'

export function useSignOut() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    // Replace the whole stack so user can't go back
    router.replace('/(auth)/login' as any)
  }

  return handleSignOut
}