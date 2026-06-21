import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import FareBreakdownCard from '../shared/FareBreakdownCard';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListSet } from '../../../../hooks/useUserListSet';
import { useToast } from '../../../../contexts/ToastContext';
import { generateId } from '../../../../utils/generateId';
import type {
  FairRideUserData,
  RideRequest,
  RiderScreen,
  Location,
} from '../../../../types/fairride';
import {
  calculateFare,
  haversineDistanceMiles,
  estimateMinutes,
} from '../../../../utils/fairridePricing';

interface RideRequestPageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const DEMO_PICKUP: Location = {
  latitude: 35.7796,
  longitude: -78.6382,
  address: '123 Main St, Raleigh, NC',
  name: 'Home',
};

const DEMO_DROPOFF: Location = {
  latitude: 35.8801,
  longitude: -78.7872,
  address: 'RDU Airport, Morrisville, NC',
  name: 'RDU Airport',
};

const RideRequestPage = ({ onNavigate }: RideRequestPageProps) => {
  const [userData] = useUserVariable<FairRideUserData>({
    key: 'fairride_userData',
    defaultValue: {
      name: '',
      email: '',
      userId: '',
      phone: '',
      role: 'rider',
      createdAt: Date.now(),
    },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  const [, setActiveRide] = useUserVariable<RideRequest | null>({
    key: 'fairride_activeRide',
    defaultValue: null,
    privacy: 'PUBLIC',
    filterKey: 'status',
  });

  const setRideHistory = useUserListSet<any>();
  const { showToast } = useToast();

  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);

  const distanceMiles = haversineDistanceMiles(
    DEMO_PICKUP.latitude,
    DEMO_PICKUP.longitude,
    DEMO_DROPOFF.latitude,
    DEMO_DROPOFF.longitude
  );
  const durationMinutes = estimateMinutes(distanceMiles);
  const fare = calculateFare({
    rideType: 'economy',
    distanceMiles,
    durationMinutes,
  });

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setSearchSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    if (searchSeconds >= 8 && isSearching) {
      setIsSearching(false);
      showToast('Driver found! Simulating ride...');

      const rideId = generateId(16);
      const request: RideRequest = {
        id: rideId,
        riderId: userData.value.userId || 'demo',
        riderName: userData.value.name || 'Rider',
        pickup: DEMO_PICKUP,
        dropoff: DEMO_DROPOFF,
        rideType: 'economy',
        estimatedFare: fare,
        status: 'accepted',
        createdAt: Date.now(),
      };

      setActiveRide(request);

      setRideHistory({
        key: 'fairride_rideHistory',
        itemId: rideId,
        value: {
          id: rideId,
          pickup: DEMO_PICKUP,
          dropoff: DEMO_DROPOFF,
          rideType: 'economy',
          status: 'in_progress',
          totalFare: fare.totalFare,
          driverPay: fare.driverPay,
          distanceMiles,
          durationMinutes,
          driverName: 'Alex D.',
          createdAt: Date.now(),
        },
        privacy: 'PRIVATE',
      });

      onNavigate('tracking');
    }
  }, [
    searchSeconds,
    isSearching,
    showToast,
    fare,
    userData.value,
    setActiveRide,
    setRideHistory,
    onNavigate,
    distanceMiles,
    durationMinutes,
  ]);

  const handleRequestRide = () => {
    setIsSearching(true);
    setSearchSeconds(0);
    showToast('Searching for nearby drivers...');
  };

  const handleCancel = () => {
    setIsSearching(false);
    setSearchSeconds(0);
    onNavigate('home');
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={handleCancel}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 20 }}>
            Request Ride
          </PoppinsText>
        </Row>

        <MapPlaceholder
          pickupLocation={DEMO_PICKUP}
          dropoffLocation={DEMO_DROPOFF}
          className="h-40 w-full"
        />

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <Row gap={2} className="items-center">
              <View className="bg-primary-accent h-3 w-3 rounded-full" />
              <Column gap={0}>
                <PoppinsText varient="subtext">Pickup</PoppinsText>
                <PoppinsText weight="medium">{DEMO_PICKUP.address}</PoppinsText>
              </Column>
            </Row>
            <View className="border-subtle-border ml-1 h-4 border-l-2 border-dashed" />
            <Row gap={2} className="items-center">
              <View className="h-3 w-3 rounded-full bg-red-500" />
              <Column gap={0}>
                <PoppinsText varient="subtext">Dropoff</PoppinsText>
                <PoppinsText weight="medium">{DEMO_DROPOFF.address}</PoppinsText>
              </Column>
            </Row>
          </Column>
        </View>

        <FareBreakdownCard fare={fare} />

        {isSearching ? (
          <Column gap={3} className="items-center">
            <View className="border-primary-accent h-16 w-16 items-center justify-center rounded-full border-4">
              <PoppinsText weight="bold" style={{ fontSize: 20 }}>
                {searchSeconds}s
              </PoppinsText>
            </View>
            <PoppinsText weight="medium">Searching for drivers...</PoppinsText>
            <PoppinsText varient="subtext">Looking for the nearest available driver</PoppinsText>
            <AppButton variant="red" className="w-full" onPress={handleCancel}>
              <PoppinsText color="red">Cancel Request</PoppinsText>
            </AppButton>
          </Column>
        ) : (
          <AppButton variant="green" className="h-14" onPress={handleRequestRide}>
            <PoppinsText color="white" weight="bold">
              Confirm & Request Ride
            </PoppinsText>
          </AppButton>
        )}

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              FairRide Promise
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              Your driver keeps 92% of the fare. No surge pricing — demand adjustments are capped at
              1.3x. Transparent pricing, always.
            </PoppinsText>
          </Column>
        </View>
      </Column>
    </ScrollView>
  );
};

export default RideRequestPage;
