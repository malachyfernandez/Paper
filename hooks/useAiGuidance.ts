import { useUserVariable } from 'hooks/useUserVariable';
import { useUserList } from 'hooks/useUserList';
import { MathDocument } from 'types/mathDocuments';

export const DEFAULT_AI_GUIDANCE =
    'Convert this handwritten math to Markdown + LaTeX with exact transcription.';

/**
 * Effective AI conversion guidance: the document's own `aiGuidance` wins,
 * then the account-level `aiGuidance` userVariable, then the app default.
 */
export const useAiGuidance = (documentId?: string) => {
    const [aiGuidance] = useUserVariable({
        key: 'aiGuidance',
        defaultValue: DEFAULT_AI_GUIDANCE,
        privacy: 'PRIVATE',
    });

    const [documentRecord] = useUserList<MathDocument>({
        key: 'mathDocuments',
        itemId: documentId ?? '',
    });

    const documentGuidance = documentRecord?.value?.aiGuidance?.trim();
    return documentGuidance || aiGuidance.value || DEFAULT_AI_GUIDANCE;
};
