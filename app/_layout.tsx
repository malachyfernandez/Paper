import '../polyfills';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Slot } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { tokenCache } from '../utils/tokenCache';
import convex from '../utils/convexClient';
import { ToastProvider } from '../contexts/ToastContext';
import { WebDropdownProvider } from '../contexts/WebDropdownProvider';
import { AppAuthProvider } from '../contexts/AppAuthContext';
import '../global.css';
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <HeroUINativeProvider
          config={{
            devInfo: {
              stylingPrinciples: false,
            },
          }}>
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
              <WebDropdownProvider>
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                  <AppAuthProvider>
                    <Slot />
                    <PortalHost />
                  </AppAuthProvider>
                </ConvexProviderWithClerk>
              </WebDropdownProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </HeroUINativeProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
