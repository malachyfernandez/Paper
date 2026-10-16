import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface BrowserKeyboardConfig {
    /** Arrow keys, fired when no modifier (except shift) is held and focus isn't in a text field. */
    onArrowKey?: (dir: 'up' | 'down' | 'left' | 'right') => void;
    /** Enter (or -> semantics): open the current selection. */
    onPrimaryAction?: () => void;
    /** Cmd/Ctrl+C */
    onCopy?: () => void;
    /** Cmd/Ctrl+V */
    onPaste?: () => void;
    /** Cmd/Ctrl+Option+V (macOS "paste as move") */
    onMovePaste?: () => void;
    /** Cmd/Ctrl+Backspace (macOS move-to-trash) */
    onDelete?: () => void;
    enabled?: boolean;
}

const ARROW_DIRS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

const isEditableTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    const tag = element?.tagName?.toLowerCase();
    return tag === 'textarea' || tag === 'input' || Boolean(element?.isContentEditable);
};

/**
 * Keyboard shortcuts for the document browser (column view).
 * Web only. Handlers are kept in refs so the listener registers once.
 */
export function useBrowserKeyboard({
    onArrowKey,
    onPrimaryAction,
    onCopy,
    onPaste,
    onMovePaste,
    onDelete,
    enabled = true,
}: BrowserKeyboardConfig) {
    const handlersRef = useRef({ onArrowKey, onPrimaryAction, onCopy, onPaste, onMovePaste, onDelete });
    handlersRef.current = { onArrowKey, onPrimaryAction, onCopy, onPaste, onMovePaste, onDelete };

    useEffect(() => {
        if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            const { onArrowKey, onPrimaryAction, onCopy, onPaste, onMovePaste, onDelete } = handlersRef.current;
            const mod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            if (mod && key === 'c' && !e.altKey && !isEditableTarget(e.target)) {
                // Let a real text selection copy normally instead of copying the item.
                if (window.getSelection?.()?.toString()) return;
                e.preventDefault();
                onCopy?.();
                return;
            }

            if (mod && key === 'v' && !isEditableTarget(e.target)) {
                e.preventDefault();
                if (e.altKey) {
                    onMovePaste?.();
                } else {
                    onPaste?.();
                }
                return;
            }

            if (mod && (e.key === 'Backspace' || e.key === 'Delete') && !isEditableTarget(e.target)) {
                e.preventDefault();
                onDelete?.();
                return;
            }

            const dir = ARROW_DIRS[e.key];
            if (dir && !mod && !e.altKey && !isEditableTarget(e.target)) {
                e.preventDefault();
                onArrowKey?.(dir);
                return;
            }

            if (e.key === 'Enter' && !mod && !e.altKey && !e.shiftKey && !isEditableTarget(e.target)) {
                // Let focused buttons activate themselves on Enter.
                const target = e.target as HTMLElement | null;
                if (target?.closest?.('button, [role="button"]')) {
                    return;
                }
                e.preventDefault();
                onPrimaryAction?.();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [enabled]);
}
