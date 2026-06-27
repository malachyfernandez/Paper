import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import MoneyText from './MoneyText';
import { ReceiptGroup, CurrencyCode } from '../../../../types/receipts';

interface GroupCardProps {
  group: ReceiptGroup;
  receiptCount: number;
  totalHome: number;
  homeCurrency: CurrencyCode;
  onPress: () => void;
}

const GroupCard = ({ group, receiptCount, totalHome, homeCurrency, onPress }: GroupCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        className="border-border bg-inner-background rounded border-2 p-4"
        style={{ borderLeftWidth: 6, borderLeftColor: group.color }}>
        <Row gap={3} className="w-full items-center">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 44, height: 44, backgroundColor: `${group.color}22` }}>
            <PoppinsText style={{ fontSize: 22 }}>{group.emoji}</PoppinsText>
          </View>
          <Column gap={0} className="flex-1">
            <PoppinsText weight="bold">{group.name}</PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
              {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'}
              {group.description ? ` · ${group.description}` : ''}
            </PoppinsText>
          </Column>
          <Column gap={0} className="items-end">
            <MoneyText amount={totalHome} currency={homeCurrency} weight="bold" size={16} />
            <PoppinsText varient="subtext" style={{ fontSize: 10 }}>
              total
            </PoppinsText>
          </Column>
        </Row>
      </View>
    </TouchableOpacity>
  );
};

export default GroupCard;
