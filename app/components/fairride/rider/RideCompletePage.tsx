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
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListSet } from '../../../../hooks/useUserListSet';
import { useToast } from '../../../../contexts/ToastContext';
import { generateId } from '../../../../utils/generateId';
import type { RideRequest, RiderScreen } from '../../../../types/fairride';

interface RideCompletePageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const RideCompletePage = ({ onNavigate }: RideCompletePageProps) => {
  const [activeRide, setActiveRide] = useUserVariable<RideRequest | null>({
    key: 'fairride_activeRide',
    defaultValue: null,
    privacy: 'PUBLIC',
  });

  const setRating = useUserListSet();
  const { showToast } = useToast();

  const [driverRating, setDriverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const ride = activeRide.value;

  const handleSubmitRating = () => {
    const ratingId = generateId(16);
    setRating({
      key: 'fairride_ratings',
      itemId: ratingId,
      value: {
        id: ratingId,
        rideId: ride?.id ?? 'unknown',
        fromUserId: ride?.riderId ?? 'demo',
        toUserId: 'driver_demo',
        fromRole: 'rider',
        stars: driverRating,
        comment: comment || undefined,
        createdAt: Date.now(),
      },
      privacy: 'PUBLIC',
    });

    setHasRated(true);
    showToast('Thanks for rating your driver!');
  };

  const handleDone = () => {
    setActiveRide(null);
    onNavigate('home');
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
          <PoppinsText varient="subtext">You arrived at your destination</PoppinsText>
        </Column>

        {ride?.estimatedFare && <FareBreakdownCard fare={ride.estimatedFare} />}

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <Row gap={3} className="items-center">
              <UserAvatar name="Alex D." size={48} />
              <Column gap={0} className="flex-1">
                <PoppinsText weight="medium">Alex D.</PoppinsText>
                <PoppinsText varient="subtext">Toyota Camry · ABC 1234</PoppinsText>
              </Column>
            </Row>

            {!hasRated ? (
              <Column gap={3}>
                <PoppinsText weight="medium">Rate your driver</PoppinsText>
                <RatingStars rating={driverRating} interactive onRate={setDriverRating} size="lg" />

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
                <RatingStars rating={driverRating} size="md" />
                <PoppinsText varient="subtext">Rating submitted</PoppinsText>
              </Column>
            )}
          </Column>
        </View>

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              Pricing Transparency
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              FairRide took only 8% (
              {ride?.estimatedFare ? `$${ride.estimatedFare.platformFee.toFixed(2)}` : '...'}) of
              this fare. Your driver earned{' '}
              {ride?.estimatedFare ? `$${ride.estimatedFare.driverPay.toFixed(2)}` : '...'} (92%).
            </PoppinsText>
          </Column>
        </View>

        <AppButton variant="green" className="h-14" onPress={handleDone}>
          <PoppinsText color="white" weight="bold">
            Done
          </PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default RideCompletePage;
