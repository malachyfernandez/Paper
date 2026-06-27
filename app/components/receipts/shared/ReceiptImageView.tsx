import React from 'react';
import { Image, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import { ReceiptImage } from '../../../../types/receipts';

interface ReceiptImageViewProps {
  image?: ReceiptImage;
  height?: number;
  className?: string;
}

const ReceiptImageView = ({ image, height = 160, className = '' }: ReceiptImageViewProps) => {
  if (image && image.url) {
    return (
      <Image
        source={{ uri: image.url }}
        style={{ width: '100%', height, borderRadius: 8 }}
        resizeMode="cover"
        className={className}
      />
    );
  }

  return (
    <View
      style={{ height }}
      className={`border-border bg-background items-center justify-center rounded border-2 border-dashed ${className}`}>
      <PoppinsText style={{ fontSize: 28 }}>🧾</PoppinsText>
      <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
        No photo attached
      </PoppinsText>
    </View>
  );
};

export default ReceiptImageView;
