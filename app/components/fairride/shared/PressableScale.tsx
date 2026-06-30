import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  /** Scale applied while pressed. Defaults to 0.96. */
  pressedScale?: number;
  className?: string;
  style?: ViewStyle;
}

/**
 * A Pressable that springs down slightly when pressed, giving every tappable
 * surface a tactile, physical feel. Built on react-native-reanimated so the
 * animation runs on the UI thread at 60fps.
 */
const PressableScale = ({ children, pressedScale = 0.96, style, ...rest }: PressableScaleProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, { damping: 18, stiffness: 320 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        rest.onPressOut?.(e);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
