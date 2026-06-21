# FairRide User Data Variables Tracking

**fairride_userData** -- User profile data
```ts
const [userData, setUserData] = useUserVariable<FairRideUserData>({
    key: "fairride_userData",
    defaultValue: { name: "", email: "", userId: "", phone: "", role: "rider", createdAt: Date.now() },
    privacy: "PUBLIC",
    searchKeys: ["name"],
});

// FairRideMainPage.tsx
// RiderHomePage.tsx
// DriverDashboardPage.tsx
// RiderProfilePage.tsx
// DriverProfilePage.tsx
```

**fairride_driverProfile** -- Driver state and stats
```ts
const [driverProfile, setDriverProfile] = useUserVariable<DriverProfile>({
    key: "fairride_driverProfile",
    defaultValue: { userId: "", name: "", status: "offline", ... },
    privacy: "PUBLIC",
    filterKey: "status",
});

// DriverDashboardPage.tsx
// DriverProfilePage.tsx
```

**fairride_activeRide** -- Current active ride
```ts
const [activeRide, setActiveRide] = useUserVariable<RideRequest | null>({
    key: "fairride_activeRide",
    defaultValue: null,
    privacy: "PUBLIC",
    filterKey: "status",
});

// RideRequestPage.tsx
// RideTrackingPage.tsx
// RideCompletePage.tsx
```

**fairride_paymentMethods** -- Saved payment methods
```ts
const [paymentMethods, setPaymentMethods] = useUserVariable<PaymentMethod[]>({
    key: "fairride_paymentMethods",
    defaultValue: [{ id: "pm_demo_1", type: "card", last4: "4242", brand: "visa", isDefault: true }],
});

// RiderPaymentPage.tsx
```

**fairride_rideHistory** -- Ride history items
```ts
const setRideHistory = useUserListSet();
setRideHistory({
    key: "fairride_rideHistory",
    itemId: rideId,
    value: { id, pickup, dropoff, rideType, status, totalFare, ... },
    privacy: "PRIVATE",
});

// RideRequestPage.tsx (writes)
// RiderHistoryPage.tsx (reads via useUserListGet)
```

**fairride_ratings** -- Submitted ratings
```ts
const setRating = useUserListSet();
setRating({
    key: "fairride_ratings",
    itemId: ratingId,
    value: { id, rideId, fromUserId, toUserId, fromRole, stars, comment, createdAt },
    privacy: "PUBLIC",
});

// RideCompletePage.tsx
// DriverRideCompletePage.tsx
```
