import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import UserAvatar from '../shared/UserAvatar';
import RatingStars from '../shared/RatingStars';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import type { RideRequest, RiderScreen } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface RideTrackingPageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const RideTrackingPage = ({ onNavigate }: RideTrackingPageProps) => {
  const [activeRide] = useUserVariable<RideRequest | null>({
    key: 'fairride_activeRide',
    defaultValue: null,
    privacy: 'PUBLIC',
  });

  const [etaMinutes, setEtaMinutes] = useState(5);
  const [ridePhase, setRidePhase] = useState<'arriving' | 'in_progress' | 'completed'>('arriving');

  useEffect(() => {
    if (ridePhase === 'completed') return;

    const interval = setInterval(() => {
      setEtaMinutes((prev) => {
        if (prev <= 1) {
          if (ridePhase === 'arriving') {
            setRidePhase('in_progress');
            return 12;
          }
          setRidePhase('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [ridePhase]);

  useEffect(() => {
    if (ridePhase === 'completed') {
      onNavigate('ride_complete');
    }
  }, [ridePhase, onNavigate]);

  const ride = activeRide.value;

  const driverLocation = {
    latitude: (ride?.pickup?.latitude ?? 35.78) + 0.005,
    longitude: (ride?.pickup?.longitude ?? -78.64) - 0.003,
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <PoppinsText weight="bold" style={{ fontSize: 20 }}>
          {ridePhase === 'arriving' ? 'Driver on the way' : 'Ride in progress'}
        </PoppinsText>

        <MapPlaceholder
          driverLocation={driverLocation}
          pickupLocation={ride?.pickup}
          dropoffLocation={ride?.dropoff}
          className="h-52 w-full"
        />

        <View className="border-primary-accent bg-primary-accent/10 items-center rounded border-2 p-4">
          <Column gap={1} className="items-center">
            <PoppinsText weight="bold" style={{ fontSize: 36 }}>
              {etaMinutes}
            </PoppinsText>
            <PoppinsText weight="medium">
              {ridePhase === 'arriving' ? 'min until arrival' : 'min remaining'}
            </PoppinsText>
          </Column>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Row gap={3} className="w-full items-center">
            <UserAvatar name="Alex D." size={48} />
            <Column gap={0} className="flex-1">
              <PoppinsText weight="medium">Alex D.</PoppinsText>
              <RatingStars rating={4.8} size="sm" />
              <PoppinsText varient="subtext">Toyota Camry · ABC 1234</PoppinsText>
            </Column>
            <AppButton variant="outline" className="h-10 w-24">
              <PoppinsText>Contact</PoppinsText>
            </AppButton>
          </Row>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <Row gap={2} className="items-center">
              <View className="bg-primary-accent h-3 w-3 rounded-full" />
              <PoppinsText varient="subtext">{ride?.pickup?.address ?? 'Pickup'}</PoppinsText>
            </Row>
            <View className="border-subtle-border ml-1 h-4 border-l-2 border-dashed" />
            <Row gap={2} className="items-center">
              <View className="h-3 w-3 rounded-full bg-red-500" />
              <PoppinsText varient="subtext">{ride?.dropoff?.address ?? 'Dropoff'}</PoppinsText>
            </Row>
          </Column>
        </View>

        <Row gap={2} className="bg-text w-full items-center justify-between rounded p-3">
          <PoppinsText color="white" weight="medium">
            Estimated fare
          </PoppinsText>
          <PoppinsText color="white" weight="bold">
            {ride?.estimatedFare ? formatCurrency(ride.estimatedFare.totalFare) : '...'}
          </PoppinsText>
        </Row>

        <AppButton variant="red" className="w-full" onPress={() => onNavigate('home')}>
          <PoppinsText color="red">Cancel Ride</PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default RideTrackingPage;
