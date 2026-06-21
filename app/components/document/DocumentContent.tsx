import React, { useState, useEffect } from 'react';
import { LayoutChangeEvent, Platform, View } from 'react-native';
import { Spinner } from 'heroui-native';
import Animated, {
    FadeInUp,
    FadeOutDown,
    FadeInDown,
    FadeOutUp,
} from 'react-native-reanimated';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';

import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MathDocumentPage } from 'types/mathDocuments';
import { useGeneration } from '../../../contexts/GenerationContext';
import { useToast } from '../../../contexts/ToastContext';
import { useUserListSet } from 'hooks/useUserListSet';
import { useCreateUndoSnapshot, useUndoRedo } from 'hooks/useUndoRedo';
import { useUserVariable } from 'hooks/useUserVariable';
import { generateId } from 'utils/generateId';
import DocumentHeader from './DocumentHeader';
import ContentEditor from './ContentEditor';
import ContentPreview from './ContentPreview';
import AiConversionPanel from './AiConversionPanel';

interface DocumentContentProps {
    documentTitle: string;
    documentId: string;
    activePage: MathDocumentPage;
    onReplacePage: (nextPage: MathDocumentPage, description: string) => void;
    onDeletePage: (pageId: string) => void;
    setPreviewMarkdown: (markdown: string) => void;
}

