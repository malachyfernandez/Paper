import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import FareBreakdownCard from '../shared/FareBreakdownCard';
import RatingStars from '../shared/RatingStars';
import UserAvatar from '../shared/UserAvatar';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import { useUserListSet } from '../../../../hooks/useUserListSet';
import { useToast } from '../../../../contexts/ToastContext';
import { generateId } from '../../../../utils/generateId';
import type { DriverScreen, Location } from '../../../../types/fairride';
import {
  calculateFare,
  haversineDistanceMiles,
  estimateMinutes,
} from '../../../../utils/fairridePricing';

interface DriverRideCompletePageProps {
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

const DriverRideCompletePage = ({ onNavigate }: DriverRideCompletePageProps) => {
  const setRating = useUserListSet();
  const { showToast } = useToast();

  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

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

  const handleSubmitRating = () => {
    const ratingId = generateId(16);
    setRating({
      key: 'fairride_ratings',
      itemId: ratingId,
      value: {
        id: ratingId,
        rideId: 'ride_demo',
        fromUserId: 'driver_demo',
        toUserId: 'rider_demo',
        fromRole: 'driver',
        stars: riderRating,
        comment: comment || undefined,
        createdAt: Date.now(),
      },
      privacy: 'PUBLIC',
    });

    setHasRated(true);
    showToast('Rider rated!');
  };

  const handleDone = () => {
    onNavigate('dashboard');
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Column gap={1} className="items-center">
          <View className="bg-primary-accent h-16 w-16 items-center justify-center rounded-full">
            <PoppinsText color="white" weight="bold" style={{ fontSize: 24 }}>
              ✓
            </PoppinsText>
          </View>
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            Ride Complete
          </PoppinsText>
        </Column>

        <View className="bg-primary-accent items-center rounded p-4">
          <Column gap={1} className="items-center">
            <PoppinsText color="white" varient="subtext">
              You earned
            </PoppinsText>
            <PoppinsText color="white" weight="bold" style={{ fontSize: 36 }}>
              ${fare.driverPay.toFixed(2)}
            </PoppinsText>
            <PoppinsText color="white" varient="subtext">
              92% of ${fare.totalFare.toFixed(2)} fare
            </PoppinsText>
          </Column>
        </View>

        <FareBreakdownCard fare={fare} showDriverPay />

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <Row gap={3} className="items-center">
              <UserAvatar name="Jordan M." size={48} />
              <Column gap={0} className="flex-1">
                <PoppinsText weight="medium">Jordan M.</PoppinsText>
                <PoppinsText varient="subtext">Economy ride</PoppinsText>
              </Column>
            </Row>

            {!hasRated ? (
              <Column gap={3}>
                <PoppinsText weight="medium">Rate this rider</PoppinsText>
                <RatingStars rating={riderRating} interactive onRate={setRiderRating} size="lg" />

                <PoppinsTextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Leave a comment (optional)"
                  className="border-border border-2 bg-transparent px-3 py-2"
                />

                <AppButton variant="green" onPress={handleSubmitRating}>
                  <PoppinsText color="white" weight="medium">
                    Submit Rating
                  </PoppinsText>
                </AppButton>
              </Column>
            ) : (
              <Column gap={1} className="items-center">
                <RatingStars rating={riderRating} size="md" />
                <PoppinsText varient="subtext">Rating submitted</PoppinsText>
              </Column>
            )}
          </Column>
        </View>

        <Row gap={2} className="w-full">
          <View className="border-border flex-1 items-center rounded border-2 p-2">
            <PoppinsText varient="subtext">Distance</PoppinsText>
            <PoppinsText weight="bold">{distanceMiles.toFixed(1)} mi</PoppinsText>
          </View>
          <View className="border-border flex-1 items-center rounded border-2 p-2">
            <PoppinsText varient="subtext">Duration</PoppinsText>
            <PoppinsText weight="bold">{durationMinutes} min</PoppinsText>
          </View>
          <View className="border-primary-accent bg-primary-accent/10 flex-1 items-center rounded border-2 p-2">
            <PoppinsText varient="subtext">$/mi</PoppinsText>
            <PoppinsText weight="bold">${(fare.driverPay / distanceMiles).toFixed(2)}</PoppinsText>
          </View>
        </Row>

        <AppButton variant="green" className="h-14" onPress={handleDone}>
          <PoppinsText color="white" weight="bold">
            Back to Dashboard
          </PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default DriverRideCompletePage;
