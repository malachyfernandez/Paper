import React from 'react';
import { Pressable, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import RatingStars from './RatingStars';
import type { RideHistoryItem } from '../../../../types/fairride';
import { RIDE_TYPE_LABELS } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface RideHistoryCardProps {
  ride: RideHistoryItem;
  viewAs: 'rider' | 'driver';
  onPress?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-primary-accent',
  cancelled: 'bg-red-500',
  in_progress: 'bg-blue-500',
};

const RideHistoryCard = ({ ride, viewAs, onPress, className = '' }: RideHistoryCardProps) => {
  const statusColor = STATUS_COLORS[ride.status] ?? 'bg-subtle-border';
  const dateStr = new Date(ride.createdAt).toLocaleDateString();

  return (
    <Pressable onPress={onPress}>
      <View className={`border-border bg-inner-background rounded border-2 p-4 ${className}`}>
        <Column gap={2}>
          <Row gap={2} className="w-full items-center justify-between">
            <Row gap={2} className="items-center">
              <View className={`h-2 w-2 rounded-full ${statusColor}`} />
              <PoppinsText weight="medium">{RIDE_TYPE_LABELS[ride.rideType]}</PoppinsText>
            </Row>
            <PoppinsText varient="subtext">{dateStr}</PoppinsText>
          </Row>

          <Column gap={1}>
            <Row gap={2} className="items-center">
              <View className="bg-primary-accent h-2 w-2 rounded-full" />
              <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                {ride.pickup.address}
              </PoppinsText>
            </Row>
            <Row gap={2} className="items-center">
              <View className="h-2 w-2 rounded-full bg-red-500" />
              <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                {ride.dropoff.address}
              </PoppinsText>
            </Row>
          </Column>

          <Row gap={2} className="w-full items-center justify-between">
            <PoppinsText weight="medium">
              {viewAs === 'driver'
                ? formatCurrency(ride.driverPay)
                : formatCurrency(ride.totalFare)}
            </PoppinsText>
            <Row gap={2} className="items-center">
              <PoppinsText varient="subtext">
                {ride.distanceMiles.toFixed(1)} mi · {ride.durationMinutes} min
              </PoppinsText>
              {ride.rating !== undefined && <RatingStars rating={ride.rating} size="sm" />}
            </Row>
          </Row>

          {viewAs === 'rider' && ride.driverName && (
            <PoppinsText varient="subtext">Driver: {ride.driverName}</PoppinsText>
          )}
          {viewAs === 'driver' && ride.riderName && (
            <PoppinsText varient="subtext">Rider: {ride.riderName}</PoppinsText>
          )}
        </Column>
      </View>
    </Pressable>
  );
};

export default RideHistoryCard;
