import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import CurrencyPicker from '../shared/CurrencyPicker';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import {
  ReceiptSettings,
  DEFAULT_SETTINGS,
  ReceiptUserData,
  COMMON_CURRENCIES,
  CurrencyCode,
} from '../../../../types/receipts';

const SettingsPage = () => {
  const [settings, setSettings] = useUserVariable<ReceiptSettings>({
    key: 'receipts_settings',
    defaultValue: DEFAULT_SETTINGS,
    privacy: 'PRIVATE',
  });

  const [userData] = useUserVariable<ReceiptUserData>({
    key: 'receipts_userData',
    defaultValue: { name: '', email: '', userId: '', createdAt: Date.now() },
    privacy: 'PRIVATE',
  });

  const home = settings.value.homeCurrency;
  const rates = settings.value.exchangeRates;

  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});

  const handleSetHome = (code: CurrencyCode) => {
    setSettings({ ...settings.value, homeCurrency: code });
  };

  const handleRateChange = (code: string, text: string) => {
    setRateDrafts((prev) => ({ ...prev, [code]: text }));
  };

  const commitRate = (code: string) => {
    const draft = rateDrafts[code];
    if (draft === undefined) return;
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed <= 0) return;

    setSettings({
      ...settings.value,
      exchangeRates: { ...rates, [code]: parsed },
      lastRatesUpdate: Date.now(),
    });
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <PoppinsText weight="bold" style={{ fontSize: 22 }}>
          Settings
        </PoppinsText>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <PoppinsText weight="bold" style={{ fontSize: 15 }}>
              Home Currency
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
              All totals are converted into this currency.
            </PoppinsText>
            <CurrencyPicker selected={home} onSelect={handleSetHome} />
          </Column>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={3}>
            <Column gap={0}>
              <PoppinsText weight="bold" style={{ fontSize: 15 }}>
                Exchange Rates
              </PoppinsText>
              <PoppinsText varient="subtext" style={{ fontSize: 12 }}>
                Units of each currency per 1 {home}. Tap a value to edit.
              </PoppinsText>
            </Column>

            {COMMON_CURRENCIES.filter((c) => c.code !== home).map((c) => (
              <Row key={c.code} gap={2} className="w-full items-center justify-between">
                <Row gap={2} className="items-center">
                  <PoppinsText weight="medium" style={{ fontSize: 13 }}>
                    1 {home} =
                  </PoppinsText>
                </Row>
                <Row gap={2} className="items-center">
                  <PoppinsTextInput
                    value={rateDrafts[c.code] ?? String(rates[c.code] ?? '')}
                    onChangeText={(t) => handleRateChange(c.code, t)}
                    onBlur={() => commitRate(c.code)}
                    onSubmitEditing={() => commitRate(c.code)}
                    keyboardType="decimal-pad"
                    className="border-border w-24 border-2 bg-transparent px-2 py-1 text-right"
                  />
                  <PoppinsText weight="medium" style={{ fontSize: 13, width: 40 }}>
                    {c.code}
                  </PoppinsText>
                </Row>
              </Row>
            ))}

            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              In production these auto-refresh from an FX API. Here you can set them manually so
              conversions stay accurate offline.
            </PoppinsText>
          </Column>
        </View>

        <View className="border-border bg-inner-background rounded border-2 p-4">
          <Column gap={2}>
            <PoppinsText weight="bold" style={{ fontSize: 15 }}>
              Account
            </PoppinsText>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext" style={{ fontSize: 13 }}>
                Name
              </PoppinsText>
              <PoppinsText weight="medium" style={{ fontSize: 13 }}>
                {userData.value.name || '—'}
              </PoppinsText>
            </Row>
            <Row gap={2} className="w-full items-center justify-between">
              <PoppinsText varient="subtext" style={{ fontSize: 13 }}>
                Data scope
              </PoppinsText>
              <PoppinsText weight="medium" style={{ fontSize: 13 }}>
                Private (per user)
              </PoppinsText>
            </Row>
          </Column>
        </View>

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              How your data is stored
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              Every group and receipt is saved per user via Paper&apos;s userVariables
              system (useUserList / useUserVariable), synced in real time and private to
              your account.
            </PoppinsText>
          </Column>
        </View>
      </Column>
    </ScrollView>
  );
};

export default SettingsPage;
