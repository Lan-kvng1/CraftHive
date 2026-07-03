# CraftHive — Complete Install & Run Guide

## Step 1 — Install ALL dependencies (one command)

```bash
npx expo install expo-speech expo-status-bar expo-router expo-image-picker \
  react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated \
  react-native-svg @react-native-async-storage/async-storage \
  && npm install @supabase/supabase-js --legacy-peer-deps
```

## Step 2 — Environment variables

Create `.env` in project root:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3 — Supabase database

1. Open Supabase → SQL Editor
2. Run `step1_drop_all.sql` first
3. Run `step2_schema.sql` second
4. Approve a test artisan after signing up:
```sql
UPDATE artisan_profiles SET status = 'approved' WHERE user_id = 'paste-uuid-here';
```

## Step 4 — Start the app

```bash
npx expo start --clear
```

---

## Complete file placement (FINAL)

### Root
```
app.json                    ← app_json_final2.json
babel.config.js             ← babel.config.js
tsconfig.json               ← tsconfig.json
```

### app/
```
_layout.tsx                 ← root_layout_final.tsx
index.tsx                   ← index_with_splash.tsx
```

### app/(auth)/
```
_layout.tsx                 ← auth_layout_complete2.tsx
splash.tsx                  ← splash_final.tsx
onboarding.tsx              ← onboarding_with_images.tsx
login.tsx                   ← login_final.tsx
register.tsx                ← register2.tsx
forgot-password.tsx         ← forgot_password.tsx
reset-password.tsx          ← reset_password.tsx          ← NEW
artisan-setup.tsx           ← artisan_setup2.tsx
artisan-pending.tsx         ← artisan_pending2.tsx
terms.tsx                   ← terms.tsx
privacy.tsx                 ← privacy.tsx
```

### app/(artisan)/
```
_layout.tsx                 ← artisan_layout_complete.tsx
home.tsx                    ← artisan_home_full.tsx
bookings.tsx                ← artisan_bookings.tsx
job-detail.tsx              ← job_detail.tsx
manage-booking.tsx          ← manage_booking.tsx
tracking.tsx                ← tracking.tsx (PRIMARY='#1B4332', IS_ARTISAN=true)
manage-services.tsx         ← manage_services.tsx
availability.tsx            ← availability.tsx
earnings.tsx                ← artisan_earnings.tsx
payout-methods.tsx          ← payout_methods.tsx
payment-history.tsx         ← artisan_payment_history.tsx
notifications.tsx           ← notifications_artisan.tsx
settings.tsx                ← artisan_settings.tsx
language.tsx                ← language.tsx (PRIMARY='#1B4332')
chat.tsx                    ← shared_chat.tsx (PRIMARY='#1B4332')
messages.tsx                ← shared_messages.tsx (PRIMARY='#1B4332', IS_ARTISAN=true)
profile.tsx                 ← artisan_profile.tsx
```

### app/(customer)/
```
_layout.tsx                 ← customer_layout_with_badge.tsx
home.tsx                    ← customer_home_full.tsx
bookings.tsx                ← customer_bookings.tsx
booking-detail.tsx          ← booking_detail_full.tsx
booking-status.tsx          ← booking_status.tsx
tracking.tsx                ← tracking.tsx (PRIMARY='#0A2463', IS_ARTISAN=false)
artisan-detail.tsx          ← artisan_detail.tsx
payment.tsx                 ← customer_payment.tsx
payment-methods.tsx         ← customer_payment_methods.tsx
payment-history.tsx         ← customer_payment_history.tsx
notifications.tsx           ← notifications_customer.tsx
review.tsx                  ← review.tsx
dispute.tsx                 ← dispute.tsx                  ← NEW
settings.tsx                ← customer_settings.tsx
language.tsx                ← customer_language.tsx
chat.tsx                    ← shared_chat.tsx (PRIMARY='#0A2463')
messages.tsx                ← shared_messages.tsx (PRIMARY='#0A2463', IS_ARTISAN=false)
profile.tsx                 ← customer_profile.tsx
```

### src/lib/
```
supabase.ts
```

### src/context/
```
AuthContext.tsx
LanguageContext.tsx
AudioContext.tsx
NotificationContext.tsx
```

### src/components/
```
AudioFAB.tsx
Skeleton.tsx                ← NEW
```

### src/constants/
```
colors.ts
i18n.ts
```

### assets/images/
```
logo.png        (your logo — for dark backgrounds)
logo-dark.png   (your dark logo — for light backgrounds)
onboard1.png    (onboarding slide 1)
onboard2.png    (onboarding slide 2)
onboard3.png    (onboarding slide 3)
```

---

## How to use Skeleton in screens

Replace loading blank screens with the skeleton components:

```tsx
import { SkeletonCard, HomePageSkeleton } from '../../src/components/Skeleton'

// In any screen with a loading state:
if (!data) return <HomePageSkeleton primaryColor="#0A2463" />

// Or inline in a list:
{loading ? (
  <>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </>
) : (
  data.map(item => <BookingCard key={item.id} item={item} />)
)}
```

---

## How to add the Dispute button to booking-detail.tsx

In `app/(customer)/booking-detail.tsx`, add this button in the completed/cancelled section:

```tsx
<TouchableOpacity
  style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    marginHorizontal: 16, marginTop: 10,
    borderWidth: 1.5, borderColor: '#EF4444' }}
  onPress={() => router.push({
    pathname: '/(customer)/dispute' as any,
    params: { bookingId: booking.id },
  })}
>
  <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600' }}>
    &#9888; Raise a Dispute
  </Text>
</TouchableOpacity>
```

Also add `dispute` to the hidden screens list in `customer_layout_with_badge.tsx`:
```tsx
<Tabs.Screen name="dispute" options={{ href: null }} />
```

---

## How to add reset-password to auth layout

In `app/(auth)/_layout.tsx`, add:
```tsx
<Stack.Screen name="reset-password" options={{ animation: 'slide_from_right' }} />
```

---

## Total screen count
- Auth:     11 screens
- Artisan:  17 screens
- Customer: 18 screens
- TOTAL:    46 screens