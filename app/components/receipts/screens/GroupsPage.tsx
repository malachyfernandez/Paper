import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import GroupCard from '../shared/GroupCard';
import StatTile from '../shared/StatTile';
import CurrencyPicker from '../shared/CurrencyPicker';
import MoneyText from '../shared/MoneyText';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import { useUserListSet } from '../../../../hooks/useUserListSet';
import { generateId } from '../../../../utils/generateId';
import { convertToHome } from '../../../../utils/currencyConversion';
import {
  ReceiptGroup,
  Receipt,
  ReceiptSettings,
  DEFAULT_SETTINGS,
  CurrencyCode,
} from '../../../../types/receipts';

interface GroupsPageProps {
  onOpenGroup: (groupId: string) => void;
  onAddReceipt: (groupId: string) => void;
}

const GROUP_COLORS = ['#2d5a2d', '#b91c1c', '#1d4ed8', '#a16207', '#7c3aed', '#0f766e'];
const GROUP_EMOJIS = ['🗾', '🏝️', '💼', '🏠', '🎒', '🍣', '🚗', '🎁'];

const GroupsPage = ({ onOpenGroup, onAddReceipt }: GroupsPageProps) => {
  const [settings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const groupsRaw = useUserListGet<ReceiptGroup>({ key: 'receipt_groups', returnTop: 100 });
  const receiptsRaw = useUserListGet<Receipt>({ key: 'receipt_items', returnTop: 1000 });
  const setGroup = useUserListSet<ReceiptGroup>();

  const groups = groupsRaw ? groupsRaw.map((g) => g.value) : [];
  const receipts = receiptsRaw ? receiptsRaw.map((r) => r.value) : [];

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;

  const totalByGroup = (groupId: string) =>
    receipts
      .filter((r) => r.groupId === groupId)
      .reduce((sum, r) => sum + convertToHome(r.amount, r.currency, home, rates), 0);

  const countByGroup = (groupId: string) => receipts.filter((r) => r.groupId === groupId).length;

  const grandTotal = receipts.reduce(
    (sum, r) => sum + convertToHome(r.amount, r.currency, home, rates),
    0
  );

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(home);

  const handleCreate = () => {
    if (name.trim().length === 0) return;

    const id = `grp_${generateId(8)}`;
    const idx = groups.length;
    const newGroup: ReceiptGroup = {
      id,
      name: name.trim(),
      description: description.trim(),
      defaultCurrency,
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
      emoji: GROUP_EMOJIS[idx % GROUP_EMOJIS.length],
      createdAt: Date.now(),
    };

    setGroup({
      key: 'receipt_groups',
      itemId: id,
      value: newGroup,
      privacy: 'PRIVATE',
      searchKeys: ['name', 'description'],
      sortKey: 'PROPERTY_LAST_MODIFIED',
    });

    setName('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Column gap={0}>
          <PoppinsText weight="bold" style={{ fontSize: 24 }}>
            ReceiptVault
          </PoppinsText>
          <PoppinsText varient="subtext">
            Snap receipts. Tag purposes. Convert currencies.
          </PoppinsText>
        </Column>

        <Row gap={2} className="w-full">
          <StatTile label="Groups" value={String(groups.length)} />
          <StatTile label="Receipts" value={String(receipts.length)} />
          <StatTile
            label={`Total (${home})`}
            value={
              home === 'JPY' || home === 'KRW'
                ? Math.round(grandTotal).toLocaleString()
                : grandTotal.toFixed(2)
            }
          />
        </Row>

        <Row gap={2} className="w-full items-center justify-between">
          <PoppinsText weight="bold" style={{ fontSize: 16 }}>
            Your Groups
          </PoppinsText>
          <AppButton variant="green" className="h-9 px-3" onPress={() => setShowCreate((v) => !v)}>
            <PoppinsText color="white" weight="medium" style={{ fontSize: 12 }}>
              {showCreate ? 'Cancel' : '+ New Group'}
            </PoppinsText>
          </AppButton>
        </Row>

        {showCreate && (
          <View className="border-border bg-inner-background rounded border-2 p-4">
            <Column gap={3}>
              <PoppinsText weight="medium">Create a group</PoppinsText>
              <PoppinsTextInput
                value={name}
                onChangeText={setName}
                placeholder="Group name (e.g. Japan 2026)"
                className="border-border border-2 bg-transparent px-3 py-2"
              />
              <PoppinsTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                className="border-border border-2 bg-transparent px-3 py-2"
              />
              <Column gap={1}>
                <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                  Default currency for this group
                </PoppinsText>
                <CurrencyPicker selected={defaultCurrency} onSelect={setDefaultCurrency} />
              </Column>
              <AppButton variant="green" onPress={handleCreate}>
                <PoppinsText color="white" weight="medium">
                  Create Group
                </PoppinsText>
              </AppButton>
            </Column>
          </View>
        )}

        {groups.length === 0 ? (
          <View className="items-center py-10">
            <PoppinsText style={{ fontSize: 36 }}>📁</PoppinsText>
            <PoppinsText varient="subtext" className="text-center">
              No groups yet. Create one to start logging receipts.
            </PoppinsText>
          </View>
        ) : (
          <Column gap={2}>
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                receiptCount={countByGroup(group.id)}
                totalHome={totalByGroup(group.id)}
                homeCurrency={home}
                onPress={() => onOpenGroup(group.id)}
              />
            ))}
          </Column>
        )}

        {groups.length > 0 && (
          <View className="bg-primary-accent/10 rounded p-3">
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText weight="medium" style={{ fontSize: 13 }}>
                All receipts converted to {home}
              </PoppinsText>
              <MoneyText amount={grandTotal} currency={home} weight="bold" size={16} />
            </Row>
          </View>
        )}
      </Column>
    </ScrollView>
  );
};

export default GroupsPage;
