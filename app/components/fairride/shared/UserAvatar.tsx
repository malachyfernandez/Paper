import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const UserAvatar = ({ name, size = 40, className = '' }: UserAvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`bg-primary-accent items-center justify-center ${className}`}>
      <PoppinsText color="white" weight="bold" style={{ fontSize: size * 0.35 }}>
        {initials || '?'}
      </PoppinsText>
    </View>
  );
};

export default UserAvatar;
