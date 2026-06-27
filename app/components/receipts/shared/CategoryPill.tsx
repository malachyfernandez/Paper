import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import { ReceiptCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../../../../types/receipts';

interface CategoryPillProps {
  category: ReceiptCategory;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

const CategoryPill = ({ category, selected, onPress, compact }: CategoryPillProps) => {
  const content = (
    <View
      className={`flex-row items-center gap-1 rounded-full border-2 px-3 py-1 ${
        selected
          ? 'border-primary-accent bg-primary-accent/10'
          : 'border-border bg-inner-background'
      }`}>
      <PoppinsText style={{ fontSize: 12 }}>{CATEGORY_ICONS[category]}</PoppinsText>
      {!compact && (
        <PoppinsText
          weight={selected ? 'medium' : 'regular'}
          style={{ fontSize: 12, opacity: selected ? 1 : 0.7 }}>
          {CATEGORY_LABELS[category]}
        </PoppinsText>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
};

export default CategoryPill;
