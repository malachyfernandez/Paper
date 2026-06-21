import React from 'react';
import { View } from 'react-native';
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

const MapPlaceholder = ({
  center,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  className = '',
}: MapPlaceholderProps) => {
  return (
    <View
      className={`border-border items-center justify-center rounded border-2 bg-[#e8e0d0] ${className}`}>
      <Column gap={2} className="items-center">
        <View className="bg-primary-accent h-12 w-12 items-center justify-center rounded-full">
          <PoppinsText color="white" weight="bold">
            MAP
          </PoppinsText>
        </View>
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
