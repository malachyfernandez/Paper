import { useSyncExternalStore } from 'react';
import { MathDocumentPage } from 'types/mathDocuments';

/**
 * Module-level page clipboard so pages can be copied in one document and
 * pasted (or moved with Cmd+Opt+V) into another. Snapshots page values —
 * ids/documentId/pageNumber are rewritten on paste.
 */
interface PageClipboard {
    sourceDocumentId: string;
    pages: MathDocumentPage[];
}

let clipboard: PageClipboard | null = null;
const listeners = new Set<() => void>();

export const setPageClipboard = (value: PageClipboard | null) => {
    clipboard = value;
    listeners.forEach((listener) => listener());
};

export const getPageClipboard = () => clipboard;

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const usePageClipboard = () =>
    useSyncExternalStore(subscribe, () => clipboard, () => null);