const DocumentContent = ({ documentTitle, documentId, activePage, onReplacePage, setPreviewMarkdown }: DocumentContentProps) => {
    const { executeCommand } = useUndoRedo();
    const createUndoSnapshot = useCreateUndoSnapshot();
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const { setGeneratingPage, isPageGenerating } = useGeneration();
    const { showToast } = useToast();
    const setDocument = useUserListSet();
    const setPage = useUserListSet<MathDocumentPage>();
    const [markdownDraft, setMarkdownDraft] = useState(activePage.markdown);
    const [activeTab, setActiveTab] = useState('preview');
    const [errorMessage, setErrorMessage] = useState('');
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);
    const [dotCount, setDotCount] = useState(1);

    const replacePageWithUndo = (nextPage: MathDocumentPage, description: string) => {
        const previousPage = createUndoSnapshot(activePage);
        const nextPageSnapshot = createUndoSnapshot(nextPage);

        executeCommand({
            action: () => onReplacePage(nextPage, description),
            undoAction: () => onReplacePage(previousPage, description),
            description: `${description} - ${activePage.title}`
        });
    };

    // Get user-wide AI guidance
    const [aiGuidance] = useUserVariable({
        key: 'aiGuidance',
        defaultValue: 'Convert this handwritten notes to Markdown with LaTeX support.',
        privacy: 'PRIVATE'
    });

    const isGenerating = isPageGenerating(activePage.id);

    const hasChanges = markdownDraft !== activePage.markdown;

    // Sync markdownDraft when activePage changes (e.g., after AI generation)
    useEffect(() => {
        setMarkdownDraft(activePage.markdown);
    }, [activePage.markdown, activePage.lastGeneratedAt]);

    // Animate dots during generation
    useEffect(() => {
        if (isGenerating) {
            const interval = setInterval(() => {
                setDotCount((prev) => (prev % 3) + 1);
            }, 500);
            return () => clearInterval(interval);
        } else {
            setDotCount(1);
        }
    }, [isGenerating]);

    // Monitor for generation completion and add follow-up
    useEffect(() => {
        // Check if generation just completed (was generating, now not generating)
        // and if we have a recent generation with markdown but no corresponding follow-up
        if (!isGenerating && activePage.lastGeneratedAt && activePage.markdown && activePage.lastAiPrompt) {
            // Look for a follow-up with the same generation timestamp
            const hasMatchingFollowUp = activePage.followUps.some(followUp => 
                followUp.prompt === activePage.lastAiPrompt &&
                followUp.resultingMarkdown === activePage.markdown &&
                Math.abs(followUp.createdAt - (activePage.lastGeneratedAt || 0)) < 5000 // Within 5 seconds
            );

            // If no matching follow-up exists, add one
            if (!hasMatchingFollowUp) {
                const updatedPage = {
                    ...activePage,
                    followUps: [
                        ...activePage.followUps,
                        {
                            id: generateId(),
                            prompt: activePage.lastAiPrompt,
                            createdAt: activePage.lastGeneratedAt || Date.now(),
                            resultingMarkdown: activePage.markdown,
                        }
                    ]
                };
                onReplacePage(updatedPage, 'Added initial generation follow-up');
            }
        }
    }, [isGenerating, activePage.markdown, activePage.lastGeneratedAt, activePage.lastAiPrompt, activePage.followUps]);

    const handleHeaderLayout = (event: LayoutChangeEvent) => {
        setHeaderHeight(event.nativeEvent.layout.height);
    };

    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    const handleInitialGeneration = async () => {
        // Capture the current page data at the start of generation
        const currentPage = activePage;

        if (!currentPage.imageUrl) {
            setErrorMessage('Add an image before asking the AI to convert the page.');
            return;
        }

        try {
            setGeneratingPage(currentPage.id, true);
            setErrorMessage('');

            const result = await convertMathImageToMarkdown({
                imageUrl: currentPage.imageUrl,
                guidance: aiGuidance.value,
                currentMarkdown: currentPage.markdown,
                followUpPrompt: undefined,
            });

            const nextPage = {
                ...currentPage,
                markdown: result.markdown,
                lastAiPrompt: aiGuidance.value,
                lastGeneratedAt: Date.now(),
            };

            replacePageWithUndo(nextPage, 'Generated page markdown from image');

            // Only update markdown draft if we're still on the same page
            if (activePage.id === currentPage.id) {
                setMarkdownDraft(result.markdown);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'AI conversion failed.');
        } finally {
            setGeneratingPage(currentPage.id, false);
        }
    };

    const handleSaveMarkdown = (markdown: string) => {
        const nextPage = {
            ...activePage,
            markdown,
        };
        replacePageWithUndo(nextPage, 'Updated page markdown');
        // Update the activePage reference to reflect saved state
        // This will be updated when the parent component re-renders with the new activePage
    };

    const handleTabChange = (newTab: string) => {
        // When switching from editor to preview, capture the current state for undo
        if (activeTab === 'editor' && newTab === 'preview' && hasChanges) {
            const currentPage = createUndoSnapshot(activePage);
            const updatedPage = {
                ...activePage,
                markdown: markdownDraft,
            };
            
            executeCommand({
                action: () => {
                    // Don't actually save to cloud, just track the state change
                    setMarkdownDraft(markdownDraft);
                },
                undoAction: () => {
                    // Restore the previous markdown draft
                    setMarkdownDraft(activePage.markdown);
                },
                description: `Edited content in editor tab - ${activePage.title}`
            });
        }
        
        setActiveTab(newTab);
    };

    const handleSetBlankPage = () => {
        handleSaveMarkdown('BLANK PAGE');
    };

    return (
        <View className='flex-1'>
            {activePage.markdown && !isGenerating ? (
                <>
                    {/* Sticky Header with Tabs */}
                    <DocumentHeader
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        hasChanges={hasChanges}
                        onSave={() => handleSaveMarkdown(markdownDraft)}
                        onLayout={handleHeaderLayout}
                    />

                    {/* Scrollable Content Section */}
                    {/* <ScrollView
                        className='h-full bg-accent-hover'
                    // style={{ paddingTop: 80, paddingBottom: 200 }}
                    > */}
                    {/* <View className='h-full bg-l'>
                            <PoppinsText className='text-lg'>No markdown yet</PoppinsText>
                        </View> */}
                    <View className='flex-1'>
                        <Column gap={4} className='flex-1'>
                            {activeTab === 'editor' && (
                                <View className='flex-1' style={{ minHeight: 0 }}>
                                    <Animated.View
                                        entering={FadeInDown.duration(300).springify()}
                                        exiting={FadeOutDown.duration(300).springify()}
                                        className='flex-1'
                                    >
                                        <View className='flex-1' style={{ minHeight: 0 }}>
                                            <ContentEditor
                                                markdown={markdownDraft}
                                                onChange={setMarkdownDraft}
                                                headerHeight={headerHeight}
                                                footerHeight={footerHeight}
                                            />
                                        </View>
                                    </Animated.View>
                                </View>
                            )}

                            {activeTab === 'preview' && (
                                <View className='flex-1' style={{ minHeight: 0 }}>
                                    <Animated.View
                                        entering={FadeInDown.duration(300).springify()}
                                        className='flex-1'
                                    >
                                        <View className='flex-1' style={{ minHeight: 0 }}>
                                            <ContentPreview markdown={markdownDraft} headerHeight={headerHeight} footerHeight={footerHeight} />
                                        </View>
                                    </Animated.View>
                                </View>
                            )}
                        </Column>
                    </View>



                    {/* Sticky AI Section */}
                    <AiConversionPanel
                        documentTitle={documentTitle}
                        page={activePage}
                        onUpdatePage={onReplacePage}
                        onUpdateMarkdown={setMarkdownDraft}
                        onLayout={handleFooterLayout}
                        setPreviewMarkdown={setPreviewMarkdown}
                    />
                </>
            ) : (
                /* Initial State - No markdown yet */
                <View className='flex-1 items-center justify-center p-8'>
                    <Column className='items-center gap-4' style={{ maxWidth: '700px' }}>
                        <PoppinsText weight='bold' className='text-xl text-center'>
                            {isGenerating ? `Converting${'.'.repeat(dotCount)}` : 'Convert to Markdown'}
                        </PoppinsText>
                        <PoppinsText varient='subtext' className='text-center'>
                            {isGenerating ? 'Keep this tab open, but you can navigate to other pages' : 'Click to generate Markdown from handwritten notes image.'}
                        </PoppinsText>
                        <AppButton
                            variant={isGenerating ? 'grey' : 'green'}
                            onPress={handleInitialGeneration}
                            className='h-12 w-48'
                            disabled={isGenerating}
                        >
                            <Row className='items-center' gap={2}>
                                {isGenerating && <Spinner size="sm" color="white" />}
                                <PoppinsText weight='medium' color='white'>
                                    Generate Markdown
                                </PoppinsText>
                            </Row>
                        </AppButton>
                        {!isGenerating && (
                            <AppButton
                                variant='outline-alt'
                                onPress={handleSetBlankPage}
                                className='h-12 w-40'
                            >
                                <PoppinsText weight='medium'>
                                    No Generation
                                </PoppinsText>
                            </AppButton>
                        )}

                        {errorMessage ? <PoppinsText className='text-red-500 text-center mt-2'>{errorMessage}</PoppinsText> : null}
                    </Column>
                </View>
            )}
        </View >
    );
};

export default DocumentContent;
