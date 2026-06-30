import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import LocationInput from '../shared/LocationInput';
import RideTypeSelector from '../shared/RideTypeSelector';
import EnterView from '../shared/EnterView';
import FareBreakdownCard from '../shared/FareBreakdownCard';
import UserAvatar from '../shared/UserAvatar';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import type {
  FairRideUserData,
  RideType,
  Location,
  FareBreakdown,
  RiderScreen,
} from '../../../../types/fairride';
import {
  calculateFare,
  haversineDistanceMiles,
  estimateMinutes,
} from '../../../../utils/fairridePricing';

interface RiderHomePageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const DEMO_LOCATIONS: Record<string, Location> = {
  home: {
    latitude: 35.7796,
    longitude: -78.6382,
    address: '123 Main St, Raleigh, NC',
    name: 'Home',
  },
  work: {
    latitude: 35.7721,
    longitude: -78.6386,
    address: '456 Fayetteville St, Raleigh, NC',
    name: 'Work',
  },
  airport: {
    latitude: 35.8801,
    longitude: -78.7872,
    address: 'RDU Airport, Morrisville, NC',
    name: 'RDU Airport',
  },
};

const RiderHomePage = ({ onNavigate }: RiderHomePageProps) => {
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

  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [selectedRideType, setSelectedRideType] = useState<RideType>('economy');
  const [showFareEstimate, setShowFareEstimate] = useState(false);

  const pickup = DEMO_LOCATIONS.home;
  const dropoff = DEMO_LOCATIONS.airport;

  const distanceMiles = haversineDistanceMiles(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude
  );
  const durationMinutes = estimateMinutes(distanceMiles);

  const estimates: Partial<Record<RideType, FareBreakdown>> = {
    economy: calculateFare({
      rideType: 'economy',
      distanceMiles,
      durationMinutes,
    }),
    comfort: calculateFare({
      rideType: 'comfort',
      distanceMiles,
      durationMinutes,
    }),
    xl: calculateFare({ rideType: 'xl', distanceMiles, durationMinutes }),
  };

  const currentEstimate = estimates[selectedRideType];

  const handleEstimateFare = () => {
    setShowFareEstimate(true);
  };

  const handleRequestRide = () => {
    onNavigate('ride_request');
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <UserAvatar name={userData.value.name || 'Rider'} size={48} />
          <Column gap={0} className="flex-1">
            <PoppinsText weight="medium">Hello, {userData.value.name || 'Rider'}</PoppinsText>
            <PoppinsText varient="subtext">Where are you going?</PoppinsText>
          </Column>
          <AppButton
            variant="outline"
            className="h-10 w-10 p-0"
            onPress={() => onNavigate('profile')}>
            <PoppinsText>⚙</PoppinsText>
          </AppButton>
        </Row>

        <EnterView index={0}>
          <MapPlaceholder
            center={pickup}
            pickupLocation={pickup}
            dropoffLocation={showFareEstimate ? dropoff : undefined}
            className="h-48 w-full"
          />
        </EnterView>

        <EnterView index={1} className="border-border bg-inner-background rounded-2xl border p-4">
          <Column gap={3}>
            <LocationInput
              label="Pickup"
              value={pickupText}
              onChangeText={setPickupText}
              dotColor="bg-primary-accent"
              placeholder="Current location"
            />

            <View className="border-subtle-border ml-4 h-6 border-l-2 border-dashed" />

            <LocationInput
              label="Dropoff"
              value={dropoffText}
              onChangeText={setDropoffText}
              dotColor="bg-red-500"
              placeholder="Where to?"
            />
          </Column>
        </EnterView>

        <EnterView index={2}>
          <RideTypeSelector
            selected={selectedRideType}
            onSelect={setSelectedRideType}
            estimates={estimates}
          />
        </EnterView>

        {!showFareEstimate ? (
          <AppButton variant="green" className="h-14" onPress={handleEstimateFare}>
            <PoppinsText color="white" weight="bold">
              Get Fare Estimate
            </PoppinsText>
          </AppButton>
        ) : (
          <Column gap={3}>
            {currentEstimate && <FareBreakdownCard fare={currentEstimate} />}

            <AppButton variant="green" className="h-14" onPress={handleRequestRide}>
              <PoppinsText color="white" weight="bold">
                Request {selectedRideType.charAt(0).toUpperCase() + selectedRideType.slice(1)} Ride
              </PoppinsText>
            </AppButton>

            <PoppinsText varient="subtext" className="text-center">
              You pay only {currentEstimate ? `$${currentEstimate.totalFare.toFixed(2)}` : '...'} —
              your driver keeps 92%
            </PoppinsText>
          </Column>
        )}

        <Row gap={2} className="w-full">
          <AppButton variant="outline" className="flex-1" onPress={() => onNavigate('history')}>
            <PoppinsText>Ride History</PoppinsText>
          </AppButton>
          <AppButton variant="outline" className="flex-1" onPress={() => onNavigate('payment')}>
            <PoppinsText>Payment</PoppinsText>
          </AppButton>
        </Row>
      </Column>
    </ScrollView>
  );
};

export default RiderHomePage;
