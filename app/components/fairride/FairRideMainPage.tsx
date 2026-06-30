import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';
import Column from '../layout/Column';
import Row from '../layout/Row';
import { useUserVariable } from '../../../hooks/useUserVariable';
import { useSyncUserData } from '../../../hooks/useSyncUserData';
import StateAnimatedView from '../ui/StateAnimatedView';
import type {
  AppScreen,
  RiderScreen,
  DriverScreen,
  FairRideUserData,
} from '../../../types/fairride';

import RiderHomePage from './rider/RiderHomePage';
import RideRequestPage from './rider/RideRequestPage';
import RideTrackingPage from './rider/RideTrackingPage';
import RideCompletePage from './rider/RideCompletePage';
import RiderHistoryPage from './rider/RiderHistoryPage';
import RiderPaymentPage from './rider/RiderPaymentPage';
import RiderProfilePage from './rider/RiderProfilePage';

import DriverDashboardPage from './driver/DriverDashboardPage';
import RideOfferPage from './driver/RideOfferPage';
import ActiveRidePage from './driver/ActiveRidePage';
import DriverRideCompletePage from './driver/DriverRideCompletePage';
import DriverEarningsPage from './driver/DriverEarningsPage';
import DriverProfilePage from './driver/DriverProfilePage';

const FairRideMainPage = () => {
  const [userData, setUserData] = useUserVariable<FairRideUserData>({
    key: 'fairride_userData',
    defaultValue: {
      name: '',
      email: '',
      userId: '',
      phone: '',
      role: 'rider',
      createdAt: Date.now(),
    },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  useSyncUserData(userData.value, setUserData);

  const [appScreen, setAppScreen] = useState<AppScreen>('role_select');
  const [riderScreen, setRiderScreen] = useState<RiderScreen>('home');
  const [driverScreen, setDriverScreen] = useState<DriverScreen>('dashboard');

  const handleSelectRole = (role: 'rider' | 'driver') => {
    setAppScreen(role);
  };

  const handleRiderNavigate = (screen: RiderScreen) => {
    setRiderScreen(screen);
  };

  const handleDriverNavigate = (screen: DriverScreen) => {
    setDriverScreen(screen);
  };

  const renderRoleSelect = () => (
    <View className="flex-1 items-center justify-center">
      <Column gap={6} className="w-[80vw] max-w-96 items-center p-6">
        <Column gap={2} className="items-center">
          <View className="bg-primary-accent h-20 w-20 items-center justify-center rounded-full">
            <PoppinsText color="white" weight="bold" style={{ fontSize: 28 }}>
              FR
            </PoppinsText>
          </View>
          <PoppinsText weight="bold" style={{ fontSize: 28 }}>
            FairRide
          </PoppinsText>
          <PoppinsText varient="subtext" className="text-center">
            Ride-sharing that is fair for everyone
          </PoppinsText>
        </Column>

        <Column gap={3} className="w-full">
          <AppButton variant="green" className="h-16" onPress={() => handleSelectRole('rider')}>
            <Column gap={0} className="items-center">
              <PoppinsText color="white" weight="bold">
                I need a ride
              </PoppinsText>
              <PoppinsText color="white" style={{ fontSize: 11 }}>
                Affordable rides, transparent pricing
              </PoppinsText>
            </Column>
          </AppButton>

          <AppButton variant="black" className="h-16" onPress={() => handleSelectRole('driver')}>
            <Column gap={0} className="items-center">
              <PoppinsText color="white" weight="bold">
                I want to drive
              </PoppinsText>
              <PoppinsText color="white" style={{ fontSize: 11 }}>
                Keep 92% of every fare
              </PoppinsText>
            </Column>
          </AppButton>
        </Column>

        <View className="bg-primary-accent/10 rounded p-3">
          <Column gap={1}>
            <PoppinsText weight="medium" style={{ fontSize: 12 }}>
              Why FairRide?
            </PoppinsText>
            <PoppinsText varient="subtext" style={{ fontSize: 11 }}>
              Uber takes ~25% of every fare. We take 8%. That means lower prices for riders and
              higher pay for drivers. No surge pricing — demand adjustments capped at 1.3x.
            </PoppinsText>
          </Column>
        </View>
      </Column>
    </View>
  );

  const renderRiderScreen = () => {
    switch (riderScreen) {
      case 'home':
        return <RiderHomePage onNavigate={handleRiderNavigate} />;
      case 'ride_request':
        return <RideRequestPage onNavigate={handleRiderNavigate} />;
      case 'tracking':
        return <RideTrackingPage onNavigate={handleRiderNavigate} />;
      case 'ride_complete':
        return <RideCompletePage onNavigate={handleRiderNavigate} />;
      case 'history':
        return <RiderHistoryPage onNavigate={handleRiderNavigate} />;
      case 'payment':
        return <RiderPaymentPage onNavigate={handleRiderNavigate} />;
      case 'profile':
      case 'settings':
        return (
          <RiderProfilePage
            onNavigate={handleRiderNavigate}
            onSwitchToDriver={() => setAppScreen('driver')}
          />
        );
      default:
        return <RiderHomePage onNavigate={handleRiderNavigate} />;
    }
  };

  const renderDriverScreen = () => {
    switch (driverScreen) {
      case 'dashboard':
        return <DriverDashboardPage onNavigate={handleDriverNavigate} />;
      case 'ride_offer':
        return <RideOfferPage onNavigate={handleDriverNavigate} />;
      case 'active_ride':
        return <ActiveRidePage onNavigate={handleDriverNavigate} />;
      case 'ride_complete':
        return <DriverRideCompletePage onNavigate={handleDriverNavigate} />;
      case 'earnings':
        return <DriverEarningsPage onNavigate={handleDriverNavigate} />;
      case 'profile':
      case 'settings':
        return (
          <DriverProfilePage
            onNavigate={handleDriverNavigate}
            onSwitchToRider={() => setAppScreen('rider')}
          />
        );
      default:
        return <DriverDashboardPage onNavigate={handleDriverNavigate} />;
    }
  };

  return (
    <View className="flex-1">
      <StateAnimatedView.Container stateVar={appScreen} className="flex-1">
        <StateAnimatedView.Option
          stateValue="role_select"
          onValue={{ opacity: [0, 1], duration: 300 }}
          onNotValue={{ opacity: [1, 0], duration: 200 }}>
          {renderRoleSelect()}
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="rider"
          onValue={{ opacity: [0, 1], x: [50, 0], duration: 300 }}
          onNotValue={{ opacity: [1, 0], x: [0, -50], duration: 200 }}>
          <View className="flex-1">
            <RiderNavBar currentScreen={riderScreen} onNavigate={handleRiderNavigate} />
            <Animated.View key={riderScreen} entering={FadeIn.duration(260)} className="flex-1">
              {renderRiderScreen()}
            </Animated.View>
          </View>
        </StateAnimatedView.Option>

        <StateAnimatedView.Option
          stateValue="driver"
          onValue={{ opacity: [0, 1], x: [50, 0], duration: 300 }}
          onNotValue={{ opacity: [1, 0], x: [0, -50], duration: 200 }}>
          <View className="flex-1">
            <DriverNavBar currentScreen={driverScreen} onNavigate={handleDriverNavigate} />
            <Animated.View key={driverScreen} entering={FadeIn.duration(260)} className="flex-1">
              {renderDriverScreen()}
            </Animated.View>
          </View>
        </StateAnimatedView.Option>
      </StateAnimatedView.Container>
    </View>
  );
};

const RiderNavBar = ({
  currentScreen,
  onNavigate,
}: {
  currentScreen: RiderScreen;
  onNavigate: (s: RiderScreen) => void;
}) => (
  <View className="border-border bg-inner-background border-b-2 px-4 pb-1 pt-2">
    <Row gap={0} className="w-full items-center justify-between">
      <View className="bg-primary-accent h-8 w-8 items-center justify-center rounded-full">
        <PoppinsText color="white" weight="bold" style={{ fontSize: 10 }}>
          FR
        </PoppinsText>
      </View>
      <Row gap={1}>
        <NavTab label="Home" active={currentScreen === 'home'} onPress={() => onNavigate('home')} />
        <NavTab
          label="History"
          active={currentScreen === 'history'}
          onPress={() => onNavigate('history')}
        />
        <NavTab
          label="Payment"
          active={currentScreen === 'payment'}
          onPress={() => onNavigate('payment')}
        />
        <NavTab
          label="Profile"
          active={currentScreen === 'profile'}
          onPress={() => onNavigate('profile')}
        />
      </Row>
    </Row>
  </View>
);

const DriverNavBar = ({
  currentScreen,
  onNavigate,
}: {
  currentScreen: DriverScreen;
  onNavigate: (s: DriverScreen) => void;
}) => (
  <View className="border-border bg-inner-background border-b-2 px-4 pb-1 pt-2">
    <Row gap={0} className="w-full items-center justify-between">
      <View className="bg-text h-8 w-8 items-center justify-center rounded-full">
        <PoppinsText color="white" weight="bold" style={{ fontSize: 10 }}>
          FR
        </PoppinsText>
      </View>
      <Row gap={1}>
        <NavTab
          label="Dashboard"
          active={currentScreen === 'dashboard'}
          onPress={() => onNavigate('dashboard')}
        />
        <NavTab
          label="Earnings"
          active={currentScreen === 'earnings'}
          onPress={() => onNavigate('earnings')}
        />
        <NavTab
          label="Profile"
          active={currentScreen === 'profile'}
          onPress={() => onNavigate('profile')}
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

export default FairRideMainPage;
