import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import PoppinsText from '../../ui/text/PoppinsText';
import Row from '../../layout/Row';
import PressableScale from './PressableScale';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STAR_SIZES = { sm: 16, md: 24, lg: 36 };

const Star = ({ filled, starSize }: { filled: boolean; starSize: number }) => {
  const pop = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    pop.value = withSpring(filled ? 1 : 0, { damping: 9, stiffness: 220 });
  }, [filled, pop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pop.value * 0.25 }],
  }));

  return (
    <Animated.View
      style={[{ width: starSize, height: starSize }, animatedStyle]}
      className={`items-center justify-center rounded-md ${
        filled ? 'bg-primary-accent' : 'bg-subtle-border'
      }`}>
      <PoppinsText color={filled ? 'white' : 'black'} style={{ fontSize: starSize * 0.5 }}>
        ★
      </PoppinsText>
    </Animated.View>
  );
};

const RatingStars = ({
  rating,
  maxStars = 5,
  interactive = false,
  onRate,
  size = 'md',
  className = '',
}: RatingStarsProps) => {
  const starSize = STAR_SIZES[size];

  return (
    <Row gap={1} className={`items-center ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= Math.round(rating);

        if (interactive) {
          return (
            <PressableScale key={starIndex} pressedScale={0.8} onPress={() => onRate?.(starIndex)}>
              <Star filled={isFilled} starSize={starSize} />
            </PressableScale>
          );
        }

        return <Star key={starIndex} filled={isFilled} starSize={starSize} />;
      })}
      {!interactive && (
        <PoppinsText varient="subtext" className="ml-1">
          {rating.toFixed(1)}
        </PoppinsText>
      )}
    </Row>
  );
};

export default RatingStars;
