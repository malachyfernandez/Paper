import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import UserAvatar from '../shared/UserAvatar';
import { useToast } from '../../../../contexts/ToastContext';
import type { DriverScreen, Location } from '../../../../types/fairride';
import { formatCurrency, estimateMinutes } from '../../../../utils/fairridePricing';

interface ActiveRidePageProps {
  onNavigate: (screen: DriverScreen) => void;
}

const DEMO_PICKUP: Location = {
  latitude: 35.7796,
  longitude: -78.6382,
  address: '123 Main St, Raleigh, NC',
};

const DEMO_DROPOFF: Location = {
  latitude: 35.8801,
  longitude: -78.7872,
  address: 'RDU Airport, Morrisville, NC',
};

type RidePhase = 'to_pickup' | 'waiting' | 'to_dropoff';

const ActiveRidePage = ({ onNavigate }: ActiveRidePageProps) => {
  const { showToast } = useToast();
  const [phase, setPhase] = useState<RidePhase>('to_pickup');
  const [etaMinutes, setEtaMinutes] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setEtaMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleArrivedAtPickup = () => {
    setPhase('waiting');
    showToast('Arrived at pickup. Waiting for rider...');
  };

  const handleStartRide = () => {
    setPhase('to_dropoff');
    setEtaMinutes(estimateMinutes(12.3));
    showToast('Ride started! Navigate to dropoff.');
  };

  const handleCompleteRide = () => {
    showToast('Ride completed!');
    onNavigate('ride_complete');
  };

  const driverPay = 16.95;

  const phaseLabel: Record<RidePhase, string> = {
    to_pickup: 'Navigating to pickup',
    waiting: 'Waiting for rider',
    to_dropoff: 'En route to destination',
  };

  const phaseColor: Record<RidePhase, string> = {
    to_pickup: 'bg-blue-500',
    waiting: 'bg-yellow-500',
    to_dropoff: 'bg-primary-accent',
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <View className={`${phaseColor[phase]} items-center rounded p-3`}>
          <PoppinsText color="white" weight="bold">
            {phaseLabel[phase]}
          </PoppinsText>
        </View>

        <MapPlaceholder
          driverLocation={{ latitude: 35.78, longitude: -78.64 }}
          pickupLocation={DEMO_PICKUP}
          dropoffLocation={DEMO_DROPOFF}
          className="h-48 w-full"
        />

        {phase !== 'waiting' && (
          <View className="border-primary-accent bg-primary-accent/10 items-center rounded border-2 p-3">
            <Column gap={0} className="items-center">
              <PoppinsText weight="bold" style={{ fontSize: 32 }}>
                {etaMinutes}
              </PoppinsText>
              <PoppinsText>min to {phase === 'to_pickup' ? 'pickup' : 'dropoff'}</PoppinsText>
            </Column>
          </View>
        )}

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Row gap={3} className="w-full items-center">
            <UserAvatar name="Jordan M." size={48} />
            <Column gap={0} className="flex-1">
              <PoppinsText weight="medium">Jordan M.</PoppinsText>
              <PoppinsText varient="subtext">Economy · 1 passenger</PoppinsText>
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
              <PoppinsText>{DEMO_PICKUP.address}</PoppinsText>
            </Row>
            <View className="border-subtle-border ml-1 h-4 border-l-2 border-dashed" />
            <Row gap={2} className="items-center">
              <View className="h-3 w-3 rounded-full bg-red-500" />
              <PoppinsText>{DEMO_DROPOFF.address}</PoppinsText>
            </Row>
          </Column>
        </View>

        <Row gap={2} className="bg-text w-full items-center justify-between rounded p-3">
          <PoppinsText color="white">Your earnings</PoppinsText>
          <PoppinsText color="white" weight="bold">
            {formatCurrency(driverPay)}
          </PoppinsText>
        </Row>

        {phase === 'to_pickup' && (
          <AppButton
            variant="green"
            className="h-14"
            onPress={handleArrivedAtPickup}
            disabled={etaMinutes > 0}>
            <PoppinsText color="white" weight="bold">
              {etaMinutes > 0 ? `Arriving in ${etaMinutes} min` : 'Arrived at Pickup'}
            </PoppinsText>
          </AppButton>
        )}

        {phase === 'waiting' && (
          <AppButton variant="green" className="h-14" onPress={handleStartRide}>
            <PoppinsText color="white" weight="bold">
              Start Ride
            </PoppinsText>
          </AppButton>
        )}

        {phase === 'to_dropoff' && (
          <AppButton
            variant="green"
            className="h-14"
            onPress={handleCompleteRide}
            disabled={etaMinutes > 0}>
            <PoppinsText color="white" weight="bold">
              {etaMinutes > 0 ? `${etaMinutes} min remaining` : 'Complete Ride'}
            </PoppinsText>
          </AppButton>
        )}
      </Column>
    </ScrollView>
  );
};

export default ActiveRidePage;
