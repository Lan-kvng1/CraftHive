# CraftHive — Complete Final File Map
# Every file in the project and exactly where it goes

## ROOT
app.json                              ← app_json_final.json
babel.config.js                       ← babel.config.js (from earlier)
tsconfig.json                         ← tsconfig.json (from earlier)

## app/
_layout.tsx                           ← root_layout_final.tsx
index.tsx                             ← index_with_splash.tsx

## app/(auth)/
_layout.tsx                           ← auth_layout_final.tsx
splash.tsx                            ← splash_screen.tsx
onboarding.tsx                        ← onboarding_with_images.tsx
login.tsx                             ← login_with_logo.tsx

## app/(artisan)/
_layout.tsx                           ← artisan_layout_with_badge.tsx
home.tsx                              ← artisan_home_full.tsx
bookings.tsx                          ← artisan_bookings.tsx
job-detail.tsx                        ← job_detail.tsx
manage-booking.tsx                    ← manage_booking.tsx
tracking.tsx                          ← tracking.tsx (PRIMARY='#1B4332', IS_ARTISAN=true)
manage-services.tsx                   ← manage_services.tsx
availability.tsx                      ← availability.tsx
earnings.tsx                          ← artisan_earnings.tsx
payout-methods.tsx                    ← payout_methods.tsx
payment-history.tsx                   ← artisan_payment_history.tsx
notifications.tsx                     ← notifications_artisan.tsx
settings.tsx                          ← artisan_settings.tsx
language.tsx                          ← language.tsx (PRIMARY='#1B4332')
chat.tsx                              ← shared_chat.tsx (PRIMARY='#1B4332')
messages.tsx                          ← shared_messages.tsx (PRIMARY='#1B4332', IS_ARTISAN=true)
profile.tsx                           ← artisan_profile.tsx

## app/(customer)/
_layout.tsx                           ← customer_layout_with_badge.tsx
home.tsx                              ← customer_home_full.tsx
bookings.tsx                          ← customer_bookings.tsx
booking-detail.tsx                    ← booking_detail_full.tsx
booking-status.tsx                    ← booking_status.tsx
tracking.tsx                          ← tracking.tsx (PRIMARY='#0A2463', IS_ARTISAN=false)
artisan-detail.tsx                    ← artisan_detail.tsx
payment.tsx                           ← customer_payment.tsx
payment-methods.tsx                   ← customer_payment_methods.tsx
payment-history.tsx                   ← customer_payment_history.tsx
notifications.tsx                     ← notifications_customer.tsx
review.tsx                            ← review.tsx
settings.tsx                          ← customer_settings.tsx
language.tsx                          ← customer_language.tsx
chat.tsx                              ← shared_chat.tsx (PRIMARY='#0A2463')
messages.tsx                          ← shared_messages.tsx (PRIMARY='#0A2463', IS_ARTISAN=false)
profile.tsx                           ← customer_profile.tsx

## src/lib/
supabase.ts                           ← supabase.ts

## src/context/
AuthContext.tsx                       ← AuthContext.tsx
LanguageContext.tsx                   ← LanguageContext.tsx
AudioContext.tsx                      ← AudioContext.tsx
NotificationContext.tsx               ← NotificationContext.tsx

## src/components/
AudioFAB.tsx                          ← AudioFAB.tsx

## src/constants/
colors.ts                             ← colors.ts
i18n.ts                               ← i18n.ts

## assets/images/   (YOU ALREADY HAVE THESE)
logo.png                              ← your logo (for dark backgrounds)
logo-dark.png                         ← your dark logo (for light backgrounds)
onboard1.png                          ← onboarding slide 1 image
onboard2.png                          ← onboarding slide 2 image
onboard3.png                          ← onboarding slide 3 image

## Supabase SQL (run in Supabase SQL Editor)
step1_drop_all.sql                    ← drop old tables first
step2_schema.sql                      ← create fresh schema

## SHARED FILES — MUST DUPLICATE WITH DIFFERENT CONSTANTS
### tracking.tsx needs TWO copies:
# app/(artisan)/tracking.tsx:
#   const PRIMARY = '#1B4332'
#   const IS_ARTISAN = true
# app/(customer)/tracking.tsx:
#   const PRIMARY = '#0A2463'
#   const IS_ARTISAN = false

### shared_chat.tsx needs TWO copies:
# app/(artisan)/chat.tsx:
#   const PRIMARY = '#1B4332'
# app/(customer)/chat.tsx:
#   const PRIMARY = '#0A2463'

### shared_messages.tsx needs TWO copies:
# app/(artisan)/messages.tsx:
#   const PRIMARY = '#1B4332'
#   const IS_ARTISAN = true
# app/(customer)/messages.tsx:
#   const PRIMARY = '#0A2463'
#   const IS_ARTISAN = false

### language.tsx needs TWO copies:
# app/(artisan)/language.tsx:
#   const PRIMARY = '#1B4332'
# app/(customer)/language.tsx:  ← use customer_language.tsx (already separate)

## TOTAL SCREEN COUNT
# Auth:      3 (splash, onboarding, login)
# Artisan:   16 screens
# Customer:  16 screens
# TOTAL:     35 screens