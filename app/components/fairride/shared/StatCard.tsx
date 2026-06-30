import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  /** Stagger index for the entrance cascade. */
  index?: number;
  className?: string;
}

const StatCard = ({ label, value, subtitle, index = 0, className = '' }: StatCardProps) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80)
        .duration(400)
        .springify()
        .damping(15)}
      className={`border-border bg-inner-background flex-1 rounded-xl border p-3 ${className}`}>
      <Column gap={1} className="items-center">
        <PoppinsText varient="subtext" weight="medium">
          {label}
        </PoppinsText>
        <PoppinsText weight="bold" style={{ fontSize: 20 }}>
          {value}
        </PoppinsText>
        {subtitle && <PoppinsText varient="subtext">{subtitle}</PoppinsText>}
      </Column>
    </Animated.View>
  );
};

export default StatCard;
