import React from 'react';
import { Pressable, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Row from '../../layout/Row';
import type { PaymentMethod } from '../../../../types/fairride';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected?: boolean;
  onPress?: () => void;
  className?: string;
}

const PaymentMethodCard = ({
  method,
  isSelected = false,
  onPress,
  className = '',
}: PaymentMethodCardProps) => {
  return (
    <Pressable onPress={onPress}>
      <View
        className={`rounded border-2 p-3 ${
          isSelected ? 'border-primary-accent bg-primary-accent/10' : 'border-border'
        } ${className}`}>
        <Row gap={3} className="w-full items-center">
          <View className="bg-text h-8 w-12 items-center justify-center rounded">
            <PoppinsText color="white" weight="bold" style={{ fontSize: 10 }}>
              {method.brand?.toUpperCase() || method.type.toUpperCase()}
            </PoppinsText>
          </View>

          <View className="flex-1">
            <PoppinsText weight="medium">•••• {method.last4}</PoppinsText>
          </View>

          {method.isDefault && (
            <View className="bg-primary-accent rounded px-2 py-0.5">
              <PoppinsText color="white" style={{ fontSize: 10 }}>
                DEFAULT
              </PoppinsText>
            </View>
          )}
        </Row>
      </View>
    </Pressable>
  );
};

export default PaymentMethodCard;
