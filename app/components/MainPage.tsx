import React, { PropsWithChildren, useState } from 'react';
import { View } from 'react-native';
import PoppinsText from './ui/text/PoppinsText';
import AppButton from './ui/buttons/AppButton';
import Row from './layout/Row';
import { useUserVariable } from 'hooks/useUserVariable';
import { useSyncUserData } from 'hooks/useSyncUserData';
import { UserData } from 'types/mathDocuments';
import TopSiteBar from './layout/TopSiteBar';
import DocumentHomePage from './document/DocumentHomePage';
import DocumentEditorPage from './document/DocumentEditorPage';
import LayoutStateAnimatedView from './ui/LayoutStateAnimatedView';
import FairRideMainPage from './fairride/FairRideMainPage';

type AppMode = 'paper' | 'fairride';
type ScreenState = 'documents' | 'document';

interface MainPageProps extends PropsWithChildren {
  className?: string;
}

const MainPage: React.FC<MainPageProps> = () => {
  const [userData, setUserData] = useUserVariable<UserData>({
    key: 'userData',
    defaultValue: { name: '', email: '', userId: '' },
    privacy: 'PUBLIC',
    searchKeys: ['name'],
  });

  useSyncUserData(userData.value, setUserData);

  const userId = userData.value.userId || '';

  const [activeDocumentId, setActiveDocumentId] = useUserVariable<string>({
    key: 'activeDocumentId',
    defaultValue: '',
  });

  const [appMode, setAppMode] = useState<AppMode>('paper');

  const isInDocument = activeDocumentId.value !== '';
  const currentScreen: ScreenState = isInDocument ? 'document' : 'documents';

  const isActiveDocumentLoading = activeDocumentId.state.isSyncing === true;

  if (appMode === 'fairride') {
    return (
      <View className="p-safe bg-background h-screen w-screen">
        <View className="border-border bg-inner-background border-b-2 px-4 py-1">
          <Row gap={2} className="items-center justify-between">
            <AppButton variant="outline" className="h-8 px-3" onPress={() => setAppMode('paper')}>
              <PoppinsText style={{ fontSize: 12 }}>← Paper</PoppinsText>
            </AppButton>
            <PoppinsText weight="bold">FairRide</PoppinsText>
            <View className="w-16" />
          </Row>
        </View>
        <FairRideMainPage />
      </View>
    );
  }

  return (
    <View className="p-safe h-screen w-screen">
      <TopSiteBar
        isInDocument={isInDocument}
        onHomePress={() => setActiveDocumentId('')}
        documentId={activeDocumentId.value}
        userId={userId}
      />
      {isActiveDocumentLoading ? (
        <View className="flex-1 items-center justify-center">
          <PoppinsText>Loading...</PoppinsText>
        </View>
      ) : (
        <LayoutStateAnimatedView.Container stateVar={currentScreen} className="flex-1">
          <LayoutStateAnimatedView.Option page={1} stateValue="documents">
            <View className="h-full w-full items-center justify-center">
              <View className="h-full w-full">
                <DocumentHomePage userId={userId} setActiveDocumentId={setActiveDocumentId} />
                <View className="absolute bottom-4 right-4">
                  <AppButton
                    variant="green"
                    className="h-12 rounded-full px-4"
                    onPress={() => setAppMode('fairride')}>
                    <PoppinsText color="white" weight="bold">
                      FairRide →
                    </PoppinsText>
                  </AppButton>
                </View>
              </View>
            </View>
          </LayoutStateAnimatedView.Option>

          <LayoutStateAnimatedView.OptionContainer page={2}>
            <LayoutStateAnimatedView.Option stateValue="document">
              {activeDocumentId.value ? (
                <View className="h-full w-full">
                  <DocumentEditorPage documentId={activeDocumentId.value} userId={userId} />
                </View>
              ) : null}
            </LayoutStateAnimatedView.Option>
          </LayoutStateAnimatedView.OptionContainer>
        </LayoutStateAnimatedView.Container>
      )}
    </View>
  );
};

export default MainPage;
