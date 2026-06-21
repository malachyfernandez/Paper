import { DEFAULT_PRICING, FareBreakdown, PricingConfig, RideType } from '../types/fairride';

/**
 * FairRide pricing engine.
 *
 * Philosophy:
 * - Cost-based pricing: base + per-mile + per-minute
 * - Platform takes only ~8% (vs Uber's ~25%)
 * - Drivers keep ~92% of the fare
 * - Demand multiplier capped at 1.3x (no aggressive surge)
 * - Transparent breakdown shown to rider before confirming
 */

export function calculateFare({
  rideType,
  distanceMiles,
  durationMinutes,
  demandMultiplier = 1.0,
  config = DEFAULT_PRICING,
}: {
  rideType: RideType;
  distanceMiles: number;
  durationMinutes: number;
  demandMultiplier?: number;
  config?: PricingConfig;
}): FareBreakdown {
  const clampedMultiplier = Math.min(Math.max(demandMultiplier, 1.0), config.maxDemandMultiplier);

  const baseFare = config.baseFare[rideType];
  const perMileCost = config.perMile[rideType] * distanceMiles;
  const perMinuteCost = config.perMinute[rideType] * durationMinutes;

  const rawSubtotal = baseFare + perMileCost + perMinuteCost;
  const subtotal = Math.max(rawSubtotal * clampedMultiplier, config.minimumFare[rideType]);

  const platformFee = roundCents(subtotal * config.platformFeePercent);
  const driverPay = roundCents(subtotal - platformFee);
  const totalFare = roundCents(subtotal);

  return {
    baseFare: roundCents(baseFare),
    perMileCost: roundCents(perMileCost),
    perMinuteCost: roundCents(perMinuteCost),
    distanceMiles: Math.round(distanceMiles * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
    subtotal: roundCents(rawSubtotal),
    demandMultiplier: clampedMultiplier,
    platformFee,
    driverPay,
    totalFare,
  };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Estimate distance in miles between two lat/lng pairs (Haversine).
 */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Rough ETA in minutes based on distance and average speed.
 */
export function estimateMinutes(distanceMiles: number, avgSpeedMph = 25): number {
  return Math.max(Math.round((distanceMiles / avgSpeedMph) * 60), 1);
}

/**
 * Calculate demand multiplier from supply/demand ratio.
 * Returns 1.0 when balanced, up to maxDemandMultiplier when demand >> supply.
 */
export function calculateDemandMultiplier({
  activeRiders,
  activeDrivers,
  maxMultiplier = DEFAULT_PRICING.maxDemandMultiplier,
}: {
  activeRiders: number;
  activeDrivers: number;
  maxMultiplier?: number;
}): number {
  if (activeDrivers <= 0) return maxMultiplier;
  if (activeRiders <= 0) return 1.0;

  const ratio = activeRiders / activeDrivers;

  if (ratio <= 1.5) return 1.0;
  if (ratio >= 4.0) return maxMultiplier;

  const t = (ratio - 1.5) / (4.0 - 1.5);
  return 1.0 + t * (maxMultiplier - 1.0);
}
