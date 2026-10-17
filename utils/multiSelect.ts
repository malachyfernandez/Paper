/**
 * Shared multi-selection helpers (Finder semantics).
 *
 * - plain click   -> single select, clicked item becomes the anchor
 * - cmd/ctrlclick -> toggle the item in the set, becomes the anchor
 * - shift click   -> range from the anchor to the clicked item (anchor kept)
 */

export interface SelectModifiers {
    meta?: boolean;
    shift?: boolean;
}

export interface SelectClickResult {
    kind: 'single' | 'toggle' | 'range';
    ids: Set<string>;
    anchorId: string;
}

/** All ids between `fromId` and `toId` inclusive, in list order. */
export const rangeBetween = (orderedIds: string[], fromId: string, toId: string): string[] => {
    const from = orderedIds.indexOf(fromId);
    const to = orderedIds.indexOf(toId);
    if (from === -1 || to === -1) return [toId];
    const [start, end] = from < to ? [from, to] : [to, from];
    return orderedIds.slice(start, end + 1);
};

/** Apply a click with modifiers to the current selection set. */
export const applySelectClick = (
    currentIds: ReadonlySet<string>,
    anchorId: string | null,
    id: string,
    orderedIds: string[],
    modifiers: SelectModifiers,
): SelectClickResult => {
    if (modifiers.meta) {
        const ids = new Set(currentIds);
        if (ids.has(id)) {
            ids.delete(id);
        } else {
            ids.add(id);
        }
        return { kind: 'toggle', ids, anchorId: id };
    }

    if (modifiers.shift && anchorId && orderedIds.includes(anchorId)) {
        return { kind: 'range', ids: new Set(rangeBetween(orderedIds, anchorId, id)), anchorId };
    }

    return { kind: 'single', ids: new Set([id]), anchorId: id };
};

/** Read modifier keys off an RN press event (web: the DOM mouse event). */
export const pressModifiers = (event: unknown): SelectModifiers => {
    const native = (event as { nativeEvent?: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } })?.nativeEvent;
    return {
        meta: Boolean(native?.metaKey || native?.ctrlKey),
        shift: Boolean(native?.shiftKey),
    };
};
