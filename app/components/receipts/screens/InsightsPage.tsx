import React from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import StatTile from '../shared/StatTile';
import SpendBar from '../shared/SpendBar';
import MoneyText from '../shared/MoneyText';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import { convertToHome } from '../../../../utils/currencyConversion';
import {
  Receipt,
  ReceiptGroup,
  ReceiptSettings,
  DEFAULT_SETTINGS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ReceiptCategory,
} from '../../../../types/receipts';

interface InsightsPageProps {
  onOpenGroup: (groupId: string) => void;
}

const InsightsPage = ({ onOpenGroup }: InsightsPageProps) => {
  const [settings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const receiptsRaw = useUserListGet<Receipt>({ key: 'receipt_items', returnTop: 1000 });
  const groupsRaw = useUserListGet<ReceiptGroup>({ key: 'receipt_groups', returnTop: 100 });

  const receipts = receiptsRaw ? receiptsRaw.map((r) => r.value) : [];
  const groups = groupsRaw ? groupsRaw.map((g) => g.value) : [];

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;

  const total = receipts.reduce(
    (sum, r) => sum + convertToHome(r.amount, r.currency, home, rates),
    0
  );

  const byCategory: Record<string, number> = {};
  const byCurrency: Record<string, number> = {};
  const byGroup: Record<string, number> = {};

  receipts.forEach((r) => {
    const homeAmt = convertToHome(r.amount, r.currency, home, rates);
    byCategory[r.category] = (byCategory[r.category] ?? 0) + homeAmt;
    byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + homeAmt;
    byGroup[r.groupId] = (byGroup[r.groupId] ?? 0) + homeAmt;
  });

  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const sortedCurrencies = Object.entries(byCurrency).sort((a, b) => b[1] - a[1]);
  const sortedGroups = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);

  const maxCat = sortedCats.length > 0 ? sortedCats[0][1] : 0;
  const maxGroup = sortedGroups.length > 0 ? sortedGroups[0][1] : 0;

  const groupName = (id: string) => {
    const g = groups.find((x) => x.id === id);
    return g ? `${g.emoji} ${g.name}` : 'Unknown';
  };

  const avgPerReceipt = receipts.length > 0 ? total / receipts.length : 0;

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Column gap={0}>
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            Insights
          </PoppinsText>
          <PoppinsText varient="subtext">All amounts converted to {home}</PoppinsText>
        </Column>

        <Row gap={2} className="w-full">
          <StatTile
            label={`Total (${home})`}
            value={
              home === 'JPY' || home === 'KRW'
                ? Math.round(total).toLocaleString()
                : total.toFixed(2)
            }
          />
          <StatTile label="Receipts" value={String(receipts.length)} />
          <StatTile
            label="Avg/Receipt"
            value={
              home === 'JPY' || home === 'KRW'
                ? Math.round(avgPerReceipt).toLocaleString()
                : avgPerReceipt.toFixed(2)
            }
          />
        </Row>

        {receipts.length === 0 ? (
          <View className="items-center py-10">
            <PoppinsText style={{ fontSize: 36 }}>📊</PoppinsText>
            <PoppinsText varient="subtext" className="text-center">
              Add receipts to see spending insights.
            </PoppinsText>
          </View>
        ) : (
          <>
            <View className="border-border bg-inner-background rounded border-2 p-4">
              <Column gap={3}>
                <PoppinsText weight="bold" style={{ fontSize: 15 }}>
                  By Category
                </PoppinsText>
                {sortedCats.map(([cat, amt]) => (
                  <SpendBar
                    key={cat}
                    label={CATEGORY_LABELS[cat as ReceiptCategory] ?? cat}
                    icon={CATEGORY_ICONS[cat as ReceiptCategory]}
                    amount={amt}
                    max={maxCat}
                    homeCurrency={home}
                  />
                ))}
              </Column>
            </View>

            <View className="border-border bg-inner-background rounded border-2 p-4">
              <Column gap={3}>
                <PoppinsText weight="bold" style={{ fontSize: 15 }}>
                  By Group
                </PoppinsText>
                {sortedGroups.map(([gid, amt]) => (
                  <SpendBar
                    key={gid}
                    label={groupName(gid)}
                    amount={amt}
                    max={maxGroup}
                    homeCurrency={home}
                    color="#1d4ed8"
                  />
                ))}
              </Column>
            </View>

            <View className="border-border bg-inner-background rounded border-2 p-4">
              <Column gap={2}>
                <PoppinsText weight="bold" style={{ fontSize: 15 }}>
                  By Currency Spent
                </PoppinsText>
                {sortedCurrencies.map(([cur, amt]) => (
                  <Row key={cur} gap={2} className="w-full items-center justify-between">
                    <PoppinsText style={{ fontSize: 13 }}>{cur}</PoppinsText>
                    <MoneyText amount={amt} currency={home} weight="medium" size={13} />
                  </Row>
                ))}
              </Column>
            </View>
          </>
        )}
      </Column>
    </ScrollView>
  );
};

export default InsightsPage;
