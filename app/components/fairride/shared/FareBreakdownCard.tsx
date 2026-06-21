import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import type { FareBreakdown } from '../../../../types/fairride';
import { formatCurrency } from '../../../../utils/fairridePricing';

interface FareBreakdownCardProps {
  fare: FareBreakdown;
  showDriverPay?: boolean;
  className?: string;
}

const FareLineItem = ({ label, value }: { label: string; value: string }) => (
  <Row gap={2} className="w-full items-center justify-between">
    <PoppinsText varient="subtext">{label}</PoppinsText>
    <PoppinsText>{value}</PoppinsText>
  </Row>
);

const FareBreakdownCard = ({
  fare,
  showDriverPay = false,
  className = '',
}: FareBreakdownCardProps) => {
  return (
    <View className={`border-border bg-inner-background rounded border-2 p-4 ${className}`}>
      <Column gap={2}>
        <PoppinsText weight="medium">Fare Breakdown</PoppinsText>
        <View className="bg-subtle-border h-px" />

        <FareLineItem label="Base fare" value={formatCurrency(fare.baseFare)} />
        <FareLineItem
          label={`Distance (${fare.distanceMiles} mi)`}
          value={formatCurrency(fare.perMileCost)}
        />
        <FareLineItem
          label={`Time (${fare.durationMinutes} min)`}
          value={formatCurrency(fare.perMinuteCost)}
        />

        {fare.demandMultiplier > 1.0 && (
          <FareLineItem
            label={`Demand (${fare.demandMultiplier.toFixed(1)}x)`}
            value={`+${formatCurrency(fare.totalFare - fare.subtotal)}`}
          />
        )}

        <View className="bg-subtle-border h-px" />

        <FareLineItem label="Platform fee (8%)" value={formatCurrency(fare.platformFee)} />

        {showDriverPay && (
          <FareLineItem label="Your earnings (92%)" value={formatCurrency(fare.driverPay)} />
        )}

        <View className="bg-border h-px" />

        <Row gap={2} className="w-full items-center justify-between">
          <PoppinsText weight="bold">Total</PoppinsText>
          <PoppinsText weight="bold">{formatCurrency(fare.totalFare)}</PoppinsText>
        </Row>
      </Column>
    </View>
  );
};

export default FareBreakdownCard;
