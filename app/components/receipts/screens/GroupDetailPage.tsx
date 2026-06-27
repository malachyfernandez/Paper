import React from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import ReceiptCard from '../shared/ReceiptCard';
import StatTile from '../shared/StatTile';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import { convertToHome } from '../../../../utils/currencyConversion';
import {
  ReceiptGroup,
  Receipt,
  ReceiptSettings,
  DEFAULT_SETTINGS,
  CATEGORY_LABELS,
} from '../../../../types/receipts';

interface GroupDetailPageProps {
  groupId: string;
  onBack: () => void;
  onOpenReceipt: (receiptId: string) => void;
  onAddReceipt: () => void;
}

const GroupDetailPage = ({
  groupId,
  onBack,
  onOpenReceipt,
  onAddReceipt,
}: GroupDetailPageProps) => {
  const [settings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const groupsRaw = useUserListGet<ReceiptGroup>({ key: 'receipt_groups', itemId: groupId });
  const receiptsRaw = useUserListGet<Receipt>({
    key: 'receipt_items',
    filterFor: groupId,
    returnTop: 1000,
  });

  const group = groupsRaw && groupsRaw.length > 0 ? groupsRaw[0].value : undefined;
  const receipts = receiptsRaw
    ? receiptsRaw.map((r) => r.value).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;

  const total = receipts.reduce(
    (sum, r) => sum + convertToHome(r.amount, r.currency, home, rates),
    0
  );

  const byCategory: Record<string, number> = {};
  receipts.forEach((r) => {
    const homeAmt = convertToHome(r.amount, r.currency, home, rates);
    byCategory[r.category] = (byCategory[r.category] ?? 0) + homeAmt;
  });
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={onBack}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <Row gap={2} className="flex-1 items-center">
            <PoppinsText style={{ fontSize: 22 }}>{group ? group.emoji : '📁'}</PoppinsText>
            <Column gap={0} className="flex-1">
              <PoppinsText weight="bold" style={{ fontSize: 18 }}>
                {group ? group.name : 'Group'}
              </PoppinsText>
              {group && group.description.length > 0 && (
                <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                  {group.description}
                </PoppinsText>
              )}
            </Column>
          </Row>
        </Row>

        <Row gap={2} className="w-full">
          <StatTile label="Receipts" value={String(receipts.length)} />
          <StatTile
            label={`Total (${home})`}
            value={
              home === 'JPY' || home === 'KRW'
                ? Math.round(total).toLocaleString()
                : total.toFixed(2)
            }
          />
          <StatTile label="Default" value={group ? group.defaultCurrency : home} />
        </Row>

        {topCategories.length > 0 && (
          <View className="border-border bg-inner-background rounded border-2 p-3">
            <Column gap={2}>
              <PoppinsText weight="medium" style={{ fontSize: 13 }}>
                Spending by category
              </PoppinsText>
              {topCategories.slice(0, 4).map(([cat, amt]) => (
                <Row key={cat} gap={2} className="w-full items-center justify-between">
                  <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
                  </PoppinsText>
                  <PoppinsText weight="medium" style={{ fontSize: 12 }}>
                    {home === 'JPY' || home === 'KRW'
                      ? Math.round(amt).toLocaleString()
                      : amt.toFixed(2)}{' '}
                    {home}
                  </PoppinsText>
                </Row>
              ))}
            </Column>
          </View>
        )}

        <AppButton variant="green" className="h-12" onPress={onAddReceipt}>
          <PoppinsText color="white" weight="bold">
            + Add Receipt
          </PoppinsText>
        </AppButton>

        {receipts.length === 0 ? (
          <View className="items-center py-10">
            <PoppinsText style={{ fontSize: 36 }}>🧾</PoppinsText>
            <PoppinsText varient="subtext" className="text-center">
              No receipts in this group yet.
            </PoppinsText>
          </View>
        ) : (
          <Column gap={2}>
            {receipts.map((r) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                homeCurrency={home}
                rates={rates}
                onPress={() => onOpenReceipt(r.id)}
              />
            ))}
          </Column>
        )}
      </Column>
    </ScrollView>
  );
};

export default GroupDetailPage;
