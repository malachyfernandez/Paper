import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import StatCard from '../shared/StatCard';
import RideHistoryCard from '../shared/RideHistoryCard';
import type { DriverScreen, RideHistoryItem } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface DriverEarningsPageProps {
  onNavigate: (screen: DriverScreen) => void;
}

type EarningsPeriod = 'today' | 'week' | 'month' | 'all';

const DEMO_EARNINGS: Record<EarningsPeriod, { earnings: number; rides: number; hours: number }> = {
  today: { earnings: 87.5, rides: 5, hours: 3.5 },
  week: { earnings: 524.3, rides: 28, hours: 22 },
  month: { earnings: 2150.0, rides: 118, hours: 89 },
  all: { earnings: 3847.5, rides: 142, hours: 108 },
};

const DEMO_HISTORY: RideHistoryItem[] = [
  {
    id: 'e_ride_001',
    pickup: { latitude: 35.78, longitude: -78.64, address: '123 Main St' },
    dropoff: { latitude: 35.88, longitude: -78.79, address: 'RDU Airport' },
    rideType: 'economy',
    status: 'completed',
    totalFare: 18.42,
    driverPay: 16.95,
    distanceMiles: 12.3,
    durationMinutes: 22,
    riderName: 'Jordan M.',
    rating: 5,
    createdAt: Date.now() - 3600000,
    completedAt: Date.now() - 3600000 + 1320000,
  },
  {
    id: 'e_ride_002',
    pickup: { latitude: 35.77, longitude: -78.64, address: '456 Fayetteville St' },
    dropoff: { latitude: 35.82, longitude: -78.66, address: 'North Hills' },
    rideType: 'comfort',
    status: 'completed',
    totalFare: 14.6,
    driverPay: 13.43,
    distanceMiles: 5.2,
    durationMinutes: 14,
    riderName: 'Sam K.',
    rating: 5,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'e_ride_003',
    pickup: { latitude: 35.79, longitude: -78.68, address: 'NC State' },
    dropoff: { latitude: 35.77, longitude: -78.64, address: 'Downtown' },
    rideType: 'economy',
    status: 'completed',
    totalFare: 8.9,
    driverPay: 8.19,
    distanceMiles: 3.1,
    durationMinutes: 10,
    riderName: 'Chris L.',
    rating: 4,
    createdAt: Date.now() - 14400000,
  },
];

const RiderEarningsPage = ({ onNavigate }: DriverEarningsPageProps) => {
  const [period, setPeriod] = useState<EarningsPeriod>('today');
  const stats = DEMO_EARNINGS[period];
  const perHour = stats.hours > 0 ? stats.earnings / stats.hours : 0;
  const perRide = stats.rides > 0 ? stats.earnings / stats.rides : 0;

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
            Earnings
          </PoppinsText>
        </Row>

        <Row gap={1} className="w-full">
          {(['today', 'week', 'month', 'all'] as EarningsPeriod[]).map((p) => (
            <AppButton
              key={p}
              variant={period === p ? 'green' : 'outline'}
              className="h-9 flex-1"
              onPress={() => setPeriod(p)}>
              <PoppinsText color={period === p ? 'white' : 'black'} style={{ fontSize: 12 }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </PoppinsText>
            </AppButton>
          ))}
        </Row>

        <View className="bg-primary-accent items-center rounded p-6">
          <Column gap={1} className="items-center">
            <PoppinsText color="white" varient="subtext">
              Total Earnings
            </PoppinsText>
            <PoppinsText color="white" weight="bold" style={{ fontSize: 40 }}>
              {formatCurrency(stats.earnings)}
            </PoppinsText>
          </Column>
        </View>

        <Row gap={2} className="w-full">
          <StatCard label="Rides" value={String(stats.rides)} />
          <StatCard label="Hours" value={stats.hours.toFixed(1)} />
          <StatCard label="$/hr" value={formatCurrency(perHour)} />
        </Row>

        <Row gap={2} className="w-full">
          <StatCard label="Avg/Ride" value={formatCurrency(perRide)} />
          <StatCard label="Platform Fee" value="8%" subtitle="Industry-low" />
        </Row>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <PoppinsText weight="medium">Earnings vs. Uber</PoppinsText>
            <View className="bg-subtle-border h-px" />
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Same rides on Uber</PoppinsText>
              <PoppinsText>~{formatCurrency((stats.earnings * 0.75) / 0.92)}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext">Uber driver pay (75%)</PoppinsText>
              <PoppinsText>~{formatCurrency(((stats.earnings * 0.75) / 0.92) * 0.75)}</PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText weight="medium" className="text-primary-accent">
                FairRide driver pay (92%)
              </PoppinsText>
              <PoppinsText weight="bold">{formatCurrency(stats.earnings)}</PoppinsText>
            </Row>
            <View className="bg-primary-accent/10 mt-1 rounded p-2">
              <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
                You earn ~{((0.92 / 0.75 - 1) * 100).toFixed(0)}% more on FairRide compared to Uber
                for the same rides.
              </PoppinsText>
            </View>
          </Column>
        </View>

        <PoppinsText weight="bold" style={{ fontSize: 18 }}>
          Recent Rides
        </PoppinsText>

        <Column gap={2}>
          {DEMO_HISTORY.map((ride) => (
            <RideHistoryCard key={ride.id} ride={ride} viewAs="driver" />
          ))}
        </Column>
      </Column>
    </ScrollView>
  );
};

export default RiderEarningsPage;
