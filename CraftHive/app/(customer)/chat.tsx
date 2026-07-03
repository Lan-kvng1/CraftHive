// app/(customer)/chat.tsx — WhatsApp style
// Features: text, images, documents, location, voice messages
// Voice: hold mic → waveform preview → play before send → send or discard
// Messages: long-press → edit text / delete / copy
// Playback: tap voice bubble to play/pause
import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator, Alert, Linking,
  Animated, Easing, Modal, Pressable,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as Location from 'expo-location'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import { AppState } from 'react-native'
import { WebView } from 'react-native-webview'
import { supabase, getImageUrl } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useNotifications } from '../../src/context/NotificationContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import AudioFAB from '../../src/components/AudioFAB'
import Avatar from '../../src/components/Avatar'
import { notifyNewMessage } from '../../src/utils/sendNotification'
import {
  ArrowLeftIcon, SendIcon, ToolIcon,
  MapPinIcon, PhoneIcon, PlusIcon, XIcon, EditIcon, TrashIcon,
} from '../../src/components/Icons'

const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'
const GREEN = '#22C55E'
const TICK = '#53BDEB'

// ── Upload helper ─────────────────────────────────────────
async function uploadChatFile(uri: string, bucket: string, path: string, mime: string): Promise<string | null> {
  try {
    const { uploadToSupabase } = require('../../src/utils/fileUpload')
    return await uploadToSupabase(uri, bucket, path, mime)
  } catch (e) { console.error('Upload failed:', e); return null }
}

