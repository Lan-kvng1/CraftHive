// app/(artisan)/tracking.tsx — Uber-driver style
// Full-screen map, no external browser
// Real road route drawn using Google Directions API (haversine fallback)
// Live GPS broadcast to Supabase via watchPositionAsync (battery-efficient)
// Real ETA + distance, rotating car marker, turn-by-turn strip
// Requires: EXPO_PUBLIC_GOOGLE_MAPS_KEY in .env
import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Animated, Easing, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/context/AuthContext'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import { ArrowLeftIcon, PhoneIcon, ChatIcon } from '../../src/components/Icons'

const G = '#1B4332'
const NAVY = '#0A2463'
const GOLD = '#FFB800'
const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ''

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
  }
  return points
}

function haversine(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371, dLat = (b.latitude - a.latitude) * Math.PI / 180
  const dLng = (b.longitude - a.longitude) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function ArtisanTracking() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { t } = useLang()
  const { user } = useAuth()
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()

  const [booking, setBooking] = useState<any>(null)
  const [myLoc, setMyLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const [destLoc, setDestLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [heading, setHeading] = useState(0)
  const [broadcasting, setBroadcasting] = useState(false)
  const [permGranted, setPermGranted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [currentStep, setCurrentStep] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [steps, setSteps] = useState<string[]>([])

  // watchPositionAsync subscription — replaces setInterval polling
  const watchSubRef = useRef<Location.LocationSubscription | null>(null)
  const mapRef = useRef<MapView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const destLocRef = useRef(destLoc)
  const stepsRef = useRef(steps)
  const stepIndexRef = useRef(stepIndex)
  const routeCoordsRef = useRef(routeCoords)

  // Keep refs in sync so the watch callback always has fresh values
  useEffect(() => { destLocRef.current = destLoc }, [destLoc])
  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => { stepIndexRef.current = stepIndex }, [stepIndex])
  useEffect(() => { routeCoordsRef.current = routeCoords }, [routeCoords])

  // Pulse animation for live dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    )
    if (broadcasting) loop.start()
    else { loop.stop(); pulseAnim.setValue(1) }
    return () => loop.stop()
  }, [broadcasting])

  // Load booking
  useEffect(() => {
    if (!bookingId) return
    supabase.from('bookings')
      .select('*, profiles:customer_id(full_name, phone)')
      .eq('id', bookingId).single()
      .then(({ data }) => { setBooking(data); setLoading(false) })
  }, [bookingId])

  // Geocode destination address — Google first, Nominatim fallback
  useEffect(() => {
    if (!booking?.address) return
    const geocode = async () => {
      if (GMAPS_KEY) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(booking.address)}&key=${GMAPS_KEY}`
          )
          const json = await res.json()
          if (json.results?.[0]) {
            const { lat, lng } = json.results[0].geometry.location
            setDestLoc({ latitude: lat, longitude: lng })
            return
          }
        } catch { }
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(booking.address)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'CraftHive/1.0' } }
        )
        const json = await res.json()
        if (json?.[0]) {
          setDestLoc({ latitude: parseFloat(json[0].lat), longitude: parseFloat(json[0].lon) })
        }
      } catch (e) { console.warn('Geocode fallback failed:', e) }
    }
    geocode()
  }, [booking?.address])

  // Fetch road route — falls back to straight line without a Google key
  const fetchDirections = useCallback(async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) => {
    if (GMAPS_KEY) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&mode=driving&key=${GMAPS_KEY}`
        )
        const json = await res.json()
        const route = json.routes?.[0]
        if (route) {
          const leg = route.legs[0]
          setEtaMinutes(Math.round(leg.duration.value / 60))
          setDistanceKm(parseFloat((leg.distance.value / 1000).toFixed(1)))
          setRouteCoords(decodePolyline(route.overview_polyline.points))
          const allSteps: string[] = leg.steps.map((s: any) => s.html_instructions.replace(/<[^>]+>/g, ''))
          setSteps(allSteps)
          setCurrentStep(allSteps[0] || '')
          setStepIndex(0)
          return
        }
      } catch { }
    }
    const km = haversine(from, to)
    setRouteCoords([from, to])
    setDistanceKm(parseFloat(km.toFixed(1)))
    setEtaMinutes(Math.round((km / 30) * 60))
    setCurrentStep(`${t('tracking.navigate')} → ${booking?.address || ''}`)
  }, [booking?.address])

  // Re-fetch directions whenever our position or destination changes
  useEffect(() => {
    if (myLoc && destLoc) fetchDirections(myLoc, destLoc)
  }, [myLoc?.latitude, myLoc?.longitude, destLoc?.latitude, destLoc?.longitude])

  // Location permission + initial position
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Please allow location access.')
        return
      }
      setPermGranted(true)
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setMyLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      setHeading(loc.coords.heading || 0)
    })()
  }, [])

  // Advance turn-by-turn step when close to next waypoint
  const advanceStep = (coords: { latitude: number; longitude: number }) => {
    const s = stepsRef.current
    const si = stepIndexRef.current
    const rc = routeCoordsRef.current
    if (!s.length || si >= s.length - 1 || !rc[si + 1]) return
    if (haversine(coords, rc[si + 1]) < 0.03) {
      const next = si + 1
      setStepIndex(next)
      setCurrentStep(s[next] || '')
    }
  }

  // Broadcast handler — called by watchPositionAsync on every GPS update
  const onLocationUpdate = useCallback(async (loc: Location.LocationObject) => {
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
    setMyLoc(coords)
    setHeading(loc.coords.heading || 0)
    advanceStep(coords)

    // Keep map centred on the artisan, tilted Uber-style
    mapRef.current?.animateCamera({
      center: coords,
      heading: loc.coords.heading || 0,
      pitch: 45,
      zoom: 17,
      altitude: 500,
    }, { duration: 1000 })

    // Broadcast to Supabase
    await supabase.from('artisan_locations').upsert({
      artisan_id: user?.id,
      booking_id: bookingId,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      heading: loc.coords.heading,
      speed: loc.coords.speed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'artisan_id,booking_id' })

    // Update live ETA from current position
    if (destLocRef.current) {
      const km = haversine(coords, destLocRef.current)
      setDistanceKm(parseFloat(km.toFixed(1)))
      setEtaMinutes(Math.round((km / 30) * 60))
    }
  }, [user, bookingId])

  const startBroadcasting = useCallback(async () => {
    if (!user || !bookingId || watchSubRef.current) return
    setBroadcasting(true)

    watchSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,   // update every 10 m moved
        timeInterval: 3000,     // or every 3 s, whichever comes first
      },
      onLocationUpdate
    )
  }, [user, bookingId, onLocationUpdate])

  const stopBroadcasting = useCallback(() => {
    watchSubRef.current?.remove()
    watchSubRef.current = null
    setBroadcasting(false)
  }, [])

  // Clean up watch on unmount
  useEffect(() => () => { watchSubRef.current?.remove() }, [])

  const customerName = booking?.profiles?.full_name || t('booking.detail.customer')
  const customerPhone = booking?.profiles?.phone

  const initialRegion = myLoc
    ? { ...myLoc, latitudeDelta: 0.015, longitudeDelta: 0.015 }
    : { latitude: 5.6037, longitude: -0.1870, latitudeDelta: 0.05, longitudeDelta: 0.05 }

  const s = StyleSheet.create({
    stepStrip: {
      position: 'absolute', top: 0, left: 0, right: 0,
      backgroundColor: NAVY, paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    stepTxt: { flex: 1, fontSize: 15, fontWeight: '700', color: '#FFF', lineHeight: 21 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
    },
    liveBadge: {
      position: 'absolute', top: Platform.OS === 'ios' ? 120 : 90, left: 16,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
    },
    liveDot: { width: 9, height: 9, borderRadius: 5 },
    liveTxt: { fontSize: 13, color: '#FFF', fontWeight: '700' },
    recenterBtn: {
      position: 'absolute', right: 16, bottom: 240,
      width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
    },
    card: {
      backgroundColor: C.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    custRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
    custAvatar: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    },
    custAvatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 18 },
    custName: { fontSize: 17, fontWeight: '800', color: C.text },
    custAddr: { fontSize: 13, color: C.textSecondary, marginTop: 2, lineHeight: 18 },
    custBtns: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
    iconBtn: {
      width: 40, height: 40, borderRadius: 14,
      backgroundColor: NAVY + '12', borderWidth: 1.5, borderColor: NAVY,
      alignItems: 'center', justifyContent: 'center',
    },
    statsRow: { flexDirection: 'row', gap: 0, marginBottom: 18 },
    stat: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
    statLabel: { fontSize: 11, color: C.textSecondary, marginBottom: 3 },
    statVal: { fontSize: 22, fontWeight: '900', color: C.text },
    statUnit: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
    btnRow: { flexDirection: 'row', gap: 12 },
    goLiveBtn: {
      flex: 1, borderRadius: 16, paddingVertical: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    goLiveTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  })

  if (loading) return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={s.loadingWrap}><ActivityIndicator color={G} size="large" /></View>
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={broadcasting}
        mapType="standard"
      >
        {/* Artisan (driver) marker — rotates with heading */}
        {myLoc && (
          <Marker coordinate={myLoc} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: G, borderWidth: 3, borderColor: '#FFF',
              alignItems: 'center', justifyContent: 'center',
              transform: [{ rotate: `${heading}deg` }],
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
            }}>
              <Text style={{ fontSize: 22 }}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Customer destination marker */}
        {destLoc && (
          <Marker coordinate={destLoc} anchor={{ x: 0.5, y: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: NAVY, borderRadius: 12,
                paddingHorizontal: 10, paddingVertical: 5, marginBottom: 4,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
              }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{customerName}</Text>
              </View>
              <View style={{
                backgroundColor: GOLD, width: 28, height: 28, borderRadius: 14,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: '#FFF',
              }}>
                <Text style={{ fontSize: 14 }}>📍</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Road route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={NAVY}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Turn-by-turn strip */}
      <View style={s.stepStrip}>
        <TouchableOpacity style={s.backBtn} onPress={() => {
          if (broadcasting) {
            Alert.alert(t('tracking.stopTracking'), t('booking.cancel.confirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('common.confirm'), style: 'destructive', onPress: () => { stopBroadcasting(); router.back() } },
            ])
          } else { router.back() }
        }}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.stepTxt} numberOfLines={2}>
          {currentStep || (broadcasting ? t('tracking.title') : `${t('tracking.navigate')} → ${customerName}`)}
        </Text>
        {customerPhone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
            <PhoneIcon size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Live badge */}
      <View style={[s.liveBadge, { backgroundColor: broadcasting ? '#16A34A' : '#64748B' }]}>
        <Animated.View style={[s.liveDot, {
          backgroundColor: broadcasting ? '#86EFAC' : '#CBD5E1',
          transform: [{ scale: broadcasting ? pulseAnim : 1 }],
        }]} />
        <Text style={s.liveTxt}>{broadcasting ? `● ${t('tracking.liveSharing')}` : `○ ${t('tracking.noLocation')}`}</Text>
      </View>

      {/* Re-center */}
      {myLoc && (
        <TouchableOpacity style={s.recenterBtn} onPress={() => {
          mapRef.current?.animateCamera({ center: myLoc, zoom: 17 }, { duration: 600 })
        }}>
          <Text style={{ fontSize: 20 }}>◎</Text>
        </TouchableOpacity>
      )}

      {/* Bottom card */}
      <SafeAreaView style={s.card} edges={['bottom']}>
        <View style={s.custRow}>
          <View style={s.custAvatar}>
            <Text style={s.custAvatarTxt}>{customerName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.custName}>{customerName}</Text>
            <Text style={s.custAddr} numberOfLines={2}>{booking?.address || t('common.loading')}</Text>
          </View>
          <View style={s.custBtns}>
            {customerPhone && (
              <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
                <PhoneIcon size={16} color={NAVY} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.iconBtn}
              onPress={() => router.push({ pathname: '/(artisan)/chat' as any, params: { bookingId } })}>
              <ChatIcon size={16} color={NAVY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ETA + Distance */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>{t('tracking.eta')}</Text>
            <Text style={s.statVal}>{etaMinutes != null ? etaMinutes : '—'}</Text>
            <Text style={s.statUnit}>min</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statLabel}>{t('tracking.distance')}</Text>
            <Text style={s.statVal}>{distanceKm != null ? distanceKm : '—'}</Text>
            <Text style={s.statUnit}>km</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statLabel}>{t('common.status')}</Text>
            <Text style={[s.statVal, { fontSize: 14, color: broadcasting ? '#16A34A' : '#94A3B8' }]}>
              {broadcasting ? t('common.active') : t('common.pending')}
            </Text>
          </View>
        </View>

        {/* Go Live / Stop button */}
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.goLiveBtn, { backgroundColor: broadcasting ? '#EF4444' : G }]}
            onPress={broadcasting ? stopBroadcasting : startBroadcasting}
            disabled={!permGranted}
            activeOpacity={0.85}>
            <Text style={s.goLiveTxt}>
              {broadcasting ? `⏹  ${t('tracking.stopTracking')}` : `▶  ${t('tracking.goLive')}`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}
