import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MapPlaceholder from '../shared/MapPlaceholder';
import StatCard from '../shared/StatCard';
import UserAvatar from '../shared/UserAvatar';
import RatingStars from '../shared/RatingStars';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useToast } from '../../../../contexts/ToastContext';
import type {
  DriverProfile,
  DriverStatus,
  DriverScreen,
  FairRideUserData,
} from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface DriverDashboardPageProps {
  onNavigate: (screen: DriverScreen) => void;
}

const DriverDashboardPage = ({ onNavigate }: DriverDashboardPageProps) => {
  const [userData] = useUserVariable<FairRideUserData>({
    key: 'fairride_userData',
    defaultValue: {
      name: '',
      email: '',
      userId: '',
      phone: '',
      role: 'driver',
      createdAt: Date.now(),
    },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  const [driverProfile, setDriverProfile] = useUserVariable<DriverProfile>({
    key: 'fairride_driverProfile',
    defaultValue: {
      userId: '',
      name: '',
      status: 'offline',
      currentLocation: { latitude: 35.7796, longitude: -78.6382 },
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'Silver',
        licensePlate: 'ABC 1234',
        capacity: 4,
      },
      rating: 4.8,
      totalRides: 142,
      totalEarnings: 3847.5,
      lastLocationUpdate: Date.now(),
    },
    privacy: 'PUBLIC',
    filterKey: 'status',
  });

  const { showToast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);

  const profile = driverProfile.value;
  const isOnline = profile.status === 'online';

  const handleToggleOnline = () => {
    const nextStatus: DriverStatus = isOnline ? 'offline' : 'online';
    setDriverProfile({
      ...profile,
      status: nextStatus,
      lastLocationUpdate: Date.now(),
    });
    showToast(nextStatus === 'online' ? 'You are now online!' : 'You are now offline');
  };

  const handleSimulateRideRequest = () => {
    if (!isOnline) {
      showToast('Go online first to receive ride requests');
      return;
    }
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      onNavigate('ride_offer');
    }, 2000);
  };

  const todayEarnings = 87.5;
  const todayRides = 5;
  const todayHours = 3.5;
  const todayPerHour = todayEarnings / todayHours;

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <UserAvatar name={userData.value.name || 'Driver'} size={48} />
          <Column gap={0} className="flex-1">
            <PoppinsText weight="medium">{userData.value.name || 'Driver'}</PoppinsText>
            <RatingStars rating={profile.rating} size="sm" />
          </Column>
          <AppButton
            variant="outline"
            className="h-10 w-10 p-0"
            onPress={() => onNavigate('profile')}>
            <PoppinsText>⚙</PoppinsText>
          </AppButton>
        </Row>

        <AppButton
          variant={isOnline ? 'green' : 'grey'}
          className="h-16"
          onPress={handleToggleOnline}>
          <Column gap={0} className="items-center">
            <PoppinsText color="white" weight="bold">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </PoppinsText>
            <PoppinsText color="white" style={{ fontSize: 11 }}>
              {isOnline ? 'Tap to go offline' : 'Tap to go online'}
            </PoppinsText>
          </Column>
        </AppButton>

        <MapPlaceholder center={profile.currentLocation} className="h-40 w-full" />

        <PoppinsText weight="bold" style={{ fontSize: 18 }}>
          Today
        </PoppinsText>

        <Row gap={2} className="w-full">
          <StatCard label="Earnings" value={formatCurrency(todayEarnings)} />
          <StatCard label="Rides" value={String(todayRides)} />
          <StatCard label="$/hr" value={formatCurrency(todayPerHour)} />
        </Row>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <PoppinsText weight="medium">Lifetime Stats</PoppinsText>
            <View className="bg-subtle-border h-px" />
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Total Rides</PoppinsText>
              <PoppinsText weight="medium">{profile.totalRides}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Total Earnings</PoppinsText>
              <PoppinsText weight="medium">{formatCurrency(profile.totalEarnings)}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Rating</PoppinsText>
              <RatingStars rating={profile.rating} size="sm" />
            </Row>
          </Column>
        </View>

        {isOnline && (
          <AppButton
            variant="outline"
            className="h-14"
            onPress={handleSimulateRideRequest}
            disabled={isSimulating}>
            <PoppinsText weight="medium">
              {isSimulating ? 'Waiting for request...' : 'Simulate Ride Request'}
            </PoppinsText>
          </AppButton>
        )}

        <Row gap={2} className="w-full">
          <AppButton variant="outline" className="flex-1" onPress={() => onNavigate('earnings')}>
            <PoppinsText>Earnings</PoppinsText>
          </AppButton>
          <AppButton variant="outline" className="flex-1" onPress={() => onNavigate('profile')}>
            <PoppinsText>Vehicle</PoppinsText>
          </AppButton>
        </Row>

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              FairRide Driver Benefit
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              You keep 92% of every fare. No hidden deductions, no mandatory insurance upsells. Just
              fair pay for fair work.
            </PoppinsText>
          </Column>
        </View>
      </Column>
    </ScrollView>
  );
};

export default DriverDashboardPage;
