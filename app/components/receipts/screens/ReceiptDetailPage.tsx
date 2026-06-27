import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import ReceiptImageView from '../shared/ReceiptImageView';
import CategoryPill from '../shared/CategoryPill';
import MoneyText from '../shared/MoneyText';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import { useUserListRemove } from '../../../../hooks/useUserListRemove';
import { convertToHome, formatMoney } from '../../../../utils/currencyConversion';
import { Receipt, ReceiptSettings, DEFAULT_SETTINGS } from '../../../../types/receipts';

interface ReceiptDetailPageProps {
  receiptId: string;
  onBack: () => void;
  onEdit: (groupId: string, receiptId: string) => void;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Row gap={2} className="w-full items-center justify-between">
    <PoppinsText varient="subtext" style={{ fontSize: 13 }}>
      {label}
    </PoppinsText>
    <PoppinsText weight="medium" style={{ fontSize: 13 }}>
      {value}
    </PoppinsText>
  </Row>
);

const ReceiptDetailPage = ({ receiptId, onBack, onEdit }: ReceiptDetailPageProps) => {
  const [settings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const raw = useUserListGet<Receipt>({ key: 'receipt_items', itemId: receiptId });
  const receipt = raw && raw.length > 0 ? raw[0].value : undefined;
  const removeReceipt = useUserListRemove();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;

  if (!receipt) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <PoppinsText varient="subtext">Receipt not found.</PoppinsText>
        <AppButton variant="outline" className="mt-4" onPress={onBack}>
          <PoppinsText>← Back</PoppinsText>
        </AppButton>
      </View>
    );
  }

  const homeAmount = convertToHome(receipt.amount, receipt.currency, home, rates);
  const isForeign = receipt.currency !== home;

  const handleDelete = () => {
    removeReceipt({ key: 'receipt_items', itemId: receipt.id });
    onBack();
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center justify-between">
          <Row gap={3} className="flex-1 items-center">
            <AppButton variant="outline" className="h-10 w-10 p-0" onPress={onBack}>
              <PoppinsText>←</PoppinsText>
            </AppButton>
            <PoppinsText weight="bold" style={{ fontSize: 18 }}>
              Receipt
            </PoppinsText>
          </Row>
          <AppButton
            variant="outline"
            className="h-9 px-3"
            onPress={() => onEdit(receipt.groupId, receipt.id)}>
            <PoppinsText style={{ fontSize: 12 }}>Edit</PoppinsText>
          </AppButton>
        </Row>

        <ReceiptImageView image={receipt.image} height={220} />

        <Column gap={1} className="items-center">
          <PoppinsText weight="bold" style={{ fontSize: 22 }}>
            {receipt.merchant}
          </PoppinsText>
          <MoneyText amount={receipt.amount} currency={receipt.currency} weight="bold" size={28} />
          {isForeign && (
            <PoppinsText varient="subtext">
              ≈ {formatMoney(homeAmount, home)} ({home})
            </PoppinsText>
          )}
        </Column>

        <View className="items-center">
          <CategoryPill category={receipt.category} selected />
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <InfoRow label="Purpose" value={receipt.purpose || '—'} />
            <View className="bg-subtle-border h-px w-full" />
            <InfoRow label="Purchase date" value={receipt.purchaseDate} />
            <View className="bg-subtle-border h-px w-full" />
            <InfoRow
              label="Original amount"
              value={formatMoney(receipt.amount, receipt.currency)}
            />
            {isForeign && (
              <>
                <View className="bg-subtle-border h-px w-full" />
                <InfoRow label={`Converted (${home})`} value={formatMoney(homeAmount, home)} />
                <View className="bg-subtle-border h-px w-full" />
                <InfoRow
                  label="Exchange rate"
                  value={`1 ${home} = ${rates[receipt.currency] ?? 1} ${receipt.currency}`}
                />
              </>
            )}
          </Column>
        </View>

        {receipt.notes.length > 0 && (
          <View className="border-border bg-inner-background rounded border-2 p-4">
            <Column gap={1}>
              <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                Notes
              </PoppinsText>
              <PoppinsText>{receipt.notes}</PoppinsText>
            </Column>
          </View>
        )}

        {confirmDelete ? (
          <Row gap={2} className="w-full">
            <AppButton variant="outline" className="flex-1" onPress={() => setConfirmDelete(false)}>
              <PoppinsText>Cancel</PoppinsText>
            </AppButton>
            <AppButton variant="red" className="flex-1" onPress={handleDelete}>
              <PoppinsText color="red" weight="medium">
                Confirm Delete
              </PoppinsText>
            </AppButton>
          </Row>
        ) : (
          <AppButton variant="red" onPress={() => setConfirmDelete(true)}>
            <PoppinsText color="red" weight="medium">
              Delete Receipt
            </PoppinsText>
          </AppButton>
        )}
      </Column>
    </ScrollView>
  );
};

export default ReceiptDetailPage;
