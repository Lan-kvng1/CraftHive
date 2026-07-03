// src/hooks/useAppTheme.ts
import { useTheme } from '../context/ThemeContext'
import { Colors } from '../constants/colors'

export function useAppTheme() {
  const { isDark, mode, setMode } = useTheme()
  const C = isDark ? Colors.dark : Colors.light
  return { C, isDark, mode, setMode }
}