// src/components/Icons.tsx — FINAL (adds SunIcon, MoonIcon, MonitorIcon, DollarSignIcon)
import React from 'react'
import Svg, { Path, Circle, Line, Polyline, Rect, G, Polygon } from 'react-native-svg'

interface P { size?: number; color?: string }
interface PF extends P { fill?: string }
const d = (size: number, color: string) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: color, strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

export const HomeIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>
export const CalendarIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></Svg>
export const ChatIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>
export const UserIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>
export const CreditCardIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><Line x1="1" y1="10" x2="23" y2="10" /></Svg>
export const SearchIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>
export const FilterIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="4" y1="6" x2="20" y2="6" /><Line x1="8" y1="12" x2="16" y2="12" /><Line x1="11" y1="18" x2="13" y2="18" /></Svg>
export const BellIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>
export const MapPinIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" /></Svg>
export const StarIcon = ({ size = 24, color = '#000', fill = 'none' }: PF) => <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>
export const ChevronRightIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polyline points="9 18 15 12 9 6" /></Svg>
export const ChevronDownIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polyline points="6 9 12 15 18 9" /></Svg>
export const ArrowLeftIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>
export const CheckIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polyline points="20 6 9 17 4 12" /></Svg>
export const CheckCircleIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" /></Svg>
export const XIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>
export const ClockIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>
export const ToolIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Svg>
export const SettingsIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="12" cy="12" r="3" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>
export const LogOutIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" /></Svg>
export const GlobeIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="12" cy="12" r="10" /><Line x1="2" y1="12" x2="22" y2="12" /><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Svg>
export const PhoneIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.09 6.09l.84-.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>
export const MailIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><Polyline points="22,6 12,13 2,6" /></Svg>
export const SendIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="22" y1="2" x2="11" y2="13" /><Polygon points="22 2 15 22 11 13 2 9 22 2" /></Svg>
export const NavigationIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polygon points="3 11 22 2 13 21 11 13 3 11" /></Svg>
export const TrendingUpIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><Polyline points="17 6 23 6 23 12" /></Svg>
export const DownloadIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" y1="15" x2="12" y2="3" /></Svg>
export const EditIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
export const ShieldIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>
export const HeartIcon = ({ size = 24, color = '#000', fill = 'none' }: PF) => <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></Svg>
export const VolumeIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><Path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><Path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></Svg>
export const BriefcaseIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></Svg>
export const ImageIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" /></Svg>
export const PlusIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>
export const TrashIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><Path d="M10 11v6M14 11v6" /><Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Svg>
export const InfoIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="12" /><Line x1="12" y1="16" x2="12.01" y2="16" /></Svg>
// NEW ICONS for theme switcher
export const SunIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Circle cx="12" cy="12" r="5" /><Line x1="12" y1="1" x2="12" y2="3" /><Line x1="12" y1="21" x2="12" y2="23" /><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><Line x1="1" y1="12" x2="3" y2="12" /><Line x1="21" y1="12" x2="23" y2="12" /><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></Svg>
export const MoonIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>
export const MonitorIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><Line x1="8" y1="21" x2="16" y2="21" /><Line x1="12" y1="17" x2="12" y2="21" /></Svg>
export const DollarSignIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Line x1="12" y1="1" x2="12" y2="23" /><Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>
export const EyeIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" /></Svg>
export const EyeOffIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><Line x1="1" y1="1" x2="23" y2="23" /></Svg>
export const TagIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><Line x1="7" y1="7" x2="7.01" y2="7" /></Svg>
export const TicketIcon = ({ size = 24, color = '#000' }: P) => <Svg {...d(size, color)}><Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><Line x1="9" y1="9" x2="9" y2="15" /></Svg>