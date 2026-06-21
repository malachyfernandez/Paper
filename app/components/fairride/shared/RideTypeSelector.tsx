import React from 'react';
import { Pressable, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Row from '../../layout/Row';
import Column from '../../layout/Column';
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
}) => (
  <Pressable onPress={onPress} className="flex-1">
    <View
      className={`items-center rounded border-2 p-3 ${
        isSelected ? 'border-primary-accent bg-primary-accent/10' : 'border-border'
      }`}>
      <Column gap={1} className="items-center">
        <PoppinsText weight={isSelected ? 'bold' : 'regular'}>{RIDE_TYPE_LABELS[type]}</PoppinsText>
        <PoppinsText varient="subtext">{RIDE_TYPE_CAPACITY[type]} seats</PoppinsText>
        {estimate && (
          <PoppinsText weight="medium">{formatCurrency(estimate.totalFare)}</PoppinsText>
        )}
      </Column>
    </View>
  </Pressable>
);

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
