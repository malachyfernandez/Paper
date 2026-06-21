import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PoppinsText from '../../ui/text/PoppinsText';
import AppButton from '../../ui/buttons/AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
import PaymentMethodCard from '../shared/PaymentMethodCard';
import PoppinsTextInput from '../../ui/forms/PoppinsTextInput';
import { useUserVariable } from '../../../../hooks/useUserVariable';
import { useToast } from '../../../../contexts/ToastContext';
import { generateId } from '../../../../utils/generateId';
import type { PaymentMethod, RiderScreen } from '../../../../types/fairride';

interface RiderPaymentPageProps {
  onNavigate: (screen: RiderScreen) => void;
}

const RiderPaymentPage = ({ onNavigate }: RiderPaymentPageProps) => {
  const [paymentMethods, setPaymentMethods] = useUserVariable<PaymentMethod[]>({
    key: 'fairride_paymentMethods',
    defaultValue: [
      {
        id: 'pm_demo_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: true,
      },
    ],
  });

  const { showToast } = useToast();
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const methods = paymentMethods.value;
  const activeSelectedId = selectedId ?? methods.find((m) => m.isDefault)?.id ?? null;

  const handleAddCard = () => {
    if (cardNumber.length < 4) {
      showToast('Enter at least 4 digits');
      return;
    }

    const newMethod: PaymentMethod = {
      id: `pm_${generateId(8)}`,
      type: 'card',
      last4: cardNumber.slice(-4),
      brand: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
      isDefault: methods.length === 0,
    };

    setPaymentMethods([...methods, newMethod]);
    setCardNumber('');
    setShowAddCard(false);
    showToast('Payment method added');
  };

  const handleSetDefault = (id: string) => {
    const updated = methods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    setPaymentMethods(updated);
    showToast('Default payment updated');
  };

  const handleRemove = (id: string) => {
    const updated = methods.filter((m) => m.id !== id);
    if (updated.length > 0 && !updated.some((m) => m.isDefault)) {
      updated[0].isDefault = true;
    }
    setPaymentMethods(updated);
    showToast('Payment method removed');
  };

  return (
    <ScrollView className="flex-1">
      <Column gap={4} className="p-4">
        <Row gap={3} className="w-full items-center">
          <AppButton variant="outline" className="h-10 w-10 p-0" onPress={() => onNavigate('home')}>
            <PoppinsText>←</PoppinsText>
          </AppButton>
          <PoppinsText weight="bold" style={{ fontSize: 20 }}>
            Payment Methods
          </PoppinsText>
        </Row>

        {methods.length === 0 ? (
          <View className="items-center py-8">
            <PoppinsText varient="subtext">No payment methods added</PoppinsText>
          </View>
        ) : (
          <Column gap={2}>
            {methods.map((method) => (
              <Column key={method.id} gap={1}>
                <PaymentMethodCard
                  method={method}
                  isSelected={method.id === activeSelectedId}
                  onPress={() => setSelectedId(method.id)}
                />
                {method.id === activeSelectedId && (
                  <Row gap={2} className="pl-2">
                    {!method.isDefault && (
                      <AppButton
                        variant="outline"
                        className="h-8 flex-1"
                        onPress={() => handleSetDefault(method.id)}>
                        <PoppinsText style={{ fontSize: 12 }}>Set Default</PoppinsText>
                      </AppButton>
                    )}
                    <AppButton
                      variant="red"
                      className="h-8 flex-1"
                      onPress={() => handleRemove(method.id)}>
                      <PoppinsText color="red" style={{ fontSize: 12 }}>
                        Remove
                      </PoppinsText>
                    </AppButton>
                  </Row>
                )}
              </Column>
            ))}
          </Column>
        )}

        {showAddCard ? (
          <View className="border-border bg-inner-background rounded border-2 p-4">
            <Column gap={3}>
              <PoppinsText weight="medium">Add Payment Method</PoppinsText>
              <PoppinsTextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="Card number"
                className="border-border border-2 bg-transparent px-3 py-2"
              />
              <PoppinsText varient="subtext">
                Stripe integration placeholder — in production, this would use Stripe Elements for
                PCI-compliant card entry.
              </PoppinsText>
              <Row gap={2}>
                <AppButton
                  variant="outline"
                  className="flex-1"
                  onPress={() => setShowAddCard(false)}>
                  <PoppinsText>Cancel</PoppinsText>
                </AppButton>
                <AppButton variant="green" className="flex-1" onPress={handleAddCard}>
                  <PoppinsText color="white" weight="medium">
                    Add Card
                  </PoppinsText>
                </AppButton>
              </Row>
            </Column>
          </View>
        ) : (
          <AppButton variant="green" onPress={() => setShowAddCard(true)}>
            <PoppinsText color="white" weight="medium">
              Add Payment Method
            </PoppinsText>
          </AppButton>
        )}

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              Secure Payments
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              FairRide uses Stripe for secure payment processing. Your card details are never stored
              on our servers. All transactions are encrypted end-to-end.
            </PoppinsText>
          </Column>
        </View>
      </Column>
    </ScrollView>
  );
};

export default RiderPaymentPage;
