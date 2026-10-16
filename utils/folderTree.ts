import { MathDocumentFolder } from 'types/mathDocuments';

export interface FlattenedFolder {
    folder: MathDocumentFolder;
    depth: number;
}

const normalizeParentId = (folder: MathDocumentFolder) => folder.parentId ?? null;

/**
 * Flattens the folder tree into depth-first order with each folder's depth.
 * Sorts siblings with the provided comparator (defaults to name A-Z).
 */
export const flattenFolderTree = (
    folders: MathDocumentFolder[],
    sortSiblings: (a: MathDocumentFolder, b: MathDocumentFolder) => number = (a, b) => a.name.localeCompare(b.name),
): FlattenedFolder[] => {
    const childrenByParent = new Map<string | null, MathDocumentFolder[]>();

    for (const folder of folders) {
        const parentId = normalizeParentId(folder);
        const siblings = childrenByParent.get(parentId) ?? [];
        siblings.push(folder);
        childrenByParent.set(parentId, siblings);
    }

    const flattened: FlattenedFolder[] = [];

    const visit = (parentId: string | null, depth: number, ancestors: Set<string>) => {
        const children = (childrenByParent.get(parentId) ?? [])
            .slice()
            .sort(sortSiblings);

        for (const child of children) {
            if (ancestors.has(child.id)) {
                continue;
            }

            flattened.push({ folder: child, depth });
            visit(child.id, depth + 1, new Set([...ancestors, child.id]));
        }
    };

    visit(null, 0, new Set());

    // Orphaned folders (missing parent record) still show at top level.
    const included = new Set(flattened.map((entry) => entry.folder.id));
    for (const folder of folders.slice().sort(sortSiblings)) {
        if (!included.has(folder.id)) {
            flattened.push({ folder, depth: 0 });
        }
    }

    return flattened;
};

/**
 * Returns the chain of ancestor folders from the root down to (and including)
 * the folder with the given id. Empty array if the id is not found.
 */
export const getFolderAncestorChain = (
    folderId: string | null,
    folders: MathDocumentFolder[],
): MathDocumentFolder[] => {
    if (!folderId) {
        return [];
    }

    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const chain: MathDocumentFolder[] = [];
    const seen = new Set<string>();

    let current = byId.get(folderId) ?? null;
    while (current && !seen.has(current.id)) {
        seen.add(current.id);
        chain.unshift(current);
        current = normalizeParentId(current) ? byId.get(normalizeParentId(current)!) ?? null : null;
    }

    return chain;
};

/**
 * Finder-style copy naming: "Name copy", then "Name copy 2", "Name copy 3", ...
 * `taken` is a set of already-used names (lowercased) in the destination.
 */
export const makeCopyName = (base: string, taken: Set<string>) => {
    const copyBase = `${base} copy`;
    let name = copyBase;
    for (let index = 2; taken.has(name.toLowerCase()); index += 1) {
        name = `${copyBase} ${index}`;
    }
    return name;
};

/**
 * Returns the id of the given folder plus the ids of all of its descendants.
 * Used to prevent moving a folder into itself or one of its children.
 */
export const getFolderAndDescendantIds = (
    folderId: string,
    folders: MathDocumentFolder[],
): Set<string> => {
    const childrenByParent = new Map<string | null, MathDocumentFolder[]>();

    for (const folder of folders) {
        const parentId = normalizeParentId(folder);
        const siblings = childrenByParent.get(parentId) ?? [];
        siblings.push(folder);
        childrenByParent.set(parentId, siblings);
    }

    const ids = new Set<string>([folderId]);
    const queue = [folderId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        for (const child of childrenByParent.get(currentId) ?? []) {
            if (!ids.has(child.id)) {
                ids.add(child.id);
                queue.push(child.id);
            }
        }
    }

    return ids;
};
