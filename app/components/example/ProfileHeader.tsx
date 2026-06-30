import React from 'react';
import { View } from 'react-native';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import Row from '../layout/Row';
import Column from '../layout/Column';
import { useUserVariable } from 'hooks/useUserVariable';
import { UserData } from 'types/userData';

/**
 * Subscribes to the shared `userData` variable independently (no props). Editing
 * the name writes straight back to the userVariable and syncs everywhere it is
 * read.
 */
const ProfileHeader = () => {
  const [userData, setUserData] = useUserVariable<UserData>({
    key: 'userData',
    defaultValue: { name: '', email: '', userId: '' },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  const initial = (userData.value.name || '?').charAt(0).toUpperCase();

  return (
    <Row gap={3} className="border-border bg-inner-background items-center rounded-2xl border p-4">
      <View className="bg-primary-accent h-12 w-12 items-center justify-center rounded-full">
        <PoppinsText color="white" weight="bold">
          {initial}
        </PoppinsText>
      </View>
      <Column gap={1} className="flex-1">
        <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
          Display name (stored in a userVariable)
        </PoppinsText>
        <PoppinsTextInput
          value={userData.value.name}
          onChangeText={(name) => setUserData({ ...userData.value, name })}
          placeholder="Your name"
          className="border-subtle-border border-b py-1"
        />
      </Column>
    </Row>
  );
};

export default ProfileHeader;
