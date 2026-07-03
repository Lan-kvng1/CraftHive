// app/(auth)/onboarding.tsx — FINAL
// Uses onboard1.jpg, onboard2.jpg, onboard3.jpg from assets/images/
// White background, image top, text bottom, navy dots + gold button
import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Animated, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'

const { width: W, height: H } = Dimensions.get('window')
const NAVY = '#0B1F4D'
const SECONDARY = '#173B8C'
const ACCENT = '#3A86FF'
const GOLD = '#FFB800'

const SLIDES = [
  {
    key: 's1',
    image: require('../../assets/images/onboard1.jpg'),
    title: 'Skilled Artisans,\nReady for You',
    subtitle: "Find and book Ghana's best plumbers, electricians, carpenters and more — all verified.",
  },
  {
    key: 's2',
    image: require('../../assets/images/onboard2.jpg'),
    title: 'Book in Minutes,\nNot Hours',
    subtitle: 'Browse real-time availability, pick a date and time, and confirm your booking instantly.',
  },
  {
    key: 's3',
    image: require('../../assets/images/onboard3.jpg'),
    title: 'Pay Safely,\nEvery Time',
    subtitle: 'Your money is held in escrow and only released when you confirm the job is done.',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const flatRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const finish = async () => {
    router.replace('/(auth)/login' as any)
  }

  const next = () => {
    if (idx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: idx + 1, animated: true })
    } else {
      finish()
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Skip button top right */}
      {idx < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skipBtn} onPress={finish}>
          <Text style={s.skipTxt}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={i => i.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          setIdx(Math.round(e.nativeEvent.contentOffset.x / W))
        }}
        renderItem={({ item }) => (
          <View style={s.slide}>
            {/* Image — top portion */}
            <View style={s.imageWrap}>
              <Image source={item.image} style={s.image} resizeMode="cover" />
            </View>
            {/* Text — bottom portion */}
            <View style={s.textWrap}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom: dots + button */}
      <View style={s.bottomRow}>
        {/* Animated dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * W, i * W, (i + 1) * W]
            const dotWidth = scrollX.interpolate({
              inputRange, outputRange: [8, 22, 8], extrapolate: 'clamp',
            })
            const bg = i === idx ? NAVY : '#CBD5E1'
            return (
              <Animated.View
                key={i}
                style={[s.dot, { width: dotWidth, backgroundColor: bg }]}
              />
            )
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={s.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={s.nextBtnTxt}>
            {idx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skipTxt: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
  slide: {
    width: W,
    flex: 1,
  },
  imageWrap: {
    width: W,
    height: H * 0.54,
    overflow: 'hidden',
    backgroundColor: '#F4F6FB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: NAVY,
    lineHeight: 36,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 25,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    backgroundColor: NAVY,
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  nextBtnTxt: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})