export default function CustomerChat() {
  const { bookingId, otherName } = useLocalSearchParams<{ bookingId: string; otherName?: string }>()
  const router = useRouter()
  const { C } = useAppTheme()
  const insets = useSafeAreaInsets()
  const isDark = C.background === '#121212' || C.background.toLowerCase().includes('#1') || C.background.toLowerCase().includes('#0')
  const chatBg = isDark ? '#0b141a' : '#efeae2'
  const { user, profile } = useAuth()
  const { refreshUnread } = useNotifications()

  const [messages, setMessages] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [artisan, setArtisan] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showAttach, setShowAttach] = useState(false)

  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [previewDuration, setPreviewDuration] = useState(0)
  const recordStartTime = useRef(0)
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Playback
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playingPos, setPlayingPos] = useState<Record<string, number>>({})
  const [playingDur, setPlayingDur] = useState<Record<string, number>>({})

  // Edit / delete context menu
  const [menuMsg, setMenuMsg] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState('')

  // In-app viewers
  const [imageViewUrl, setImageViewUrl] = useState<string | null>(null)
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null)
  const [webViewTitle, setWebViewTitle] = useState('')

  // Waveform animation
  const waveAnim = useRef([...Array(20)].map(() => new Animated.Value(0.3))).current

  const flatRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  // Players stored in refs for imperative control
  const playerRef = useRef<any>(null)
  const previewPlayerRef = useRef<any>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const audioIntervalRef = useRef<any>(null)
  const previewAudioIntervalRef = useRef<any>(null)

  // Request audio permissions on mount
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().catch(() => {})
    AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => {})
  }, [])

  // Update own last_seen every 30s
  useEffect(() => {
    const updateSeen = () => supabase.from('profiles')
      .update({ last_seen: new Date().toISOString() }).eq('id', user?.id)
    updateSeen()
    const t = setInterval(updateSeen, 30000)
    return () => clearInterval(t)
  }, [user?.id])

  // ── Load ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!bookingId || !user?.id) return
    const { data: b } = await supabase.from('bookings')
      .select('id, title, service_type, status, artisan_id').eq('id', bookingId).single()
    setBooking(b)

    if (b?.artisan_id) {
      const [{ data: ap }, { data: ap2 }] = await Promise.all([
        supabase.from('artisan_profiles').select('trade_category').eq('user_id', b.artisan_id).single(),
        supabase.from('profiles').select('id, full_name, avatar_url, phone, last_seen').eq('id', b.artisan_id).single(),
      ])
      setArtisan({ ...ap, ...ap2 })

      // Online status — active in last 5 minutes
      if (ap2?.last_seen) {
        const diff = Date.now() - new Date(ap2.last_seen).getTime()
        setIsOnline(diff < 5 * 60 * 1000)
      }
    }

    const { data: msgs } = await supabase.from('messages')
      .select('*').eq('booking_id', bookingId).eq('is_deleted', false)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])
    setLoading(false)

    // Mark incoming messages as read in DB, then sync local state immediately
    // so double-tick (✓✓) renders without waiting for a reload
    const { error } = await supabase.from('messages').update({ read: true })
      .eq('booking_id', bookingId).eq('receiver_id', user?.id).eq('read', false)
    if (error) console.error('Error marking as read:', error.message)
    setMessages(prev => prev.map(m => m.receiver_id === user?.id ? { ...m, read: true } : m))
    refreshUnread()
  }, [bookingId, user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return
    const ch = supabase.channel(`chat_${bookingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const { data: fullMsg } = await supabase.from('messages').select('*').eq('id', payload.new.id).single()
            const msg = fullMsg || payload.new
            if (msg.is_deleted) return
            
            // Mark as read IMMEDIATELY if we are the receiver and the chat is open!
            if (msg.receiver_id === user?.id) {
              supabase.from('messages').update({ read: true }).eq('id', msg.id)
              msg.read = true // Mutate before adding to state so it renders correctly
            }

            setMessages(prev => {
              const without = prev.filter(m => !m.id?.startsWith('temp_'))
              if (without.find((m: any) => m.id === msg.id)) return without
              return [...without, msg]
            })
            
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
          } else if (payload.eventType === 'UPDATE') {
            const { data: fullMsg } = await supabase.from('messages').select('*').eq('id', payload.new.id).single()
            if (fullMsg) {
              setMessages(prev => prev.map((m: any) => m.id === fullMsg.id ? fullMsg : m))
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter((m: any) => m.id !== payload.old.id))
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [bookingId, user?.id])

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 200)
  }, [loading])

  // Cleanup players on unmount
  useEffect(() => () => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current)
    if (previewAudioIntervalRef.current) clearInterval(previewAudioIntervalRef.current)
    try { try { playerRef.current?.remove() } catch { } } catch { }
    try { try { previewPlayerRef.current?.remove() } catch { } } catch { }
  }, [])

  // ── Send ──────────────────────────────────────────────────
  const send = async (
    content = text.trim(),
    type: 'text' | 'image' | 'audio' | 'document' | 'location' = 'text',
    payload: any = null
  ) => {
    if (!content && !payload) return
    if (!booking?.artisan_id || sending) return
    setSending(true)
    setText('')
    setShowAttach(false)

    const tempId = `temp_${Date.now()}`
    const tempMsg = {
      id: tempId, booking_id: bookingId,
      sender_id: user?.id, receiver_id: booking.artisan_id,
      content: content || '', payload: payload ? JSON.stringify(payload) : null,
      read: false, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)

    // Notify receiver
    if (booking.artisan_id) notifyNewMessage(booking.artisan_id, profile?.full_name || 'Customer', bookingId as string)

    await supabase.from('messages').insert({
      booking_id: bookingId, sender_id: user?.id,
      receiver_id: booking.artisan_id,
      content: content || '', payload: payload || null,
    })
    setSending(false)
  }

  // ── Edit ──────────────────────────────────────────────────
  const commitEdit = async () => {
    if (!menuMsg || !editText.trim()) return

    const currentPayload = getPayload(menuMsg) || {}
    const newPayload = { ...currentPayload, edited: true }

    await supabase.from('messages').update({ content: editText.trim(), payload: newPayload }).eq('id', menuMsg.id)
    setMessages(prev => prev.map(m => m.id === menuMsg.id ? { ...m, content: editText.trim(), payload: newPayload } : m))
    setMenuMsg(null)
    setEditMode(false)
    setEditText('')
  }

  // ── Delete ────────────────────────────────────────────────
  const deleteMsg = async (msg: any) => {
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('messages').update({ is_deleted: true, content: null, payload: null }).eq('id', msg.id)
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted: true, content: null, payload: null } : m))
          setMenuMsg(null)
        }
      },
    ])
  }

  // ── Image picker ──────────────────────────────────────────
  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 })
    if (r.canceled || !r.assets[0]) return
    setSending(true); setShowAttach(false)
    const asset = r.assets[0]
    const ext = asset.uri.split('.').pop() || 'jpg'
    const url = await uploadChatFile(asset.uri, 'chat-media', `chat/${bookingId}/${user?.id}_${Date.now()}.${ext}`, `image/${ext}`)
    if (!url) { Alert.alert('Upload failed', 'Could not send image.'); setSending(false); return }
    await send('📷 Image', 'image', { type: 'image', url, width: asset.width, height: asset.height })
    setSending(false)
  }

  // ── Document picker ───────────────────────────────────────
  const pickDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
    if (r.canceled || !r.assets?.[0]) return
    setSending(true); setShowAttach(false)
    const asset = r.assets[0]
    const url = await uploadChatFile(asset.uri, 'chat-media', `chat/${bookingId}/${user?.id}_${Date.now()}_${asset.name}`, asset.mimeType || 'application/octet-stream')
    if (!url) { Alert.alert('Upload failed', 'Could not send document.'); setSending(false); return }
    await send(`📎 ${asset.name}`, 'document', { type: 'document', url, name: asset.name, size: asset.size })
    setSending(false)
  }

  // ── Location ──────────────────────────────────────────────
  const shareLocation = async () => {
    setShowAttach(false)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission denied'); return }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    const { latitude, longitude } = loc.coords
    await send('📍 Location', 'location', { type: 'location', latitude, longitude, url: `https://maps.google.com/?q=${latitude},${longitude}` })
  }

  // ── Waveform animation ────────────────────────────────────
  const startWave = () => {
    const animations = waveAnim.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 0.2 + Math.random() * 0.8, duration: 200 + i * 30, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(v, { toValue: 0.2 + Math.random() * 0.4, duration: 200 + i * 30, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]))
    )
    Animated.parallel(animations).start()
  }
  const stopWave = () => { waveAnim.forEach(v => { v.stopAnimation(); v.setValue(0.3) }) }

  // ── Recording ─────────────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync()
      if (!granted) { Alert.alert('Permission denied', 'Microphone access required.'); return }
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldRouteThroughEarpiece: false })
      await recorder.prepareToRecordAsync()
      recorder.record()
      setIsRecording(true)
      setRecordingDuration(0)
      recordStartTime.current = Date.now()
      startWave()
      durationTimer.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordStartTime.current) / 1000))
      }, 1000)
    } catch (e) { console.error('Recording failed:', e) }
  }

  const stopRecording = async () => {
    setIsRecording(false)
    stopWave()
    if (durationTimer.current) { clearInterval(durationTimer.current); durationTimer.current = null }
    try {
      await recorder.stop()
      const uri = recorder.uri
      await AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false })
      const dur = Math.floor((Date.now() - recordStartTime.current) / 1000)
      if (!uri || dur < 1) return
      setPreviewUri(uri)
      setPreviewDuration(dur)
    } catch (e) { console.error('Stop recording failed:', e) }
  }

  const cancelPreview = () => {
    if (previewAudioIntervalRef.current) {
      clearInterval(previewAudioIntervalRef.current)
      previewAudioIntervalRef.current = null
    }
    try { try { previewPlayerRef.current?.remove() } catch { } } catch { }
    previewPlayerRef.current = null
    setPreviewPlaying(false)
    setPreviewUri(null)
    setPreviewDuration(0)
  }

  const sendPreview = async () => {
    if (!previewUri) return
    setSending(true)
    if (previewAudioIntervalRef.current) {
      clearInterval(previewAudioIntervalRef.current)
      previewAudioIntervalRef.current = null
    }
    try { try { previewPlayerRef.current?.remove() } catch { } } catch { }
    previewPlayerRef.current = null
    setPreviewPlaying(false)
    const path = `chat/${bookingId}/${user?.id}_${Date.now()}.m4a`
    const url = await uploadChatFile(previewUri, 'chat-media', path, 'audio/m4a')
    if (!url) { Alert.alert('Upload failed'); setSending(false); return }
    await new Promise(res => setTimeout(res, 400))
    await send('🎵 Voice message', 'audio', { type: 'audio', url, duration: previewDuration })
    setPreviewUri(null); setPreviewDuration(0); setSending(false)
  }

  // ── Playback — expo-audio createAudioPlayer ───────────────
  const playAudio = async (id: string, url: string) => {
    try {
      await AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false })
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
        audioIntervalRef.current = null
      }
      if (playerRef.current) {
        try { playerRef.current?.remove() } catch { }
        playerRef.current = null
      }
      if (playingId === id) { setPlayingId(null); return }
      setPlayingId(id)
      const { createAudioPlayer } = require('expo-audio')
      // Must use { uri } object for remote URLs — bare string is treated as a local asset path
      const p = createAudioPlayer({ uri: url })
      playerRef.current = p
      p.play()
      const check = setInterval(() => {
        if (!playerRef.current) {
          clearInterval(check)
          audioIntervalRef.current = null
          return
        }
        try {
          const pos = p.currentTime || 0
          const dur = p.duration || 0
          setPlayingPos(prev => ({ ...prev, [id]: pos }))
          if (dur > 0) {
            setPlayingDur(prev => ({ ...prev, [id]: dur }))
            if (pos >= dur - 0.1) {
              clearInterval(check)
              audioIntervalRef.current = null
              setPlayingId(null)
              playerRef.current = null
              setPlayingPos(prev => ({ ...prev, [id]: 0 }))
              try { p.remove() } catch { }
            }
          }
        } catch {
          clearInterval(check)
          audioIntervalRef.current = null
          setPlayingId(null)
          playerRef.current = null
        }
      }, 250)
      audioIntervalRef.current = check
    } catch (e) {
      console.error('Playback failed:', e)
      Alert.alert('Playback Error', 'Could not play audio. Please try again.')
      setPlayingId(null); playerRef.current = null
    }
  }

  const playPreview = async () => {
    if (previewPlaying) {
      if (previewAudioIntervalRef.current) {
        clearInterval(previewAudioIntervalRef.current)
        previewAudioIntervalRef.current = null
      }
      try { try { previewPlayerRef.current?.remove() } catch { } } catch { }
      previewPlayerRef.current = null
      setPreviewPlaying(false); return
    }
    if (!previewUri) return
    try {
      await AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false })
      if (previewAudioIntervalRef.current) {
        clearInterval(previewAudioIntervalRef.current)
        previewAudioIntervalRef.current = null
      }
      const { createAudioPlayer } = require('expo-audio')
      // { uri } required — local file URIs also need this object form in expo-audio
      const p = createAudioPlayer({ uri: previewUri })
      previewPlayerRef.current = p
      p.play()
      setPreviewPlaying(true)
      const check = setInterval(() => {
        if (!previewPlayerRef.current) {
          clearInterval(check)
          previewAudioIntervalRef.current = null
          return
        }
        try {
          const pos = p.currentTime || 0
          const dur = p.duration || 0
          if (dur > 0 && pos >= dur - 0.1) {
            clearInterval(check)
            previewAudioIntervalRef.current = null
            setPreviewPlaying(false)
            previewPlayerRef.current = null
            try { p.remove() } catch { }
          }
        } catch {
          clearInterval(check)
          previewAudioIntervalRef.current = null
          setPreviewPlaying(false)
          previewPlayerRef.current = null
        }
      }, 250)
      previewAudioIntervalRef.current = check
    } catch (e) { console.error('Preview playback failed:', e) }
  }

  // ── Helpers ───────────────────────────────────────────────
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })
  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const getPayload = (msg: any) => {
    try {
      if (!msg.payload) return null
      if (typeof msg.payload === 'object') return msg.payload
      if (typeof msg.payload === 'string') return JSON.parse(msg.payload)
      return null
    } catch { return null }
  }

  const artisanName = artisan?.full_name || otherName || 'Artisan'
  const tradeCategory = (artisan?.trade_category || '').replace(/&#[0-9]+;/g, '').trim()

  const groupedMessages = () => {
    const groups: { date: string; msgs: any[] }[] = []
    messages.forEach((msg: any) => {
      const date = fmtDate(msg.created_at)
      const last = groups[groups.length - 1]
      if (last && last.date === date) last.msgs.push(msg)
      else groups.push({ date, msgs: [msg] })
    })
    return groups
  }

  // ── Bubble renderer ───────────────────────────────────────
  // ── Bubble renderer ───────────────────────────────────────
  const renderBubble = (msg: any, isMe: boolean) => {
    const p = getPayload(msg)
    const footerColor = isMe
      ? (isDark ? '#8696a0' : '#54656f')
      : (isDark ? '#8696a0' : '#667781')

    const footer = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, justifyContent: 'flex-end' }}>
        <Text style={[s.timeTxt, { color: footerColor }]}>{fmtTime(msg.created_at)}</Text>
        {isMe && <Text style={{ fontSize: 12, color: msg.read ? TICK : (isDark ? '#8696a0' : '#8696a0') }}>{msg.read ? '✓✓' : '✓'}</Text>}
        {p?.edited && <Text style={[s.timeTxt, { fontSize: 10, color: footerColor, fontStyle: 'italic', marginLeft: 2 }]}>edited</Text>}
      </View>
    )

    if (msg.is_deleted) {
      return (
        <View>
          <Text style={[isMe ? s.myText : s.theirText, { fontStyle: 'italic', color: isDark ? '#8696a0' : '#667781' }]}>
            🚫 This message was deleted
          </Text>
          {footer}
        </View>
      )
    }

    if (p?.type === 'image') return (
      <TouchableOpacity onPress={() => setImageViewUrl(p.url)} style={{ padding: 2 }}>
        <Image source={{ uri: p.url }} style={{ width: 220, height: 160, borderRadius: 10 }} resizeMode="cover" />
        <View style={{ paddingHorizontal: 4 }}>{footer}</View>
      </TouchableOpacity>
    )

    if (p?.type === 'audio') {
      const dur = p.duration || playingDur[msg.id] || 0
      const pos = playingPos[msg.id] || 0
      const prog = dur > 0 ? pos / dur : 0
      const isNowPlaying = playingId === msg.id
      const voiceColor = isMe ? (isDark ? '#00a884' : '#075e54') : (isDark ? '#00a884' : '#075e54')
      return (
        <View style={{ minWidth: 200, paddingVertical: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isMe ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'rgba(0,0,0,0.05)' }}
              onPress={() => playAudio(msg.id, p.url)}>
              <Text style={{ fontSize: 16, color: voiceColor }}>{isNowPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, height: 4, backgroundColor: isMe ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
              <View style={{ width: `${prog * 100}%`, height: 4, backgroundColor: voiceColor, borderRadius: 2 }} />
            </View>
            <Text style={[s.timeTxt, { color: footerColor }]}>{fmtDur(isNowPlaying ? Math.round(pos) : dur)}</Text>
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </View>
          {footer}
        </View>
      )
    }

    if (p?.type === 'document') return (
      <TouchableOpacity onPress={() => { setWebViewUrl(p.url); setWebViewTitle(p.name || 'Document') }} style={{ padding: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#107C41', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, color: '#FFF' }}>📄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[isMe ? s.myText : s.theirText, { fontWeight: '600', fontSize: 13 }]} numberOfLines={1}>{p.name}</Text>
            {p.size && <Text style={[s.timeTxt, { color: footerColor }]}>{(p.size / 1024).toFixed(0)} KB</Text>}
          </View>
        </View>
        {footer}
      </TouchableOpacity>
    )

    if (p?.type === 'location') return (
      <TouchableOpacity onPress={() => { setWebViewUrl(p.url); setWebViewTitle('Location') }} style={{ padding: 2 }}>
        <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)' }}>
          <View style={{ height: 80, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32 }}>📍</Text>
          </View>
          <View style={{ padding: 8 }}>
            <Text style={[isMe ? s.myText : s.theirText, { fontWeight: '700', fontSize: 13 }]}>Shared Location</Text>
            <Text style={[s.timeTxt, { color: footerColor, fontSize: 11 }]}>Tap to view on map</Text>
          </View>
        </View>
        {footer}
      </TouchableOpacity>
    )

    return (
      <View>
        <Text style={isMe ? s.myText : s.theirText}>{msg.content}</Text>
        {footer}
      </View>
    )
  }

  // ── Styles ────────────────────────────────────────────────
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: NAVY },
    header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    artisanInfo: { flex: 1 },
    artisanName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
    artisanSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
    avatarSmall: { width: 38, height: 38, borderRadius: 12, borderWidth: 2, borderColor: GOLD },
    avatarSmallFall: { width: 38, height: 38, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
    avatarSmallTxt: { color: NAVY, fontWeight: '900', fontSize: 14 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusTxt: { fontSize: 11, color: '#FFF', fontWeight: '600' },
    body: { flex: 1, backgroundColor: chatBg },
    msgList: { paddingHorizontal: 12, paddingVertical: 12 },
    dateSep: { alignItems: 'center', marginVertical: 12 },
    dateTxt: { fontSize: 11, color: isDark ? '#8696a0' : '#54656f', backgroundColor: isDark ? '#182229' : '#ffffff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 1, elevation: 1 },
    msgRow: { marginBottom: 8 },
    myMsgRow: { alignItems: 'flex-end' },
    theirRow: { alignItems: 'flex-start' },
    bubble: { maxWidth: '82%', padding: 10, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    myBubble: { backgroundColor: ACCENT, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: isDark ? '#2A2C36' : '#F2F4F7', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 4 },
    myText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
    theirText: { fontSize: 15, color: isDark ? '#FFFFFF' : '#111827', lineHeight: 22 },
    timeTxt: { fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280' },
    // Input bar
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 6, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) + 8, backgroundColor: 'transparent' },
    inputCapsule: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: isDark ? '#202c33' : '#ffffff', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 4, minHeight: 40, maxHeight: 120, borderWidth: 1, borderColor: isDark ? '#2c3e46' : '#e1e8eb' },
    attachBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, fontSize: 16, color: isDark ? '#e9edef' : '#111b21', paddingHorizontal: 8, paddingVertical: 6, minHeight: 30, maxHeight: 100 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00a884', alignItems: 'center', justifyContent: 'center' },
    // Recording bar
    recordBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 8) + 10, backgroundColor: isDark ? '#202c33' : '#ffffff', borderTopWidth: 1, borderTopColor: isDark ? '#2c3e46' : '#e1e8eb' },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    recDurTxt: { fontSize: 15, fontWeight: '700', color: '#EF4444', minWidth: 40 },
    waveWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 },
    waveLine: { width: 3, borderRadius: 2, backgroundColor: NAVY },
    // Preview bar (after recording, before sending)
    previewBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 8) + 10, backgroundColor: isDark ? '#202c33' : '#ffffff', borderTopWidth: 1, borderTopColor: isDark ? '#2c3e46' : '#e1e8eb' },
    previewPlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    // Attachment tray
    attachTray: { backgroundColor: isDark ? '#1f2c34' : '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 24, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 },
    attachOption: { alignItems: 'center', gap: 6 },
    attachIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    attachLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
    // Context menu modal
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    menuSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    menuItemLast: { borderBottomWidth: 0 },
    menuItemTxt: { fontSize: 16, color: C.text, fontWeight: '600' },
    menuItemRed: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
    editInput: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: NAVY, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.text, marginBottom: 12 },
    editSaveBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    // Empty
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTxt: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12 },
    emptyTxt2: { fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  })

  const groups = groupedMessages()

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Avatar
          uri={artisan?.avatar_url}
          name={artisanName}
          size={38}
          radius={12}
          fallbackBg={GOLD}
          fallbackTextColor={NAVY}
          borderWidth={2}
          borderColor={GOLD}
        />
        <View style={s.artisanInfo}>
          <Text style={s.artisanName}>{artisanName}</Text>
          <Text style={s.artisanSub}>{tradeCategory || 'Artisan'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[s.statusPill, { backgroundColor: isOnline ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <View style={[s.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#94A3B8' }]} />
            <Text style={s.statusTxt}>{isOnline ? 'Online' : 'Last seen recently'}</Text>
          </View>
          {artisan?.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${artisan.phone}`)}>
              <PhoneIcon size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            style={s.body}
            contentContainerStyle={[s.msgList, messages.length === 0 && { flex: 1 }]}
            data={groups}
            keyExtractor={g => g.date}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <ToolIcon size={48} color={C.textMuted} />
                <Text style={s.emptyTxt}>No messages yet</Text>
                <Text style={s.emptyTxt2}>Send a message to {artisanName}.</Text>
              </View>
            }
            renderItem={({ item: group }) => (
              <View>
                <View style={s.dateSep}><Text style={s.dateTxt}>{group.date}</Text></View>
                {group.msgs.map((msg: any) => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <Pressable
                      key={msg.id}
                      style={[s.msgRow, isMe ? s.myMsgRow : s.theirRow]}
                      onLongPress={() => {
                        if (msg.id?.startsWith('temp_')) return
                        setMenuMsg(msg)
                        setEditText(msg.content || '')
                        setEditMode(false)
                      }}>
                      <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                        {renderBubble(msg, isMe)}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            )}
          />
        )}

        {showAttach && (
          <View style={s.attachTray}>
            <TouchableOpacity style={s.attachOption} onPress={pickImage}>
              <View style={[s.attachIconWrap, { backgroundColor: '#3B82F6' }]}><Text style={{ fontSize: 22 }}>🖼️</Text></View>
              <Text style={s.attachLabel}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachOption} onPress={pickDocument}>
              <View style={[s.attachIconWrap, { backgroundColor: '#F59E0B' }]}><Text style={{ fontSize: 22 }}>📎</Text></View>
              <Text style={s.attachLabel}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachOption} onPress={shareLocation}>
              <View style={[s.attachIconWrap, { backgroundColor: GREEN }]}><MapPinIcon size={22} color="#FFF" /></View>
              <Text style={s.attachLabel}>Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {isRecording && (
          <View style={s.recordBar}>
            <Animated.View style={[s.recDot]} />
            <Text style={s.recDurTxt}>{fmtDur(recordingDuration)}</Text>
            <View style={s.waveWrap}>
              {waveAnim.map((v, i) => (
                <Animated.View key={i} style={[s.waveLine, { transform: [{ scaleY: v }], height: 24 }]} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Release to send</Text>
          </View>
        )}

        {!isRecording && previewUri && (
          <View style={s.previewBar}>
            <TouchableOpacity style={s.backBtn} onPress={cancelPreview}>
              <TrashIcon size={16} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity style={s.previewPlayBtn} onPress={playPreview}>
              <Text style={{ fontSize: 18 }}>{previewPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.textSecondary, fontWeight: '600' }}>Voice message · {fmtDur(previewDuration)}</Text>
              <Text style={{ fontSize: 11, color: C.textMuted }}>{previewPlaying ? 'Playing...' : 'Tap ▶ to preview before sending'}</Text>
            </View>
            <TouchableOpacity style={[s.sendBtn, { backgroundColor: GREEN }]} onPress={sendPreview} disabled={sending}>
              {sending ? <ActivityIndicator color="#FFF" size="small" /> : <SendIcon size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
        )}

        {!previewUri && (
          <View style={s.inputBar}>
            <View style={s.inputCapsule}>
              <TouchableOpacity style={s.attachBtn} onPress={() => setShowAttach(v => !v)}>
                <PlusIcon size={20} color={isDark ? '#8696a0' : '#54656f'} />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={text}
                onChangeText={v => { setText(v); setShowAttach(false) }}
                placeholder={isRecording ? 'Recording...' : 'Message'}
                placeholderTextColor={isDark ? '#8696a0' : '#94a3b8'}
                multiline
                editable={!isRecording}
              />
            </View>
            {text.trim() && !isRecording ? (
              <TouchableOpacity style={s.sendBtn} onPress={() => send()} disabled={sending} activeOpacity={0.8}>
                {sending ? <ActivityIndicator color="#FFF" size="small" /> : <SendIcon size={18} color="#FFF" />}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.sendBtn, { backgroundColor: isRecording ? '#EF4444' : '#00a884' }]}
                onLongPress={startRecording}
                onPressOut={() => { if (isRecording) stopRecording() }}
                onPress={() => { if (!isRecording) Alert.alert('Voice Message', 'Hold the 🎙️ button to record. Release to preview before sending.') }}
                delayLongPress={300}
                activeOpacity={0.8}>
                <Text style={{ fontSize: 18, color: '#FFF' }}>{isRecording ? '⏹' : '🎙️'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Context menu */}
      <Modal visible={!!menuMsg} transparent animationType="slide" onRequestClose={() => setMenuMsg(null)}>
        <Pressable style={s.menuOverlay} onPress={() => { setMenuMsg(null); setEditMode(false) }}>
          <Pressable style={s.menuSheet} onPress={e => e.stopPropagation()}>
            {!editMode ? (
              <>
                {menuMsg?.sender_id === user?.id && !getPayload(menuMsg) && (
                  <TouchableOpacity style={s.menuItem} onPress={() => setEditMode(true)}>
                    <EditIcon size={20} color={NAVY} />
                    <Text style={s.menuItemTxt}>Edit Message</Text>
                  </TouchableOpacity>
                )}
                {menuMsg?.sender_id === user?.id && (
                  <TouchableOpacity style={[s.menuItem, s.menuItemLast]} onPress={() => menuMsg && deleteMsg(menuMsg)}>
                    <TrashIcon size={20} color="#EF4444" />
                    <Text style={s.menuItemRed}>Delete Message</Text>
                  </TouchableOpacity>
                )}
                {menuMsg?.sender_id !== user?.id && (
                  <View style={[s.menuItem, s.menuItemLast]}>
                    <Text style={{ color: C.textSecondary, fontSize: 14 }}>You can only edit or delete your own messages.</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12 }}>Edit Message</Text>
                <TextInput style={s.editInput} value={editText} onChangeText={setEditText} multiline autoFocus />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[s.editSaveBtn, { flex: 1, backgroundColor: C.border }]} onPress={() => setEditMode(false)}>
                    <Text style={{ color: C.text, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.editSaveBtn, { flex: 2 }]} onPress={commitEdit}>
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <AudioFAB pageText={`Chat with ${artisanName}. ${messages.length} messages.`} />

      {/* Full-screen image viewer */}
      <Modal visible={!!imageViewUrl} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setImageViewUrl(null)}>
            <XIcon size={20} color="#FFF" />
          </TouchableOpacity>
          {imageViewUrl && <Image source={{ uri: imageViewUrl }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
        </View>
      </Modal>

      {/* WebView for documents and location */}
      <Modal visible={!!webViewUrl} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: NAVY }}>
            <TouchableOpacity
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setWebViewUrl(null)}>
              <ArrowLeftIcon size={18} color="#FFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1 }} numberOfLines={1}>{webViewTitle}</Text>
          </View>
          {webViewUrl && (
            <WebView source={{ uri: webViewUrl }} style={{ flex: 1 }} startInLoadingState
              renderLoading={() => <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={NAVY} size="large" /></View>}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}