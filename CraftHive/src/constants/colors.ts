// src/constants/colors.ts
// ONLY color values — no imports, no components, no JSX

export const ARTISAN = '#1B4332'
export const ARTISAN_LIGHT = '#2D6A4F'
export const NAVY = '#0A2463'
export const NAVY_LIGHT = '#1E3A8A'
export const GOLD = '#FFB800'
export const BG = '#F4F6FB'
export const CARD = '#FFFFFF'
export const BORDER = '#E2E8F0'
export const GREEN_S = '#22C55E'
export const RED_S = '#EF4444'
export const ORANGE_S = '#F5A623'
export const BLUE_S = '#3E92CC'

export const STATUS: Record<string, string> = {
  pending: ORANGE_S,
  confirmed: BLUE_S,
  in_progress: NAVY,
  completed: GREEN_S,
  cancelled: RED_S,
}

export const Colors = {
  light: {
    background: BG,
    card: CARD,
    border: BORDER,
    text: '#1A202C',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    surface: '#F8FAFC',
    inputBg: '#F1F5F9',
    tabBar: CARD,
    tabBarInactive: '#94A3B8',
    error: RED_S,
  },
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    surface: '#1E293B',
    inputBg: '#334155',
    tabBar: '#1E293B',
    tabBarInactive: '#64748B',
    error: '#F87171',
  },
}