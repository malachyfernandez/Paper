import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import PhotoPickerButton from '../shared/PhotoPickerButton';
import CurrencyPicker from '../shared/CurrencyPicker';
import CategoryPill from '../shared/CategoryPill';
import ScanningOverlay from '../shared/ScanningOverlay';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useUserListGet } from '../../../../hooks/useUserListGet';
import { useUserListSet } from '../../../../hooks/useUserListSet';
import { useToast } from '../../../../contexts/ToastContext';
import { generateId } from '../../../../utils/generateId';
import { convertToHome, formatMoney } from '../../../../utils/currencyConversion';
import { scanReceiptWithAI, imageUriToDataUrl, OpenRouterError } from '../services/openRouterAI';
import {
  Receipt,
  ReceiptImage,
  ReceiptGroup,
  ReceiptSettings,
  ReceiptScanResult,
  DEFAULT_SETTINGS,
  DEFAULT_AI_MODEL,
  ReceiptCategory,
  ALL_CATEGORIES,
  COMMON_CURRENCIES,
  CurrencyCode,
} from '../../../../types/receipts';

interface AddReceiptPageProps {
  groupId: string;
  editReceiptId: string;
  onDone: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const AddReceiptPage = ({ groupId, editReceiptId, onDone }: AddReceiptPageProps) => {
  const [settings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const groupsRaw = useUserListGet<ReceiptGroup>({ key: 'receipt_groups', itemId: groupId });
  const group = groupsRaw && groupsRaw.length > 0 ? groupsRaw[0].value : undefined;

  const editRaw = useUserListGet<Receipt>({
    key: 'receipt_items',
    itemId: editReceiptId || 'none',
  });
  const editing = editReceiptId && editRaw && editRaw.length > 0 ? editRaw[0].value : undefined;

  const setReceipt = useUserListSet<Receipt>();

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;
  const initialCurrency = group ? group.defaultCurrency : home;

  const { showToast } = useToast();

  const [image, setImage] = useState<ReceiptImage | undefined>(editing?.image);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [merchant, setMerchant] = useState(editing?.merchant ?? '');
  const [purpose, setPurpose] = useState(editing?.purpose ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [currency, setCurrency] = useState<CurrencyCode>(editing?.currency ?? initialCurrency);
  const [category, setCategory] = useState<ReceiptCategory>(editing?.category ?? 'food');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [purchaseDate, setPurchaseDate] = useState(editing?.purchaseDate ?? todayIso());

  const numericAmount = parseFloat(amount) || 0;
  const homeAmount = convertToHome(numericAmount, currency, home, rates);
  const showConversion = currency !== home && numericAmount > 0;

  const canSave = merchant.trim().length > 0 && numericAmount > 0;

  const apiKey = settings.value.openRouterKey ?? '';
  const model = settings.value.aiModel || DEFAULT_AI_MODEL;

  const handlePicked = (img: ReceiptImage, dataUrl?: string) => {
    setImage(img);
    setImageDataUrl(dataUrl ?? img.url);
  };

  const applyScan = (result: ReceiptScanResult) => {
    if (result.merchant) setMerchant(result.merchant);
    if (result.purpose) setPurpose(result.purpose);
    if (result.amount != null) setAmount(String(result.amount));
    if (result.currency && COMMON_CURRENCIES.some((c) => c.code === result.currency)) {
      setCurrency(result.currency);
    }
    if (result.category) setCategory(result.category);
    if (result.purchaseDate) setPurchaseDate(result.purchaseDate);
    if (result.notes) setNotes(result.notes);
  };

  const handleScan = async () => {
    if (!image) {
      showToast('Add a photo first.');
      return;
    }
    if (!apiKey) {
      showToast('Add an OpenRouter key in Settings to scan receipts.');
      return;
    }
    const source = imageDataUrl ?? image.url;
    setScanning(true);
    setScanStatus('Reading receipt');
    try {
      const dataUrl = await imageUriToDataUrl(source);
      setScanStatus('Extracting fields');
      const result = await scanReceiptWithAI(dataUrl, apiKey, model);
      applyScan(result);
      showToast('Autofilled by AI ✨');
    } catch (err) {
      const msg = err instanceof OpenRouterError ? err.message : 'AI scan failed.';
      showToast(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    if (!canSave) return;

    const id = editing ? editing.id : `rcp_${generateId(10)}`;
    const now = Date.now();

    const receipt: Receipt = {
      id,
      groupId,
      merchant: merchant.trim(),
      purpose: purpose.trim(),
      category,
      amount: numericAmount,
      currency,
      homeAmount: Math.round(homeAmount * 100) / 100,
      image,
      notes: notes.trim(),
      purchaseDate,
      createdAt: editing ? editing.createdAt : now,
      updatedAt: now,
    };

    setReceipt({
      key: 'receipt_items',
      itemId: id,
      value: receipt,
      privacy: 'PRIVATE',
      filterKey: 'groupId',
      searchKeys: ['merchant', 'purpose', 'notes'],
      sortKey: 'PROPERTY_LAST_MODIFIED',
    });

    onDone();
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={onDone}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 18 }}>
            {editing ? 'Edit Receipt' : 'Add Receipt'}
          </PoppinsText>
        </Row>

        <View>
          <PhotoPickerButton image={image} onPicked={handlePicked} />
          {scanning && (
            <ScanningOverlay
              height={180}
              status={scanStatus}
              subtitle="via OpenRouter · on-device"
            />
          )}
        </View>

        <Row gap={2} className="w-full items-center">
          <AppButton
            variant={image && !scanning ? 'green' : 'grey'}
            className="h-11 flex-1"
            onPress={handleScan}
            disabled={!image || scanning}>
            <PoppinsText color="white" weight="bold">
              {scanning ? 'Scanning…' : '✨ Scan with AI'}
            </PoppinsText>
          </AppButton>
        </Row>
        <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
          {apiKey
            ? 'Using your OpenRouter key — the request runs in your browser.'
            : 'Add an OpenRouter key in Settings to enable AI scanning.'}
        </PoppinsText>

        <Column gap={1}>
          <PoppinsText weight="medium" style={{ fontSize: 13 }}>
            Merchant
          </PoppinsText>
          <PoppinsTextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Ichiran Ramen"
            className="border-border border-2 bg-transparent px-3 py-2"
          />
        </Column>

        <Column gap={1}>
          <PoppinsText weight="medium" style={{ fontSize: 13 }}>
            Purpose
          </PoppinsText>
          <PoppinsTextInput
            value={purpose}
            onChangeText={setPurpose}
            placeholder="What was this for? e.g. Team dinner"
            className="border-border border-2 bg-transparent px-3 py-2"
          />
        </Column>

        <Row gap={2} className="w-full">
          <Column gap={1} className="flex-1">
            <PoppinsText weight="medium" style={{ fontSize: 13 }}>
              Amount
            </PoppinsText>
            <PoppinsTextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="border-border border-2 bg-transparent px-3 py-2"
            />
          </Column>
          <Column gap={1} className="flex-1">
            <PoppinsText weight="medium" style={{ fontSize: 13 }}>
              Purchase date
            </PoppinsText>
            <PoppinsTextInput
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              className="border-border border-2 bg-transparent px-3 py-2"
            />
          </Column>
        </Row>

        <Column gap={1}>
          <PoppinsText weight="medium" style={{ fontSize: 13 }}>
            Currency
          </PoppinsText>
          <CurrencyPicker selected={currency} onSelect={setCurrency} />
        </Column>

        {showConversion && (
          <View className="bg-primary-accent/10 rounded p-3">
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText style={{ fontSize: 13 }}>
                {formatMoney(numericAmount, currency)} converts to
              </PoppinsText>
              <PoppinsText weight="bold">{formatMoney(homeAmount, home)}</PoppinsText>
            </Row>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              Rate: 1 {home} = {rates[currency] ?? 1} {currency}
            </PoppinsText>
          </View>
        )}

        <Column gap={2}>
          <PoppinsText weight="medium" style={{ fontSize: 13 }}>
            Category
          </PoppinsText>
          <View className="flex-row flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                category={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>
        </Column>

        <Column gap={1}>
          <PoppinsText weight="medium" style={{ fontSize: 13 }}>
            Notes
          </PoppinsText>
          <PoppinsTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            autoGrow
            className="border-border border-2 bg-transparent px-3 py-2"
          />
        </Column>

        <AppButton
          variant={canSave ? 'green' : 'grey'}
          className="h-12"
          onPress={handleSave}
          disabled={!canSave}>
          <PoppinsText color="white" weight="bold">
            {editing ? 'Save Changes' : 'Save Receipt'}
          </PoppinsText>
        </AppButton>
      </Column>
    </ScrollView>
  );
};

export default AddReceiptPage;
