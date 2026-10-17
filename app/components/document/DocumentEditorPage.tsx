import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, TouchableOpacity, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeOutLeft,
    Easing,
    FadeOutRight,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import Column from '../layout/Column';
import PoppinsText from '../ui/text/PoppinsText';
import StateAnimatedView from '../ui/StateAnimatedView';
import { useUserVariable } from 'hooks/useUserVariable';
import { MathDocument, MathDocumentPage } from 'types/mathDocuments';
import DocumentSidebar from './DocumentSidebar';
import DocumentEditor from './DocumentEditor';
import NewPageDialog from './NewPageDialog';
import FileDropZone from './FileDropZone';
import { useUserListGet } from 'hooks/useUserListGet';
import AppButton from '../ui/buttons/AppButton';
import { PagesButton } from '../ui/buttons/PagesButton';
import Row from '../layout/Row';

interface DocumentEditorPageProps {
    documentId: string;
    userId: string;
}

const DocumentEditorPage = ({ documentId, userId }: DocumentEditorPageProps) => {
    const [activePageId, setActivePageId] = useUserVariable<string>({
        key: "activePage",
        defaultValue: "",
        privacy: "PUBLIC"
    });

    const [showSidebar, setShowSidebar] = useState(false);
    const [dropFiles, setDropFiles] = useState<File[] | null>(null);
    const [dropDialogOpen, setDropDialogOpen] = useState(false);

    const handleDroppedFiles = (files: File[]) => {
        setDropFiles(files);
        setDropDialogOpen(true);
    };

    const renderDropDialog = () => (
        <NewPageDialog
            documentId={documentId}
            existingPageCount={pages.length}
            isOpen={dropDialogOpen}
            onOpenChange={(open) => {
                setDropDialogOpen(open);
                if (!open) setDropFiles(null);
            }}
            initialFiles={dropFiles}
            onCreate={(pageId) => {
                setDropDialogOpen(false);
                setDropFiles(null);
                setActivePageId(pageId);
            }}
        />
    );

    const handleToggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const handleHideSidebar = () => {
        setShowSidebar(false);
    };

    const scopedUserIds = useMemo(() => (userId ? [userId] : ['__loading__']), [userId]);

    const pageRecords = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: documentId,
        userIds: scopedUserIds,
        returnTop: 100,
    });
    const pages = useMemo(() => pageRecords ?? [], [pageRecords]);

    // HERE

    // Auto-select first page when activePageId is not in current pages
    useEffect(() => {
        if (pages.length > 0 && activePageId.value) {
            // Check if current activePageId exists in the pages
            const activePageExists = pages.some(page => page.value.id === activePageId.value);

            if (!activePageExists && !scopedUserIds.includes('__loading__')) {
                // Select the first page (what would be clicked first in sidebar)
                const sortedPages = [...pages].sort((a, b) => a.value.pageNumber - b.value.pageNumber);
                const firstPage = sortedPages[0];
                if (firstPage) {
                    setActivePageId(firstPage.value.id);
                }
            }
        }
    }, [pages.length, pages, activePageId.value, setActivePageId, scopedUserIds]);

    if (pages.length == 0 && !scopedUserIds.includes('__loading__')) {
        return (
            <FileDropZone
                enabled={Platform.OS === 'web'}
                dropAnywhere
                className='flex-1'
                overlayLabel='Drop files to add pages'
                onFiles={handleDroppedFiles}
            >
            <Column className='flex-1 items-center justify-center px-6'>
                <Animated.View
                    entering={FadeInDown.duration(500).easing(Easing.inOut(Easing.ease))}
                >
                    <Column className='rounded-2xl border-2 border-border bg-inner-background p-6' gap={4} style={{ maxWidth: '400px' }}>
                        <Column gap={2}>
                            <PoppinsText weight='bold' className='text-xl'>No pages yet</PoppinsText>
                            <PoppinsText>Create the first page to convert handwritten notes to Markdown.</PoppinsText>
                        </Column>
                        <NewPageDialog documentId={documentId} existingPageCount={0} onCreate={setActivePageId} />
                    </Column>
                </Animated.View>
            </Column>
            {renderDropDialog()}
            </FileDropZone>
        );
    }

    return (
        <FileDropZone
            enabled={Platform.OS === 'web'}
            dropAnywhere
            className='flex-1'
            overlayLabel='Drop files to add pages'
            onFiles={handleDroppedFiles}
        >
        <View className='flex-1'>
            {/* This will be handled by DocumentEditor component */}

            <View className={'flex-1 flex-row '}>
                {/* Desktop layout - always visible sidebar */}
                <View className={'w-min hidden lg:flex'}>
                    <DocumentSidebar
                        documentId={documentId}
                        userId={userId}
                        activePageId={activePageId.value}
                        onSetActivePageId={setActivePageId}
                    />

                </View>

                {/* Mobile layout - sidebar overlay with hamburger button */}
                {showSidebar && (
                    <Animated.View
                        key="sidebar-overlay"
                        className="h-full w-full absolute top-0 left-0 z-10"
                        entering={FadeIn.duration(100)}
                        exiting={FadeOut.duration(100)}
                    >
                        <Pressable onPress={handleHideSidebar} className='h-full w-full absolute top-0 left-0  bg-black/25' />

                    </Animated.View>
                )}
                <View className='absolute left-0 top-0 h-full w-min z-20 lg:hidden'>
                    <StateAnimatedView.Container stateVar={showSidebar} className='absolute left-0 top-0 h-full w-min z-20 lg:hidden'>
                        <StateAnimatedView.Option
                            stateValue={true}
                            onValue={{ x: [-24, 0], opacity: [0, 1], duration: 100 }}
                            onNotValue={{ x: [0, -24], opacity: [1, 0], duration: 100 }}
                        >
                            <DocumentSidebar
                                documentId={documentId}
                                userId={userId}
                                activePageId={activePageId.value}
                                onSetActivePageId={setActivePageId}
                                onHideSidebar={handleHideSidebar}
                            />
                        </StateAnimatedView.Option>
                        <StateAnimatedView.Option
                            stateValue={false}
                            onValue={{ x: [-24, 0], opacity: [0, 1], duration: 100 }}
                            onNotValue={{ x: [0, -24], opacity: [1, 0], duration: 100 }}
                        >
                            <Row className='items-center' gap={0}>
                                <PagesButton onPress={handleToggleSidebar} />
                                <TouchableOpacity onPress={handleToggleSidebar} className='rounded-full bg-inner-background border-2 border-border py-1 px-2 -ml-2'>
                                    <PoppinsText color='black'>Page {pages.find(page => page.value.id === activePageId.value)?.value.pageNumber || 1}</PoppinsText>
                                </TouchableOpacity>
                            </Row>
                        </StateAnimatedView.Option>
                    </StateAnimatedView.Container>
                </View>

                <DocumentEditor
                    documentId={documentId}
                    userId={userId}
                    activePageId={activePageId.value}
                    onSetActivePageId={setActivePageId}
                />
            </View>
            {renderDropDialog()}

        </View >
        </FileDropZone>
    );
};

export default DocumentEditorPage;
