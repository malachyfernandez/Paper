# FairRide Architecture Guide

FairRide is a budget ride-sharing app built on the same React Native + Expo + Convex + Clerk stack as Paper, using the **userVariables system** as the backbone for all real-time state management.

## Philosophy

- **Riders pay less**: Transparent cost-based pricing, no aggressive surge
- **Drivers earn more**: 92% of every fare goes to the driver (vs Uber's ~75%)
- **Barely profitable**: 8% platform fee — just enough to keep the servers running
- **Full transparency**: Complete fare breakdown shown before every ride

## Data Model (userVariables)

All FairRide state uses the Paper userVariables system:

| Key | Hook | Description |
|---|---|---|
| `fairride_userData` | `useUserVariable` | User profile (name, email, role, phone) |
| `fairride_driverProfile` | `useUserVariable` | Driver state (status, location, vehicle, stats) |
| `fairride_activeRide` | `useUserVariable` | Current active ride request/tracking |
| `fairride_paymentMethods` | `useUserVariable` | User's saved payment methods |
| `fairride_rideHistory` | `useUserList` | Completed ride history items |
| `fairride_ratings` | `useUserList` | Ratings submitted after rides |

## Pricing Engine (`utils/fairridePricing.ts`)

```
Total Fare = max(
  (baseFare + perMile * distance + perMinute * duration) * demandMultiplier,
  minimumFare
)

Platform Fee = totalFare * 0.08
Driver Pay   = totalFare - platformFee (≈ 92%)
```

### Ride Types
- **Economy**: $1.50 base + $0.85/mi + $0.12/min, $4 min
- **Comfort**: $2.50 base + $1.20/mi + $0.18/min, $6 min
- **XL**: $3.50 base + $1.50/mi + $0.22/min, $8 min

### Demand Multiplier
- 1.0x when balanced (riders ≤ 1.5x drivers)
- Linear scale up to 1.3x max (when riders ≥ 4x drivers)
- Never exceeds 1.3x — no Uber-style 3x+ surge

## Screen Flow

### Rider
```
Role Select → Home → Ride Request → Tracking → Ride Complete
                  ↘ History
                  ↘ Payment
                  ↘ Profile
```

### Driver
```
Role Select → Dashboard → Ride Offer → Active Ride → Ride Complete
                       ↘ Earnings
                       ↘ Profile
```

## Component Architecture

Same patterns as Paper:
- **Componentize everything**: Each component owns its state
- **Direct subscriptions**: Components subscribe to userVariables directly (never pass through props)
- **Layout system**: Column/Row with gap-based spacing
- **UI system**: PoppinsText, AppButton, PoppinsTextInput
- **Animation**: StateAnimatedView for screen transitions

## Convex Backend (`convex/fairride.ts`)

- `findNearbyDrivers`: Query online drivers within radius (Haversine distance)
- `getDemandSnapshot`: Real-time supply/demand analytics
- `acceptRide`: Driver accepts a pending ride request
- `completeRide`: Finalize ride and trigger payment

## Files Added

```
types/fairride.ts                          — All TypeScript types
utils/fairridePricing.ts                   — Pricing engine + geo utils
convex/fairride.ts                         — Backend queries/mutations

app/components/fairride/
├── FairRideMainPage.tsx                   — Root page with role select + nav
├── shared/
│   ├── MapPlaceholder.tsx                 — Map UI placeholder
│   ├── FareBreakdownCard.tsx              — Transparent fare display
│   ├── RatingStars.tsx                    — Interactive star ratings
│   ├── LocationInput.tsx                  — Address input with dot indicator
│   ├── RideTypeSelector.tsx              — Economy/Comfort/XL picker
│   ├── PaymentMethodCard.tsx             — Payment method display
│   ├── RideHistoryCard.tsx               — Ride history list item
│   ├── UserAvatar.tsx                    — Initials-based avatar
│   └── StatCard.tsx                      — Stats display card
├── rider/
│   ├── RiderHomePage.tsx                 — Main rider screen with map + inputs
│   ├── RideRequestPage.tsx              — Confirm & request ride
│   ├── RideTrackingPage.tsx             — Real-time driver tracking
│   ├── RideCompletePage.tsx             — Ride summary + driver rating
│   ├── RiderHistoryPage.tsx             — Ride history + stats
│   ├── RiderPaymentPage.tsx             — Payment method management
│   └── RiderProfilePage.tsx             — Profile + settings
└── driver/
    ├── DriverDashboardPage.tsx           — Online/offline toggle + stats
    ├── RideOfferPage.tsx                — Accept/decline ride offers
    ├── ActiveRidePage.tsx               — Navigate to pickup/dropoff
    ├── DriverRideCompletePage.tsx        — Earnings summary + rider rating
    ├── DriverEarningsPage.tsx           — Earnings analytics + Uber comparison
    └── DriverProfilePage.tsx            — Profile + vehicle info
```
