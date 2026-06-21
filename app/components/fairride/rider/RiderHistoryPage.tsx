import React from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import RideHistoryCard from '../shared/RideHistoryCard';
import StatCard from '../shared/StatCard';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import type { RideHistoryItem, RiderScreen } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface RiderHistoryPageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const DEMO_HISTORY: RideHistoryItem[] = [
  {
    id: 'ride_001',
    pickup: { latitude: 35.78, longitude: -78.64, address: '123 Main St, Raleigh' },
    dropoff: { latitude: 35.88, longitude: -78.79, address: 'RDU Airport' },
    rideType: 'economy',
    status: 'completed',
    totalFare: 18.42,
    driverPay: 16.95,
    distanceMiles: 12.3,
    durationMinutes: 22,
    driverName: 'Alex D.',
    rating: 5,
    createdAt: Date.now() - 86400000,
    completedAt: Date.now() - 86400000 + 1320000,
  },
  {
    id: 'ride_002',
    pickup: { latitude: 35.77, longitude: -78.64, address: '456 Fayetteville St' },
    dropoff: { latitude: 35.82, longitude: -78.66, address: 'North Hills Mall' },
    rideType: 'comfort',
    status: 'completed',
    totalFare: 12.8,
    driverPay: 11.78,
    distanceMiles: 5.2,
    durationMinutes: 14,
    driverName: 'Maria S.',
    rating: 4,
    createdAt: Date.now() - 172800000,
    completedAt: Date.now() - 172800000 + 840000,
  },
  {
    id: 'ride_003',
    pickup: { latitude: 35.79, longitude: -78.68, address: 'NC State University' },
    dropoff: { latitude: 35.77, longitude: -78.64, address: 'Downtown Raleigh' },
    rideType: 'economy',
    status: 'cancelled',
    totalFare: 0,
    driverPay: 0,
    distanceMiles: 3.1,
    durationMinutes: 10,
    createdAt: Date.now() - 259200000,
  },
];

const RiderHistoryPage = ({ onNavigate }: RiderHistoryPageProps) => {
  const rideHistory = useUserListGet<RideHistoryItem>({
    key: 'fairride_rideHistory',
    returnTop: 50,
  });

  const displayHistory =
    rideHistory && rideHistory.length > 0 ? rideHistory.map((r) => r.value) : DEMO_HISTORY;

  const totalSpent = displayHistory
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.totalFare, 0);

  const completedRides = displayHistory.filter((r) => r.status === 'completed');
  const avgRating =
    completedRides.length > 0
      ? completedRides.reduce((sum, r) => sum + (r.rating ?? 0), 0) / completedRides.length
      : 0;

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={() => onNavigate('home')}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 20 }}>
            Ride History
          </PoppinsText>
        </Row>

        <Row gap={2} className="w-full">
          <StatCard label="Total Rides" value={String(displayHistory.length)} />
          <StatCard label="Total Spent" value={formatCurrency(totalSpent)} />
          <StatCard label="Avg Rating" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} />
        </Row>

        {displayHistory.length === 0 ? (
          <View className="items-center py-8">
            <PoppinsText varient="subtext">No rides yet</PoppinsText>
          </View>
        ) : (
          <Column gap={2}>
            {displayHistory.map((ride) => (
              <RideHistoryCard key={ride.id} ride={ride} viewAs="rider" />
            ))}
          </Column>
        )}
      </Column>
    </ScrollView>
  );
};

export default RiderHistoryPage;
