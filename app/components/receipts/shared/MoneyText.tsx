import React from 'react';
import PoppinsText from '../../ui/text/PoppinsText';
import { CurrencyCode } from '../../../../types/receipts';
import { formatMoney } from '../../../../utils/currencyConversion';

interface MoneyTextProps {
  amount: number;
  currency: CurrencyCode;
  weight?: 'regular' | 'medium' | 'bold';
  size?: number;
  color?: 'black' | 'white' | 'red';
  className?: string;
}

const MoneyText = ({
  amount,
  currency,
  weight = 'medium',
  size,
  color = 'black',
  className = '',
}: MoneyTextProps) => {
  return (
    <PoppinsText
      weight={weight}
      color={color}
      className={className}
      style={size ? { fontSize: size } : undefined}>
      {formatMoney(amount, currency)}
    </PoppinsText>
  );
};

export default MoneyText;
