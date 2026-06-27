import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MoneyText from './MoneyText';
import { CurrencyCode } from '../../../../types/receipts';

interface SpendBarProps {
  label: string;
  amount: number;
  max: number;
  homeCurrency: CurrencyCode;
  icon?: string;
  color?: string;
}

const SpendBar = ({ label, amount, max, homeCurrency, icon, color }: SpendBarProps) => {
  const pct = max > 0 ? Math.max(0.04, amount / max) : 0;

  return (
    <Column gap={1} className="w-full">
      <Row gap={2} className="w-full items-center justify-between">
        <Row gap={1} className="items-center">
          {icon && <PoppinsText style={{ fontSize: 13 }}>{icon}</PoppinsText>}
          <PoppinsText style={{ fontSize: 13 }}>{label}</PoppinsText>
        </Row>
        <MoneyText amount={amount} currency={homeCurrency} weight="medium" size={13} />
      </Row>
      <View className="bg-background h-2 w-full overflow-hidden rounded-full">
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: color || '#2d5a2d',
            borderRadius: 999,
          }}
        />
      </View>
    </Column>
  );
};

export default SpendBar;
