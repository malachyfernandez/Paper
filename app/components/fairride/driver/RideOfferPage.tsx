import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import FareBreakdownCard from '../shared/FareBreakdownCard';
import UserAvatar from '../shared/UserAvatar';
import RatingStars from '../shared/RatingStars';
import { useToast } from '../../../../contexts/ToastContext';
import type { DriverScreen, Location } from '../../../../types/fairride';
import {
  calculateFare,
  haversineDistanceMiles,
  estimateMinutes,
} from '../../../../utils/fairridePricing';

interface RideOfferPageProps {
  onNavigate: (screen: DriverScreen) => void;
}

const DEMO_PICKUP: Location = {
  latitude: 35.7796,
  longitude: -78.6382,
  address: '123 Main St, Raleigh, NC',
  name: 'Rider pickup',
};

const DEMO_DROPOFF: Location = {
  latitude: 35.8801,
  longitude: -78.7872,
  address: 'RDU Airport, Morrisville, NC',
  name: 'RDU Airport',
};

const RideOfferPage = ({ onNavigate }: RideOfferPageProps) => {
  const { showToast } = useToast();
  const [secondsLeft, setSecondsLeft] = useState(30);

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

  const pickupDistanceMiles = 1.2;
  const pickupEta = estimateMinutes(pickupDistanceMiles);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          showToast('Ride request expired');
          onNavigate('dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onNavigate, showToast]);

  const handleAccept = () => {
    showToast('Ride accepted! Navigate to pickup.');
    onNavigate('active_ride');
  };

  const handleDecline = () => {
    showToast('Ride declined');
    onNavigate('dashboard');
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Column gap={1} className="items-center">
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            New Ride Request
          </PoppinsText>
          <View className="border-primary-accent h-12 w-12 items-center justify-center rounded-full border-4">
            <PoppinsText weight="bold" style={{ fontSize: 18 }}>
              {secondsLeft}
            </PoppinsText>
          </View>
        </Column>

        <MapPlaceholder
          pickupLocation={DEMO_PICKUP}
          dropoffLocation={DEMO_DROPOFF}
          className="h-40 w-full"
        />

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Row gap={3} className="w-full items-center">
            <UserAvatar name="Jordan M." size={48} />
            <Column gap={0} className="flex-1">
              <PoppinsText weight="medium">Jordan M.</PoppinsText>
              <RatingStars rating={4.7} size="sm" />
            </Column>
          </Row>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <Row gap={2} className="items-center">
              <View className="bg-primary-accent h-3 w-3 rounded-full" />
              <Column gap={0} className="flex-1">
                <PoppinsText varient="subtext">Pickup ({pickupEta} min away)</PoppinsText>
                <PoppinsText weight="medium">{DEMO_PICKUP.address}</PoppinsText>
              </Column>
            </Row>
            <View className="border-subtle-border ml-1 h-4 border-l-2 border-dashed" />
            <Row gap={2} className="items-center">
              <View className="h-3 w-3 rounded-full bg-red-500" />
              <Column gap={0} className="flex-1">
                <PoppinsText varient="subtext">Dropoff</PoppinsText>
                <PoppinsText weight="medium">{DEMO_DROPOFF.address}</PoppinsText>
              </Column>
            </Row>
          </Column>
        </View>

        <Row gap={2} className="w-full">
          <StatBox label="Distance" value={`${distanceMiles.toFixed(1)} mi`} />
          <StatBox label="Est. Time" value={`${durationMinutes} min`} />
          <StatBox label="Your Pay" value={`$${fare.driverPay.toFixed(2)}`} accent />
        </Row>

        <FareBreakdownCard fare={fare} showDriverPay />

        <Row gap={3} className="w-full">
          <AppButton variant="red" className="h-14 flex-1" onPress={handleDecline}>
            <PoppinsText color="red" weight="bold">
              Decline
            </PoppinsText>
          </AppButton>
          <AppButton variant="green" className="h-14 flex-1" onPress={handleAccept}>
            <PoppinsText color="white" weight="bold">
              Accept
            </PoppinsText>
          </AppButton>
        </Row>
      </Column>
    </ScrollView>
  );
};

const StatBox = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <View
    className={`flex-1 items-center rounded border-2 p-2 ${
      accent ? 'border-primary-accent bg-primary-accent/10' : 'border-border'
    }`}>
    <PoppinsText varient="subtext">{label}</PoppinsText>
    <PoppinsText weight="bold">{value}</PoppinsText>
  </View>
);

export default RideOfferPage;
