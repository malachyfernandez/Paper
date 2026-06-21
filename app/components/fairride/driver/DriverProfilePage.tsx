import React from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import UserAvatar from '../shared/UserAvatar';
import RatingStars from '../shared/RatingStars';
import StatCard from '../shared/StatCard';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useAppAuth } from '../../../../contexts/AppAuthContext';
import type { DriverProfile, DriverScreen, FairRideUserData } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface DriverProfilePageProps {
  onNavigate: (screen: DriverScreen) => void;
  onSwitchToRider: () => void;
}

const DriverProfilePage = ({ onNavigate, onSwitchToRider }: DriverProfilePageProps) => {
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

  const [driverProfile] = useUserVariable<DriverProfile>({
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
  });

  const { signOut } = useAppAuth();

  const user = userData.value;
  const profile = driverProfile.value;
  const vehicle = profile.vehicleInfo;

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton
            variant="outline"
            className="h-10 w-10 p-0"
            onPress={() => onNavigate('dashboard')}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 20 }}>
            Driver Profile
          </PoppinsText>
        </Row>

        <Column gap={3} className="items-center py-4">
          <UserAvatar name={user.name || 'Driver'} size={80} />
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            {user.name || 'Driver'}
          </PoppinsText>
          <RatingStars rating={profile.rating} size="md" />
          <PoppinsText varient="subtext">{user.email}</PoppinsText>
        </Column>

        <Row gap={2} className="w-full">
          <StatCard label="Rides" value={String(profile.totalRides)} />
          <StatCard label="Earned" value={formatCurrency(profile.totalEarnings)} />
          <StatCard label="Rating" value={profile.rating.toFixed(1)} />
        </Row>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <PoppinsText weight="medium">Vehicle Info</PoppinsText>
            <View className="bg-subtle-border h-px" />

            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Vehicle</PoppinsText>
              <PoppinsText>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Color</PoppinsText>
              <PoppinsText>{vehicle.color}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">License Plate</PoppinsText>
              <PoppinsText>{vehicle.licensePlate}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Capacity</PoppinsText>
              <PoppinsText>{vehicle.capacity} passengers</PoppinsText>
            </Row>
          </Column>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <PoppinsText weight="medium">Account</PoppinsText>
            <View className="bg-subtle-border h-px" />

            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Phone</PoppinsText>
              <PoppinsText>{user.phone || 'Not set'}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Status</PoppinsText>
              <PoppinsText>{profile.status}</PoppinsText>
            </Row>
          </Column>
        </View>

        <AppButton variant="outline" onPress={onSwitchToRider}>
          <PoppinsText weight="medium">Switch to Rider Mode</PoppinsText>
        </AppButton>

        <AppButton variant="red" onPress={signOut}>
          <PoppinsText color="red" weight="medium">
            Sign Out
          </PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default DriverProfilePage;
