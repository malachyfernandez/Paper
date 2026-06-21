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
import type { FairRideUserData, RiderScreen } from '../../../../types/fairride';

interface RiderProfilePageProps {
  onNavigate: (screen: RiderScreen) => void;
  onSwitchToDriver: () => void;
}

const RiderProfilePage = ({ onNavigate, onSwitchToDriver }: RiderProfilePageProps) => {
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

  const { signOut } = useAppAuth();

  const user = userData.value;
  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString();

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={() => onNavigate('home')}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 20 }}>
            Profile
          </PoppinsText>
        </Row>

        <Column gap={3} className="items-center py-4">
          <UserAvatar name={user.name || 'Rider'} size={80} />
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            {user.name || 'Rider'}
          </PoppinsText>
          <PoppinsText varient="subtext">{user.email}</PoppinsText>
          <RatingStars rating={4.9} size="md" />
        </Column>

        <Row gap={2} className="w-full">
          <StatCard label="Member Since" value={memberSince} />
          <StatCard label="Rides Taken" value="12" />
        </Row>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <PoppinsText weight="medium">Account</PoppinsText>
            <View className="bg-subtle-border h-px" />

            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Phone</PoppinsText>
              <PoppinsText>{user.phone || 'Not set'}</PoppinsText>
            </Row>

            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Role</PoppinsText>
              <PoppinsText>{user.role}</PoppinsText>
            </Row>
          </Column>
        </View>

        <AppButton variant="outline" onPress={onSwitchToDriver}>
          <PoppinsText weight="medium">Switch to Driver Mode</PoppinsText>
        </AppButton>

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              About FairRide
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              FairRide is built on the principle that ride-sharing should be affordable for riders
              and fair for drivers. We take only 8% — just enough to keep the platform running.
            </PoppinsText>
          </Column>
        </View>

        <AppButton variant="red" onPress={signOut}>
          <PoppinsText color="red" weight="medium">
            Sign Out
          </PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default RiderProfilePage;
