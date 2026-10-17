import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Spinner } from 'heroui-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MathDocumentPage } from 'types/mathDocuments';
import { useGeneration } from '../../../contexts/GenerationContext';
import { useAiGuidance } from 'hooks/useAiGuidance';
import { useCreateUndoSnapshot, useUndoRedo } from 'hooks/useUndoRedo';
import { generateId } from 'utils/generateId';
import AiPromptInput from './AiPromptInput';
import ChatOptionsDialog from './ChatOptionsDialog';

interface AiConversionPanelProps {
    documentTitle: string;
    page: MathDocumentPage;
    onUpdatePage: (nextPage: MathDocumentPage, description: string) => void;
    onUpdateMarkdown: (markdown: string) => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    setPreviewMarkdown: (markdown: string) => void;
}

const AiConversionPanel = ({ page, onUpdatePage, onUpdateMarkdown, onLayout, setPreviewMarkdown }: AiConversionPanelProps) => {
    const { executeCommand } = useUndoRedo();
    const createUndoSnapshot = useCreateUndoSnapshot();
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const { setGeneratingPage, isPageGenerating } = useGeneration();
    const [prompt, setPrompt] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const updatePageWithUndo = (nextPage: MathDocumentPage, description: string) => {
        const previousPage = createUndoSnapshot(page);
        const nextPageSnapshot = createUndoSnapshot(nextPage);

        executeCommand({
            action: () => onUpdatePage(nextPage, description),
            undoAction: () => onUpdatePage(previousPage, description),
            description: `${description} - ${page.title}`
        });
    };
    
    // Document-level guidance falls back to the account default
    const aiGuidance = useAiGuidance(page.documentId);

    const isGenerating = isPageGenerating(page.id);

    const getContextualPrompt = () => {
        if (page.markdown) {
            return `Follow-up: ${prompt || 'Continue working on this notes content'}`;
        } else {
            return prompt || aiGuidance;
        }
    };

    const handleGenerate = async () => {
        // Capture the current page data at the start of generation
        const currentPage = page;
        const currentPrompt = prompt;
        
        if (!currentPage.imageUrl) {
            setErrorMessage('Add an image before asking the AI to convert the page.');
            return;
        }

        try {
            setGeneratingPage(currentPage.id, true);
            setErrorMessage('');
            setPrompt(''); // Clear text immediately when generation starts

            const result = await convertMathImageToMarkdown({
                imageUrl: currentPage.imageUrl,
                guidance: getContextualPrompt(),
                currentMarkdown: currentPage.markdown,
                followUpPrompt: currentPage.markdown ? currentPrompt : undefined,
            });

            const nextPage: MathDocumentPage = {
                ...currentPage,
                markdown: result.markdown,
                lastAiPrompt: getContextualPrompt(),
                lastGeneratedAt: Date.now(),
                followUps: currentPrompt.trim()
                    ? [
                          ...currentPage.followUps,
                          {
                              id: generateId(),
                              prompt: getContextualPrompt(),
                              createdAt: Date.now(),
                              resultingMarkdown: result.markdown,
                          },
                      ]
                    : currentPage.followUps,
            };

            updatePageWithUndo(nextPage, currentPage.markdown ? 'Applied AI follow-up to page' : 'Generated page markdown from image');
            
            // Only update markdown if we're still on the same page
            if (page.id === currentPage.id) {
                onUpdateMarkdown(result.markdown);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'AI conversion failed.');
        } finally {
            setGeneratingPage(currentPage.id, false);
        }
    };

    return (
        <View className='absolute bottom-0 left-0 right-0' onLayout={onLayout}>
            <BlurView 
                intensity={20} 
                tint='light'
                className='absolute bottom-0 left-0 right-0 h-full'
            />
            <View className='relative bg-background/50 border-t border-subtle-border'>
                <Column className='py-4' gap={3}>
                    <Row className='justify-between items-center px-2'>
                        <PoppinsText weight='bold' varient='cardHeader'>Chat with the AI</PoppinsText>
                        <ChatOptionsDialog 
                            followUps={page.followUps} 
                            page={page}
                            onUpdatePage={onUpdatePage}
                            onUpdateMarkdown={onUpdateMarkdown}
                            setPreviewMarkdown={setPreviewMarkdown}
                        />
                    </Row>
                    
                    <AiPromptInput
                        page={page}
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        onSubmit={handleGenerate}
                        isGenerating={isGenerating}
                    />

                    {errorMessage ? <PoppinsText className='text-red-500'>{errorMessage}</PoppinsText> : null}
                </Column>
            </View>
        </View>
    );
};

export default AiConversionPanel;
