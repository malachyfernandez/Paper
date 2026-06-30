import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import PoppinsText from '../../ui/text/PoppinsText';
import Row from '../../layout/Row';
import Column from '../../layout/Column';
import PressableScale from './PressableScale';
import type { RideType, FareBreakdown } from '../../../../types/fairride';
import { RIDE_TYPE_LABELS, RIDE_TYPE_CAPACITY } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface RideTypeSelectorProps {
  selected: RideType;
  onSelect: (type: RideType) => void;
  estimates?: Partial<Record<RideType, FareBreakdown>>;
  className?: string;
}

const RIDE_TYPES: RideType[] = ['economy', 'comfort', 'xl'];

const RideTypeOption = ({
  type,
  isSelected,
  onPress,
  estimate,
}: {
  type: RideType;
  isSelected: boolean;
  onPress: () => void;
  estimate?: FareBreakdown;
}) => {
  const select = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    select.value = withSpring(isSelected ? 1 : 0, { damping: 13, stiffness: 200 });
  }, [isSelected, select]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + select.value * 0.04 }, { translateY: select.value * -3 }],
  }));

  return (
    <PressableScale onPress={onPress} style={{ flex: 1 }}>
      <Animated.View
        style={animatedStyle}
        className={`items-center rounded-xl border p-3 ${
          isSelected
            ? 'border-primary-accent bg-primary-accent/10'
            : 'border-border bg-inner-background'
        }`}>
        <Column gap={1} className="items-center">
          <PoppinsText weight={isSelected ? 'bold' : 'regular'}>
            {RIDE_TYPE_LABELS[type]}
          </PoppinsText>
          <PoppinsText varient="subtext">{RIDE_TYPE_CAPACITY[type]} seats</PoppinsText>
          {estimate && (
            <PoppinsText weight="medium">{formatCurrency(estimate.totalFare)}</PoppinsText>
          )}
        </Column>
      </Animated.View>
    </PressableScale>
  );
};

const RideTypeSelector = ({
  selected,
  onSelect,
  estimates,
  className = '',
}: RideTypeSelectorProps) => {
  return (
    <Row gap={2} className={`w-full ${className}`}>
      {RIDE_TYPES.map((type) => (
        <RideTypeOption
          key={type}
          type={type}
          isSelected={selected === type}
          onPress={() => onSelect(type)}
          estimate={estimates?.[type]}
        />
      ))}
    </Row>
  );
};

export default RideTypeSelector;
