import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import type { LatLng } from '../../../../types/fairride';

interface MapPlaceholderProps {
  center?: LatLng;
  driverLocation?: LatLng;
  pickupLocation?: LatLng;
  dropoffLocation?: LatLng;
  className?: string;
}

const PulsingPin = () => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.7, 2.6]) }],
    opacity: interpolate(pulse.value, [0, 0.7, 1], [0.5, 0.08, 0]),
  }));

  return (
    <View className="h-12 w-12 items-center justify-center">
      <Animated.View
        className="bg-primary-accent absolute h-12 w-12 rounded-full"
        style={ringStyle}
      />
      <View className="bg-primary-accent h-12 w-12 items-center justify-center rounded-full">
        <PoppinsText color="white" weight="bold">
          MAP
        </PoppinsText>
      </View>
    </View>
  );
};

const MapPlaceholder = ({
  center,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  className = '',
}: MapPlaceholderProps) => {
  return (
    <View
      className={`border-border items-center justify-center overflow-hidden rounded-2xl border bg-[#e2e8e2] ${className}`}>
      <Column gap={2} className="items-center">
        <PulsingPin />
        <PoppinsText varient="subtext">Interactive map</PoppinsText>
        {center && (
          <PoppinsText varient="subtext">
            {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </PoppinsText>
        )}
        {pickupLocation && (
          <View className="mt-1 flex-row items-center gap-1">
            <View className="bg-primary-accent h-2 w-2 rounded-full" />
            <PoppinsText varient="subtext">Pickup</PoppinsText>
          </View>
        )}
        {dropoffLocation && (
          <View className="mt-1 flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-red-500" />
            <PoppinsText varient="subtext">Dropoff</PoppinsText>
          </View>
        )}
        {driverLocation && (
          <View className="mt-1 flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-blue-500" />
            <PoppinsText varient="subtext">Driver</PoppinsText>
          </View>
        )}
      </Column>
    </View>
  );
};

export default MapPlaceholder;
