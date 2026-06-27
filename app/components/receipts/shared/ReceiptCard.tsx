import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MoneyText from './MoneyText';
import { Receipt, CurrencyCode, ExchangeRates, CATEGORY_ICONS } from '../../../../types/receipts';
import { convertToHome } from '../../../../utils/currencyConversion';

interface ReceiptCardProps {
  receipt: Receipt;
  homeCurrency: CurrencyCode;
  rates: ExchangeRates;
  onPress: () => void;
}

const ReceiptCard = ({ receipt, homeCurrency, rates, onPress }: ReceiptCardProps) => {
  const homeAmount = convertToHome(receipt.amount, receipt.currency, homeCurrency, rates);
  const isForeign = receipt.currency !== homeCurrency;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View className="border-border bg-inner-background rounded border-2 p-3">
        <Row gap={3} className="w-full items-center">
          {receipt.image && receipt.image.url ? (
            <Image
              source={{ uri: receipt.image.url }}
              style={{ width: 48, height: 48, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="border-border bg-background items-center justify-center rounded border"
              style={{ width: 48, height: 48 }}>
              <PoppinsText style={{ fontSize: 20 }}>{CATEGORY_ICONS[receipt.category]}</PoppinsText>
            </View>
          )}

          <Column gap={0} className="flex-1">
            <PoppinsText weight="medium">{receipt.merchant || 'Untitled'}</PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 12 }} className="flex-1">
              {receipt.purpose || 'No purpose noted'}
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 10 }}>
              {receipt.purchaseDate}
            </PoppinsText>
          </Column>

          <Column gap={0} className="items-end">
            <MoneyText
              amount={receipt.amount}
              currency={receipt.currency}
              weight="bold"
              size={15}
            />
            {isForeign && (
              <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
                ≈{' '}
                {homeCurrency === 'JPY' || homeCurrency === 'KRW'
                  ? Math.round(homeAmount).toLocaleString()
                  : homeAmount.toFixed(2)}{' '}
                {homeCurrency}
              </PoppinsText>
            )}
          </Column>
        </Row>
      </View>
    </TouchableOpacity>
  );
};

export default ReceiptCard;
