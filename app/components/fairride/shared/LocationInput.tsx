import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import Column from '../../layout/Column';
import Row from '../../layout/Row';

interface LocationInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  dotColor?: string;
  placeholder?: string;
  className?: string;
}

const LocationInput = ({
  label,
  value,
  onChangeText,
  dotColor = 'bg-primary-accent',
  placeholder = 'Enter address...',
  className = '',
}: LocationInputProps) => {
  return (
    <Row gap={3} className={`w-full items-center ${className}`}>
      <Column gap={0} className="items-center">
        <View className={`h-3 w-3 rounded-full ${dotColor}`} />
      </Column>
      <Column gap={1} className="flex-1">
        <PoppinsText varient="subtext" weight="medium">
          {label}
        </PoppinsText>
        <PoppinsTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          className="border-border border-b-2 bg-transparent px-2 py-2"
        />
      </Column>
    </Row>
  );
};

export default LocationInput;
