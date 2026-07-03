// app/(customer)/tracking.tsx — Uber passenger style
// Full-screen map, artisan marker moves in real time via Supabase Realtime
// Real road route via Google Directions API (haversine fallback)
// Animated artisan marker + ETA/distance panel
import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator, Animated, Easing, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useLocalSearchParams } from 'expo-router'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { supabase } from '../../src/lib/supabase'
import { useAppTheme } from '../../src/hooks/useAppTheme'
import { useLang } from '../../src/context/LanguageContext'
import { ArrowLeftIcon, PhoneIcon, ChatIcon } from '../../src/components/Icons'

const NAVY = '#0A2463'
const G = '#1B4332'
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

export default function CustomerTracking() {
  const router = useRouter()
  const { C } = useAppTheme()
  const { t } = useLang()
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()

  const [booking, setBooking] = useState<any>(null)
  const [myLoc, setMyLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const [artisanLoc, setArtisanLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const [artisanHeading, setArtisanHeading] = useState(0)
  const [artisanOnline, setArtisanOnline] = useState(false)
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const mapRef = useRef<MapView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  // Pulse artisan marker when online
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    )
    if (artisanOnline) loop.start()
    else { loop.stop(); pulseAnim.setValue(1) }
    return () => loop.stop()
  }, [artisanOnline])

  // Load booking
  useEffect(() => {
    if (!bookingId) return
    const load = async () => {
      const { data: b } = await supabase.from('bookings')
        .select('*, artisan_profiles:artisan_id(user_id)')
        .eq('id', bookingId).single()
      if (b?.artisan_id) {
        const { data: p } = await supabase.from('profiles')
          .select('full_name, phone, avatar_url').eq('id', b.artisan_id).single()
        if (b.artisan_profiles) b.artisan_profiles.profile = p
      }
      setBooking(b)
      setLoading(false)
    }
    load()
  }, [bookingId])

  // Get customer's GPS position
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setMyLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
    })()
  }, [])

  // Fetch route from artisan → customer
  const fetchRoute = useCallback(async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) => {
    if (GMAPS_KEY) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&mode=driving&key=${GMAPS_KEY}`
        )
        const json = await res.json()
        const leg = json.routes?.[0]?.legs?.[0]
        if (leg) {
          setEtaMinutes(Math.round(leg.duration.value / 60))
          setDistanceKm(parseFloat((leg.distance.value / 1000).toFixed(1)))
          setRouteCoords(decodePolyline(json.routes[0].overview_polyline.points))
          return
        }
      } catch { }
    }
    // Fallback — straight line, haversine distance
    const km = haversine(from, to)
    setRouteCoords([from, to])
    setDistanceKm(parseFloat(km.toFixed(1)))
    setEtaMinutes(Math.round((km / 30) * 60))
  }, [])

  useEffect(() => {
    if (artisanLoc && myLoc) fetchRoute(artisanLoc, myLoc)
  }, [artisanLoc?.latitude, artisanLoc?.longitude, myLoc?.latitude, myLoc?.longitude])

  // Fit map to both markers when artisan first appears
  useEffect(() => {
    if (!artisanLoc || !myLoc) return
    setTimeout(() => {
      mapRef.current?.fitToCoordinates([artisanLoc, myLoc], {
        edgePadding: { top: 120, right: 60, bottom: 300, left: 60 },
        animated: true,
      })
    }, 500)
  }, [!!artisanLoc, !!myLoc])

  // Realtime subscription + polling fallback to artisan_locations
  useEffect(() => {
    if (!booking) return
    const artisanId = (booking.artisan_profiles as any)?.user_id
    if (!artisanId) return

    const fetchLatestLoc = () => {
      supabase.from('artisan_locations')
        .select('latitude, longitude, heading')
        .eq('artisan_id', artisanId)
        .eq('booking_id', bookingId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setArtisanLoc({ latitude: Number(data.latitude), longitude: Number(data.longitude) })
            setArtisanHeading(Number(data.heading) || 0)
            setArtisanOnline(true)
          }
        })
    }

    // Initial load
    fetchLatestLoc()

    const channel = supabase
      .channel(`track_${artisanId}_${bookingId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'artisan_locations'
      }, payload => {
        const rec = payload.new as any
        if (rec && rec.artisan_id === artisanId && rec.booking_id === bookingId) {
          if (rec.latitude && rec.longitude) {
            const loc = { latitude: Number(rec.latitude), longitude: Number(rec.longitude) }
            setArtisanLoc(loc)
            setArtisanHeading(Number(rec.heading) || 0)
            setArtisanOnline(true)
          }
        }
      })
      .subscribe()

    // 5-second polling fallback
    const pollInterval = setInterval(fetchLatestLoc, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [booking, bookingId])

  const artisanProfile = (booking?.artisan_profiles as any)?.profile
  const artisanName = artisanProfile?.full_name || t('job.detail.customer')
  const artisanPhone = artisanProfile?.phone

  const defaultRegion = myLoc
    ? { ...myLoc, latitudeDelta: 0.06, longitudeDelta: 0.06 }
    : { latitude: 5.6037, longitude: -0.1870, latitudeDelta: 0.06, longitudeDelta: 0.06 }

  const s = StyleSheet.create({
    map: { flex: 1 },
    topStrip: {
      position: 'absolute', top: 0, left: 0, right: 0,
      backgroundColor: NAVY,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 56 : 16,
      paddingBottom: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTxt: { flex: 1, fontSize: 17, fontWeight: '800', color: '#FFF' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statusBadge: {
      position: 'absolute', left: 16,
      top: Platform.OS === 'ios' ? 120 : 90,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
    },
    statusDot: { width: 9, height: 9, borderRadius: 5 },
    statusTxt: { fontSize: 13, color: '#FFF', fontWeight: '700' },
    recenterBtn: {
      position: 'absolute', right: 16, bottom: 280,
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
    artRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: G, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: GOLD,
    },
    avatarTxt: { color: '#FFF', fontWeight: '900', fontSize: 18 },
    artName: { fontSize: 17, fontWeight: '800', color: C.text },
    artStatus: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
    artBtns: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
    iconBtn: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: NAVY + '12', borderWidth: 1.5, borderColor: NAVY,
      alignItems: 'center', justifyContent: 'center',
    },
    statsRow: { flexDirection: 'row', marginBottom: 14 },
    stat: { flex: 1, alignItems: 'center' },
    divider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
    statLbl: { fontSize: 11, color: C.textSecondary, marginBottom: 4 },
    statVal: { fontSize: 24, fontWeight: '900', color: C.text },
    statUnit: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    waitNote: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: NAVY + '0D', borderRadius: 14, padding: 14,
    },
    waitTxt: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 19 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  })

  if (loading) return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={s.loadingWrap}><ActivityIndicator color={NAVY} size="large" /></View>
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />

      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
      >
        {/* Combined customer location marker with callout label */}
        {myLoc && (
          <Marker coordinate={myLoc} anchor={{ x: 0.5, y: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: GOLD, borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 4, marginBottom: 3,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: NAVY }}>{t('tracking.customerAt')}</Text>
              </View>
              <View style={{ width: 2, height: 8, backgroundColor: GOLD }} />
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: NAVY, borderWidth: 3, borderColor: '#FFF',
              }} />
            </View>
          </Marker>
        )}

        {/* Artisan (driver) moving marker */}
        {artisanLoc && (
          <Marker coordinate={artisanLoc} anchor={{ x: 0.5, y: 0.5 }} flat>
            <Animated.View style={{
              width: 50, height: 50, borderRadius: 25,
              backgroundColor: G, borderWidth: 3, borderColor: GOLD,
              alignItems: 'center', justifyContent: 'center',
              transform: [
                { rotate: `${artisanHeading}deg` },
                { scale: artisanOnline ? pulseAnim : 1 },
              ],
              shadowColor: G, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
            }}>
              <Text style={{ fontSize: 26 }}>🚗</Text>
            </Animated.View>
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <>
            <Polyline coordinates={routeCoords} strokeColor="rgba(0,0,0,0.15)" strokeWidth={9} lineCap="round" />
            <Polyline coordinates={routeCoords} strokeColor={NAVY} strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        )}
      </MapView>

      {/* Top strip */}
      <View style={s.topStrip}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeftIcon size={18} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTxt}>{t('tracking.title')}</Text>
          <Text style={s.headerSub}>{booking?.title || booking?.service_type || t('tracking.artisanOnWay')}</Text>
        </View>
        {artisanPhone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${artisanPhone}`)}>
            <PhoneIcon size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status badge */}
      <View style={[s.statusBadge, { backgroundColor: artisanOnline ? '#16A34A' : '#64748B' }]}>
        <Animated.View style={[s.statusDot, {
          backgroundColor: artisanOnline ? '#86EFAC' : '#CBD5E1',
          transform: [{ scale: artisanOnline ? pulseAnim : 1 }],
        }]} />
        <Text style={s.statusTxt}>
          {artisanOnline
            ? `${artisanName} ${t('tracking.artisanOnWay').toLowerCase()}`
            : t('tracking.noLocation')}
        </Text>
      </View>

      {/* Re-center */}
      {(artisanLoc || myLoc) && (
        <TouchableOpacity style={s.recenterBtn} onPress={() => {
          if (artisanLoc && myLoc) {
            mapRef.current?.fitToCoordinates([artisanLoc, myLoc], {
              edgePadding: { top: 120, right: 60, bottom: 300, left: 60 }, animated: true,
            })
          } else if (myLoc) {
            mapRef.current?.animateCamera({ center: myLoc, zoom: 15 }, { duration: 600 })
          }
        }}>
          <Text style={{ fontSize: 20 }}>◎</Text>
        </TouchableOpacity>
      )}

      {/* Bottom card */}
      <SafeAreaView style={s.card} edges={['bottom']}>
        <View style={s.artRow}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{artisanName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.artName}>{artisanName}</Text>
            <Text style={s.artStatus}>
              {artisanOnline ? `🟢 ${t('tracking.liveSharing')}` : `⚪ ${t('tracking.noLocation')}`}
            </Text>
          </View>
          <View style={s.artBtns}>
            {artisanPhone && (
              <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(`tel:${artisanPhone}`)}>
                <PhoneIcon size={16} color={NAVY} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.iconBtn}
              onPress={() => router.push({ pathname: '/(customer)/chat' as any, params: { bookingId } })}>
              <ChatIcon size={16} color={NAVY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ETA + Distance */}
        {artisanOnline && etaMinutes != null ? (
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statLbl}>{t('tracking.arriving')}</Text>
              <Text style={s.statVal}>{etaMinutes}</Text>
              <Text style={s.statUnit}>min</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Text style={s.statLbl}>{t('tracking.distance')}</Text>
              <Text style={s.statVal}>{distanceKm ?? '—'}</Text>
              <Text style={s.statUnit}>km</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Text style={s.statLbl}>{t('common.status')}</Text>
              <Text style={[s.statVal, { fontSize: 13, color: NAVY }]} numberOfLines={2}>
                {booking?.title || booking?.service_type || '—'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={s.waitNote}>
            <Text style={{ fontSize: 20 }}>📍</Text>
            <Text style={s.waitTxt}>
              {artisanName} {t('tracking.noLocation').toLowerCase()}. {t('common.tryAgain').toLowerCase()}.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  )
}
