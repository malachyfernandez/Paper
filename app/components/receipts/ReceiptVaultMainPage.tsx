import React, { useState } from 'react';
import { View } from 'react-native';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';
import Row from '../layout/Row';
import { useUserVariable } from '../../../hooks/useUserVariable';
import { useSyncUserData } from '../../../hooks/useSyncUserData';
import StateAnimatedView from '../ui/StateAnimatedView';
import type { ReceiptUserData, ReceiptScreen } from '../../../types/receipts';

import GroupsPage from './screens/GroupsPage';
import GroupDetailPage from './screens/GroupDetailPage';
import AddReceiptPage from './screens/AddReceiptPage';
import ReceiptDetailPage from './screens/ReceiptDetailPage';
import InsightsPage from './screens/InsightsPage';
import SettingsPage from './screens/SettingsPage';

/**
 * ReceiptVault — receipt logging + currency conversion built on Paper's
 * userVariables system.
 *
 * - Profile + settings: useUserVariable (single values per user)
 * - Groups + receipts: useUserList / useUserListGet (collections per user)
 *
 * Every screen subscribes to its own data independently — nav state is the
 * only thing threaded through props, matching Paper's component-first model.
 */
const ReceiptVaultMainPage = () => {
  const [userData, setUserData] = useUserVariable<ReceiptUserData>({
    key: 'receipts_userData',
    defaultValue: {
      name: '',
      email: '',
      userId: '',
      createdAt: Date.now(),
    },
    privacy: 'PRIVATE',
    searchKeys: ['name'],
  });

  useSyncUserData(userData.value, setUserData);

  const [screen, setScreen] = useState<ReceiptScreen>('groups');
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [activeReceiptId, setActiveReceiptId] = useState<string>('');
  // When adding/editing, carry the receipt id we're editing ('' = new).
  const [editReceiptId, setEditReceiptId] = useState<string>('');

  const openGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setScreen('group_detail');
  };

  const openReceipt = (receiptId: string) => {
    setActiveReceiptId(receiptId);
    setScreen('receipt_detail');
  };

  const startAddReceipt = (groupId: string, receiptId = '') => {
    setActiveGroupId(groupId);
    setEditReceiptId(receiptId);
    setScreen('add_receipt');
  };

  return (
    <View className="flex-1">
      <TopNav screen={screen} onNavigate={setScreen} />
      <StateAnimatedView.Container stateVar={screen} className="flex-1">
        <StateAnimatedView.Option
          stateValue="groups"
          onValue={{ opacity: [0, 1], duration: 250 }}
          onNotValue={{ opacity: [1, 0], duration: 150 }}>
          <GroupsPage onOpenGroup={openGroup} onAddReceipt={(g) => startAddReceipt(g)} />
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="group_detail"
          onValue={{ opacity: [0, 1], x: [40, 0], duration: 250 }}
          onNotValue={{ opacity: [1, 0], x: [0, -40], duration: 150 }}>
          <GroupDetailPage
            groupId={activeGroupId}
            onBack={() => setScreen('groups')}
            onOpenReceipt={openReceipt}
            onAddReceipt={() => startAddReceipt(activeGroupId)}
          />
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="add_receipt"
          onValue={{ opacity: [0, 1], y: [40, 0], duration: 250 }}
          onNotValue={{ opacity: [1, 0], y: [0, 40], duration: 150 }}>
          <AddReceiptPage
            groupId={activeGroupId}
            editReceiptId={editReceiptId}
            onDone={() => setScreen(activeGroupId ? 'group_detail' : 'groups')}
          />
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="receipt_detail"
          onValue={{ opacity: [0, 1], duration: 250 }}
          onNotValue={{ opacity: [1, 0], duration: 150 }}>
          <ReceiptDetailPage
            receiptId={activeReceiptId}
            onBack={() => setScreen('group_detail')}
            onEdit={(gid, rid) => startAddReceipt(gid, rid)}
          />
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="insights"
          onValue={{ opacity: [0, 1], duration: 250 }}
          onNotValue={{ opacity: [1, 0], duration: 150 }}>
          <InsightsPage onOpenGroup={openGroup} />
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="settings"
          onValue={{ opacity: [0, 1], duration: 250 }}
          onNotValue={{ opacity: [1, 0], duration: 150 }}>
          <SettingsPage />
        </StateAnimatedView.Option>
      </StateAnimatedView.Container>
    </View>
  );
};

const TopNav = ({
  screen,
  onNavigate,
}: {
  screen: ReceiptScreen;
  onNavigate: (s: ReceiptScreen) => void;
}) => (
  <View className="border-border bg-inner-background border-b-2 px-4 pb-1 pt-2">
    <Row gap={0} className="w-full items-center justify-between">
      <Row gap={1} className="items-center">
        <View className="bg-primary-accent h-8 w-8 items-center justify-center rounded-full">
          <PoppinsText color="white" weight="bold" style={{ fontSize: 12 }}>
            🧾
          </PoppinsText>
        </View>
      </Row>
      <Row gap={1}>
        <NavTab
          label="Groups"
          active={screen === 'groups' || screen === 'group_detail'}
          onPress={() => onNavigate('groups')}
        />
        <NavTab
          label="Insights"
          active={screen === 'insights'}
          onPress={() => onNavigate('insights')}
        />
        <NavTab
          label="Settings"
          active={screen === 'settings'}
          onPress={() => onNavigate('settings')}
        />
      </Row>
    </Row>
  </View>
);

const NavTab = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <AppButton
    variant="none"
    className={`h-8 px-3 ${active ? 'border-primary-accent border-b-2' : ''}`}
    onPress={onPress}>
    <PoppinsText
      weight={active ? 'medium' : 'regular'}
      style={{ fontSize: 12, opacity: active ? 1 : 0.6 }}>
      {label}
    </PoppinsText>
  </AppButton>
);

export default ReceiptVaultMainPage;
