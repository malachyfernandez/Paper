import React from 'react';
import { Pressable, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Row from '../../layout/Row';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STAR_SIZES = { sm: 16, md: 24, lg: 36 };

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

        const star = (
          <View
            key={starIndex}
            style={{ width: starSize, height: starSize }}
            className={`items-center justify-center rounded-sm ${
              isFilled ? 'bg-primary-accent' : 'bg-subtle-border'
            }`}>
            <PoppinsText color={isFilled ? 'white' : 'black'} style={{ fontSize: starSize * 0.5 }}>
              ★
            </PoppinsText>
          </View>
        );

        if (interactive) {
          return (
            <Pressable key={starIndex} onPress={() => onRate?.(starIndex)}>
              {star}
            </Pressable>
          );
        }

        return star;
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
