import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';

interface StatTileProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
}

const StatTile = ({ label, value, subtitle, className = '' }: StatTileProps) => {
  return (
    <View className={`border-border bg-inner-background flex-1 rounded border-2 p-3 ${className}`}>
      <Column gap={1} className="items-center">
        <PoppinsText varient="subtext" weight="medium" style={{ fontSize: 11 }}>
          {label}
        </PoppinsText>
        <PoppinsText weight="bold" style={{ fontSize: 18 }}>
          {value}
        </PoppinsText>
        {subtitle && (
          <PoppinsText varient="subtext" style={{ fontSize: 10 }}>
            {subtitle}
          </PoppinsText>
        )}
      </Column>
    </View>
  );
};

export default StatTile;
