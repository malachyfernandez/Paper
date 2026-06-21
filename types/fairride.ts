// ============================================================================
// FairRide — Type definitions for the ride-sharing system
// ============================================================================

// ---------------------------------------------------------------------------
// Geo / Location
// ---------------------------------------------------------------------------

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Location = LatLng & {
  address: string;
  name?: string;
};

// ---------------------------------------------------------------------------
// User profiles
// ---------------------------------------------------------------------------

export type UserRole = 'rider' | 'driver' | 'both';

export type FairRideUserData = {
  name: string;
  email: string;
  userId: string;
  phone: string;
  role: UserRole;
  profileImageUrl?: string;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Driver state
// ---------------------------------------------------------------------------

export type DriverStatus = 'offline' | 'online' | 'en_route' | 'waiting' | 'in_ride';

export type VehicleInfo = {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  capacity: number;
};

export type DriverProfile = {
  userId: string;
  name: string;
  status: DriverStatus;
  currentLocation: LatLng;
  vehicleInfo: VehicleInfo;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  lastLocationUpdate: number;
};

// ---------------------------------------------------------------------------
// Ride types
// ---------------------------------------------------------------------------

export type RideType = 'economy' | 'comfort' | 'xl';

export const RIDE_TYPE_LABELS: Record<RideType, string> = {
  economy: 'Economy',
  comfort: 'Comfort',
  xl: 'XL',
};

export const RIDE_TYPE_CAPACITY: Record<RideType, number> = {
  economy: 4,
  comfort: 4,
  xl: 6,
};

// ---------------------------------------------------------------------------
// Ride lifecycle
// ---------------------------------------------------------------------------

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RideRequest = {
  id: string;
  riderId: string;
  riderName: string;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  estimatedFare: FareBreakdown;
  status: RideStatus;
  createdAt: number;
};

export type ActiveRide = {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string;
  driverName: string;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  status: RideStatus;
  estimatedFare: FareBreakdown;
  actualFare?: FareBreakdown;
  driverLocation: LatLng;
  estimatedArrivalMinutes: number;
  estimatedTripMinutes: number;
  distanceMiles: number;
  startedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelledBy?: 'rider' | 'driver';
  cancelReason?: string;
};

// ---------------------------------------------------------------------------
// Pricing / Fare
// ---------------------------------------------------------------------------

export type FareBreakdown = {
  baseFare: number;
  perMileCost: number;
  perMinuteCost: number;
  distanceMiles: number;
  durationMinutes: number;
  subtotal: number;
  demandMultiplier: number;
  platformFee: number;
  driverPay: number;
  totalFare: number;
};

export type PricingConfig = {
  baseFare: Record<RideType, number>;
  perMile: Record<RideType, number>;
  perMinute: Record<RideType, number>;
  platformFeePercent: number;
  maxDemandMultiplier: number;
  minimumFare: Record<RideType, number>;
};

export const DEFAULT_PRICING: PricingConfig = {
  baseFare: { economy: 1.5, comfort: 2.5, xl: 3.5 },
  perMile: { economy: 0.85, comfort: 1.2, xl: 1.5 },
  perMinute: { economy: 0.12, comfort: 0.18, xl: 0.22 },
  platformFeePercent: 0.08,
  maxDemandMultiplier: 1.3,
  minimumFare: { economy: 4.0, comfort: 6.0, xl: 8.0 },
};

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export type PaymentMethod = {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  isDefault: boolean;
};

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export type PaymentRecord = {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  amount: number;
  platformFee: number;
  driverPay: number;
  paymentMethodId: string;
  status: PaymentStatus;
  createdAt: number;
  completedAt?: number;
};

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export type Rating = {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  fromRole: 'rider' | 'driver';
  stars: number;
  comment?: string;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type RideAnalytics = {
  totalRides: number;
  totalDistance: number;
  totalDuration: number;
  totalSpent: number;
  totalEarned: number;
  averageRating: number;
  ridesByType: Record<RideType, number>;
  weeklyRides: number[];
};

export type DemandData = {
  region: string;
  activeRiders: number;
  activeDrivers: number;
  pendingRequests: number;
  demandMultiplier: number;
  updatedAt: number;
};

// ---------------------------------------------------------------------------
// Ride history (for list items)
// ---------------------------------------------------------------------------

export type RideHistoryItem = {
  id: string;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  status: RideStatus;
  totalFare: number;
  driverPay: number;
  distanceMiles: number;
  durationMinutes: number;
  driverName?: string;
  riderName?: string;
  rating?: number;
  createdAt: number;
  completedAt?: number;
};

// ---------------------------------------------------------------------------
// Screen navigation
// ---------------------------------------------------------------------------

export type RiderScreen =
  | 'home'
  | 'ride_request'
  | 'tracking'
  | 'ride_complete'
  | 'history'
  | 'payment'
  | 'profile'
  | 'settings';

export type DriverScreen =
  | 'dashboard'
  | 'ride_offer'
  | 'active_ride'
  | 'ride_complete'
  | 'earnings'
  | 'profile'
  | 'settings';

export type AppScreen = 'role_select' | 'rider' | 'driver';
