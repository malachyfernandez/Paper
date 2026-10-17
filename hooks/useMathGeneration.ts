import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { MathDocumentPage } from 'types/mathDocuments';
import { useAiGuidance } from 'hooks/useAiGuidance';

interface UseMathGenerationProps {
    page: MathDocumentPage;
    onUpdatePage: (nextPage: MathDocumentPage, description: string) => void;
    onUpdateMarkdown: (markdown: string) => void;
    onFollowUpUpdate?: (resultingMarkdown: string) => void; // Simplified: just pass the result
    shouldUpdatePage?: () => boolean; // Callback to check if we should update the page
}

export const useMathGeneration = ({ page, onUpdatePage, onUpdateMarkdown, onFollowUpUpdate, shouldUpdatePage }: UseMathGenerationProps) => {
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Document-level guidance falls back to the account default
    const aiGuidance = useAiGuidance(page.documentId);

    const handleInitialGeneration = async () => {
        if (!page.imageUrl) {
            setErrorMessage('Add an image before asking the AI to convert the page.');
            return;
        }

        try {
            setIsGenerating(true);
            setErrorMessage('');

            const result = await convertMathImageToMarkdown({
                imageUrl: page.imageUrl,
                guidance: aiGuidance,
                currentMarkdown: page.markdown,
                followUpPrompt: undefined,
            });

            const nextPage = {
                ...page,
                markdown: result.markdown,
                lastAiPrompt: aiGuidance,
                lastGeneratedAt: Date.now(),
            };

            // Only update if we should still update this page
            if (!shouldUpdatePage || shouldUpdatePage()) {
                onUpdatePage(nextPage, 'Generated page markdown from image');
                onUpdateMarkdown(result.markdown);

                // Call follow-up update callback if provided
                if (onFollowUpUpdate) {
                    onFollowUpUpdate(result.markdown);
                }
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'AI conversion failed.');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        errorMessage,
        handleInitialGeneration,
        setErrorMessage,
    };
};
