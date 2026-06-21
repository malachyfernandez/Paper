import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
}

const StatCard = ({ label, value, subtitle, className = '' }: StatCardProps) => {
  return (
    <View className={`border-border bg-inner-background flex-1 rounded border-2 p-3 ${className}`}>
      <Column gap={1} className="items-center">
        <PoppinsText varient="subtext" weight="medium">
          {label}
        </PoppinsText>
        <PoppinsText weight="bold" style={{ fontSize: 20 }}>
          {value}
        </PoppinsText>
        {subtitle && <PoppinsText varient="subtext">{subtitle}</PoppinsText>}
      </Column>
    </View>
  );
};

export default StatCard;
