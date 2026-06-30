import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';

interface ScanningOverlayProps {
  height: number;
  status: string;
  subtitle: string;
}

/**
 * Animated overlay shown while the AI "reads" a receipt photo: a vertically
 * sweeping scan line, a spinning accent ring, and pulsing status text. Built on
 * react-native-reanimated for smooth 60fps motion.
 */
const ScanningOverlay = ({ height, status, subtitle }: ScanningOverlayProps) => {
  const sweep = useSharedValue(0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    spin.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse, spin, sweep]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * (height - 16) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(14,28,18,0.62)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 8,
            height: 3,
            backgroundColor: '#7ff0a8',
          },
          lineStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.25)',
            borderTopColor: '#7ff0a8',
            borderRightColor: '#e8c66a',
          },
          ringStyle,
        ]}
      />
      <Animated.View style={pulseStyle}>
        <Column gap={1} className="items-center" style={{ marginTop: 12 }}>
          <PoppinsText color="white" weight="bold" style={{ fontSize: 14 }}>
            {status}
          </PoppinsText>
          <PoppinsText color="white" style={{ fontSize: 11, opacity: 0.8 }}>
            {subtitle}
          </PoppinsText>
        </Column>
      </Animated.View>
      <View />
    </Animated.View>
  );
};

export default ScanningOverlay;
