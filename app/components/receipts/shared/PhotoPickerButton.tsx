import React from 'react';
import { Image, TouchableOpacity, View, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import { ReceiptImage } from '../../../../types/receipts';

interface PhotoPickerButtonProps {
  image?: ReceiptImage;
  onPicked: (image: ReceiptImage) => void;
  height?: number;
}

/**
 * Lets the user attach a receipt photo from their library or camera.
 * On web, expo-image-picker returns a data/blob URI we can render directly.
 */
const PhotoPickerButton = ({ image, onPicked, height = 180 }: PhotoPickerButtonProps) => {
  const pick = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    onPicked({ url: asset.uri, width: asset.width, height: asset.height });
  };

  return (
    <TouchableOpacity onPress={pick} activeOpacity={0.85}>
      {image && image.url ? (
        <View>
          <Image
            source={{ uri: image.url }}
            style={{ width: '100%', height, borderRadius: 8 }}
            resizeMode="cover"
          />
          <View className="bg-text/70 absolute bottom-2 right-2 rounded px-2 py-1">
            <PoppinsText color="white" style={{ fontSize: 11 }}>
              Tap to change
            </PoppinsText>
          </View>
        </View>
      ) : (
        <View
          style={{ height }}
          className="border-primary-accent bg-primary-accent/5 items-center justify-center rounded border-2 border-dashed">
          <Column gap={1} className="items-center">
            <PoppinsText style={{ fontSize: 32 }}>📷</PoppinsText>
            <PoppinsText weight="medium">Add receipt photo</PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              Tap to pick from your library
            </PoppinsText>
          </Column>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PhotoPickerButton;
