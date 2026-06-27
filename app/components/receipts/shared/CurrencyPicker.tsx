import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import { CurrencyCode, COMMON_CURRENCIES } from '../../../../types/receipts';

interface CurrencyPickerProps {
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
}

const CurrencyPicker = ({ selected, onSelect }: CurrencyPickerProps) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {COMMON_CURRENCIES.map((c) => {
          const isSelected = c.code === selected;
          return (
            <TouchableOpacity key={c.code} onPress={() => onSelect(c.code)} activeOpacity={0.8}>
              <View
                className={`items-center rounded border-2 px-3 py-2 ${
                  isSelected
                    ? 'border-primary-accent bg-primary-accent/10'
                    : 'border-border bg-inner-background'
                }`}>
                <PoppinsText weight={isSelected ? 'bold' : 'regular'} style={{ fontSize: 14 }}>
                  {c.symbol} {c.code}
                </PoppinsText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default CurrencyPicker;
