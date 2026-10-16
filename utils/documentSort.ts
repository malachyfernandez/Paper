import { MathDocument, MathDocumentFolder } from 'types/mathDocuments';

export type DocumentSortOption = 'alphabetical' | 'lastOpened' | 'created';

export const DOCUMENT_SORT_VARIABLE_KEY = 'documentSortOption';
export const DEFAULT_DOCUMENT_SORT: DocumentSortOption = 'alphabetical';

export const DOCUMENT_SORT_OPTIONS: { value: DocumentSortOption; label: string; description: string }[] = [
    { value: 'alphabetical', label: 'Alphabetical', description: 'A to Z' },
    { value: 'lastOpened', label: 'Recently opened', description: 'Most recently opened first' },
    { value: 'created', label: 'Recently created', description: 'Newest first' },
];

export const sortDocuments = (documents: MathDocument[], option: DocumentSortOption): MathDocument[] => {
    return [...documents].sort((a, b) => {
        const pinnedDelta = (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
        if (pinnedDelta !== 0) {
            return pinnedDelta;
        }

        if (option === 'alphabetical') {
            return a.title.localeCompare(b.title);
        }

        if (option === 'created') {
            return b.createdAt - a.createdAt;
        }

        return b.lastOpenedAt - a.lastOpenedAt;
    });
};

export const sortFolders = (folders: MathDocumentFolder[], option: DocumentSortOption): MathDocumentFolder[] => {
    return [...folders].sort((a, b) => {
        if (option === 'alphabetical') {
            return a.name.localeCompare(b.name);
        }

        // Folders do not track lastOpenedAt, so recent sorts use createdAt.
        return b.createdAt - a.createdAt;
    });
};
