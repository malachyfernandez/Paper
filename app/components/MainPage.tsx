import React from 'react';
import { View } from 'react-native';
import PoppinsText from './ui/text/PoppinsText';
import Column from './layout/Column';
import { useUserVariable } from 'hooks/useUserVariable';
import { useSyncUserData } from 'hooks/useSyncUserData';
import { UserData } from 'types/userData';
import ProfileHeader from './example/ProfileHeader';
import AddNoteInput from './example/AddNoteInput';
import NotesList from './example/NotesList';

/**
 * Baseline home screen.
 *
 * This is intentionally a tiny demo of the userVariables system — a profile
 * header (single value) plus a notes list (per-user collection). Each child
 * subscribes to its own userVariable directly rather than receiving data via
 * props, which is the core pattern of this codebase. Replace this screen with
 * your app; the systems (auth, Convex, userVariables, UI kit, animations) are
 * already wired up. See GETTING-STARTED.md.
 */
const MainPage = () => {
  const [userData, setUserData] = useUserVariable<UserData>({
    key: 'userData',
    defaultValue: { name: '', email: '', userId: '' },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  useSyncUserData(userData.value, setUserData);

  const userId = userData.value.userId || '';

  return (
    <View className="p-safe bg-background h-screen w-screen">
      <Column gap={4} className="mx-auto w-full max-w-2xl flex-1 p-5">
        <ProfileHeader />

        <Column gap={1}>
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            Your notes
          </PoppinsText>
          <PoppinsText varient="subtext">
            A live demo of the userVariables system. Everything you type is saved per-user and
            synced in real time.
          </PoppinsText>
        </Column>

        <AddNoteInput userId={userId} />
        <NotesList userId={userId} />
      </Column>
    </View>
  );
};

export default MainPage;
