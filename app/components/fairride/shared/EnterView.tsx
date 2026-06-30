import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EnterViewProps {
  children: React.ReactNode;
  /** Stagger index — each step delays the entrance by ~70ms. */
  index?: number;
  /** Explicit delay override in ms. Takes precedence over index. */
  delay?: number;
  className?: string;
  style?: ViewStyle;
}

/**
 * Wraps content in a springy fade-in-from-below entrance. Pass an incrementing
 * `index` to neighbouring items to get a staggered cascade as a screen mounts.
 */
const EnterView = ({ children, index = 0, delay, className, style }: EnterViewProps) => (
  <Animated.View
    className={className}
    style={style}
    entering={FadeInDown.delay(delay ?? index * 70)
      .duration(420)
      .springify()
      .damping(16)}>
    {children}
  </Animated.View>
);

export default EnterView;
