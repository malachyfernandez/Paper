import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ScrollShadow } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, FileText, Folder, FolderInput, Pencil, Pin, SquareArrowOutUpRight } from 'lucide-react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import IconButton from '../ui/buttons/IconButton';
import PoppinsText from '../ui/text/PoppinsText';
import { useBrowserKeyboard } from 'hooks/useBrowserKeyboard';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useUserListSet } from 'hooks/useUserListSet';
import { useToast } from 'contexts/ToastContext';
import { MathDocument, MathDocumentFolder, MathDocumentPage } from 'types/mathDocuments';
import { DocumentSortOption, sortDocuments, sortFolders } from 'utils/documentSort';
import { getFolderAncestorChain, getFolderAndDescendantIds, makeCopyName } from 'utils/folderTree';
import { applySelectClick, pressModifiers, rangeBetween } from 'utils/multiSelect';
import { generateId } from 'utils/generateId';

type ColumnItem = { kind: 'folder'; folder: MathDocumentFolder } | { kind: 'document'; document: MathDocument };

interface DocumentColumnBrowserProps {
    userId: string;
    folders: MathDocumentFolder[];
    documents: MathDocument[];
    sortOption: DocumentSortOption;
    /** Folder to open into on mount (carried over from list-view navigation). */
    initialFolderId?: string | null;
    /** Reports the deepest open column so header create buttons can target it. */
    onActiveFolderChange?: (folderId: string | null) => void;
    onOpenDocument: (document: MathDocument) => void;
    onEditFolder: (folder: MathDocumentFolder) => void;
    onMoveDocument: (document: MathDocument) => void;
    onTogglePin: (document: MathDocument) => void;
    /** Disable while a dialog overlays the browser (arrows/shortcuts pause). */
    keyboardEnabled?: boolean;
    className?: string;
}

const DocumentColumnBrowser = ({
    userId,
    folders,
    documents,
    sortOption,
    initialFolderId = null,
    onActiveFolderChange,
    onOpenDocument,
    onEditFolder,
    onMoveDocument,
    onTogglePin,
    keyboardEnabled = true,
    className,
}: DocumentColumnBrowserProps) => {
    const { showToast } = useToast();
    const scopedUserIds = userId ? [userId] : ['__loading__'];
    const setDocument = useUserListSet<MathDocument>();
    const setFolder = useUserListSet<MathDocumentFolder>();
    const setPage = useUserListSet<MathDocumentPage>();
    const removeListItem = useUserListRemove();

    const pageRecords = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        userIds: scopedUserIds,
        returnTop: 500,
    });
    const allPages = useMemo(() => (pageRecords ?? []).map((record) => record.value), [pageRecords]);

    /** Chain of selected folder ids: column i+1 shows the children of columnPath[i]. */
    const [columnPath, setColumnPath] = useState<string[]>(() =>
        getFolderAncestorChain(initialFolderId, folders).map((folder) => folder.id),
    );
    /** A document picked in the deepest column; null means the deepest chain folder is the selection. */
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    /** Every selected id in the focus column (contains the lead id); Finder multi-select. */
    const [focusIds, setFocusIds] = useState<Set<string>>(new Set());
    /** Shift-click/shift-arrow range anchor. */
    const [selAnchorId, setSelAnchorId] = useState<string | null>(null);
    /** Clipboard, Finder-style: Cmd+C copies, Cmd+V pastes copies, Cmd+Opt+V moves. */
    const [clipboard, setClipboard] = useState<ColumnItem[]>([]);

    /** DOM id stamped on the active row so it can be scrolled into view. */
    const activeRowDomId = `doc-col-active-${useId()}`;

    // ------------------------------------------------------------- data

    /** parent folderId -> direct children, sorted. One map powers every column. */
    const childrenByParent = useMemo(() => {
        const map = new Map<string | null, { folders: MathDocumentFolder[]; documents: MathDocument[] }>();
        const ensure = (parent: string | null) => {
            let entry = map.get(parent);
            if (!entry) {
                entry = { folders: [], documents: [] };
                map.set(parent, entry);
            }
            return entry;
        };
        for (const folder of folders) ensure(folder.parentId ?? null).folders.push(folder);
        for (const document of documents) ensure(document.folderId ?? null).documents.push(document);
        for (const entry of map.values()) {
            entry.folders = sortFolders(entry.folders, sortOption);
            entry.documents = sortDocuments(entry.documents, sortOption);
        }
        return map;
    }, [folders, documents, sortOption]);

    const pageCountByDocumentId = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const page of allPages) {
            counts[page.documentId] = (counts[page.documentId] ?? 0) + 1;
        }
        return counts;
    }, [allPages]);

    const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
    const documentById = useMemo(() => new Map(documents.map((document) => [document.id, document])), [documents]);

    /** Deepest open column: where new items, pastes, and moves land. */
    const activeFolderId = columnPath[columnPath.length - 1] ?? null;
    const selectedDocument = selectedDocumentId ? documentById.get(selectedDocumentId) ?? null : null;

    const activeItem: ColumnItem | null = selectedDocument
        ? { kind: 'document', document: selectedDocument }
        : activeFolderId && folderById.get(activeFolderId)
            ? { kind: 'folder', folder: folderById.get(activeFolderId)! }
            : null;

    // ------------------------------------------------------------- sync + cleanup

    // Seed the chain once folders have actually loaded (records may arrive after mount).
    const didSeedRef = useRef(false);
    useEffect(() => {
        if (didSeedRef.current || !initialFolderId || !folders.length) return;
        const chain = getFolderAncestorChain(initialFolderId, folders);
        if (chain.length > 0) {
            setColumnPath(chain.map((folder) => folder.id));
            didSeedRef.current = true;
        }
    }, [initialFolderId, folders]);

    useEffect(() => {
        onActiveFolderChange?.(activeFolderId);
    }, [activeFolderId, onActiveFolderChange]);

    // Keep the selection valid when records change underneath us.
    useEffect(() => {
        setColumnPath((prev) => {
            // Keep the prefix up to the first folder that no longer exists.
            let lastValidIndex = -1;
            for (let index = 0; index < prev.length; index += 1) {
                if (folderById.has(prev[index])) {
                    lastValidIndex = index;
                } else {
                    break;
                }
            }
            const next = lastValidIndex < 0 ? [] : prev.slice(0, lastValidIndex + 1);
            return next.length === prev.length ? prev : next;
        });
        if (selectedDocumentId && !documentById.has(selectedDocumentId)) {
            setSelectedDocumentId(null);
        }
        // Prune selected ids that no longer exist.
        setFocusIds((prev) => {
            const next = new Set([...prev].filter((id) => folderById.has(id) || documentById.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [folders, documents, folderById, documentById, selectedDocumentId]);

    // Keep the keyboard-driven selection scrolled into view (web only).
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document
            .getElementById(activeRowDomId)
            ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }, [columnPath, selectedDocumentId, activeRowDomId]);

    // ------------------------------------------------------------- selection

    /** One column's rows in render order: folders first, then documents. */
    const columnItems = (parentId: string | null): ColumnItem[] => {
        const entry = childrenByParent.get(parentId);
        return [
            ...(entry?.folders ?? []).map((folder) => ({ kind: 'folder' as const, folder })),
            ...(entry?.documents ?? []).map((document) => ({ kind: 'document' as const, document })),
        ];
    };

    /** Make a row in column `colIndex` the lead selection (single-selects it). */
    const selectColumnItem = (colIndex: number, item: ColumnItem) => {
        const id = item.kind === 'folder' ? item.folder.id : item.document.id;
        if (item.kind === 'folder') {
            setColumnPath((prev) => [...prev.slice(0, colIndex), item.folder.id]);
            setSelectedDocumentId(null);
        } else {
            setColumnPath((prev) => prev.slice(0, colIndex));
            setSelectedDocumentId(item.document.id);
        }
        setFocusIds(new Set([id]));
        setSelAnchorId(id);
    };

    /** macOS column-view arrows. The "focus column" is the deepest column when
     *  a document is selected, else the column holding the deepest chain folder. */
    const focusColumnIndex = selectedDocumentId ? columnPath.length : columnPath.length - 1;

    /** The id of the lead item in the focus column (drives path/preview). */
    const leadId = selectedDocumentId ?? activeFolderId;

    const handleColumnArrow = (dir: 'up' | 'down' | 'left' | 'right', shiftKey = false) => {
        // Rows hold DOM focus after clicks; blur so a following Enter doesn't
        // "click" the stale row and yank the selection back.
        if (typeof document !== 'undefined') {
            (document.activeElement as HTMLElement | null)?.blur?.();
        }

        const focusCol = focusColumnIndex;

        if (dir === 'left') {
            if (selectedDocumentId) {
                setSelectedDocumentId(null);
            } else if (columnPath.length > 1) {
                setColumnPath((prev) => prev.slice(0, -1));
            } else {
                return;
            }
            const id = columnPath[columnPath.length - (selectedDocumentId ? 1 : 2)] ?? null;
            setFocusIds(new Set(id ? [id] : []));
            setSelAnchorId(id);
            return;
        }

        if (dir === 'right') {
            if (selectedDocument) {
                onOpenDocument(selectedDocument);
                return;
            }
            if (focusCol < 0) return;
            const items = columnItems(activeFolderId);
            if (items[0]) selectColumnItem(columnPath.length, items[0]);
            return;
        }

        const delta = dir === 'down' ? 1 : -1;
        if (focusCol < 0) {
            // Nothing selected yet: down picks the first root row, up the last.
            const items = columnItems(null);
            const target = delta > 0 ? items[0] : items[items.length - 1];
            if (target) selectColumnItem(0, target);
            return;
        }

        const parent = focusCol === 0 ? null : columnPath[focusCol - 1];
        const items = columnItems(parent);
        if (!items.length) return;
        const orderedIds = items.map((item) => (item.kind === 'folder' ? item.folder.id : item.document.id));
        const currentIndex = items.findIndex((item) =>
            item.kind === 'folder' ? item.folder.id === columnPath[focusCol] : item.document.id === selectedDocumentId,
        );
        const start = currentIndex < 0 ? (delta > 0 ? -1 : items.length) : currentIndex;
        const next = Math.max(0, Math.min(items.length - 1, start + delta));

        if (shiftKey) {
            // Extend: move the lead one step and select the anchor->lead range.
            const nextItem = items[next];
            const nextId = nextItem.kind === 'folder' ? nextItem.folder.id : nextItem.document.id;
            const anchor = selAnchorId ?? (leadId ?? nextId);
            selectColumnItem(focusCol, nextItem);
            setFocusIds(new Set(rangeBetween(orderedIds, anchor, nextId)));
            setSelAnchorId(anchor);
            return;
        }

        selectColumnItem(focusCol, items[next]);
    };

    /** Click on a row: modifiers only apply inside the focus column. */
    const handleItemClick = (colIndex: number, item: ColumnItem, event: unknown) => {
        const id = item.kind === 'folder' ? item.folder.id : item.document.id;
        const modifiers = pressModifiers(event);

        if ((modifiers.meta || modifiers.shift) && colIndex === focusColumnIndex) {
            const parent = colIndex === 0 ? null : columnPath[colIndex - 1];
            const orderedIds = columnItems(parent).map((entry) =>
                entry.kind === 'folder' ? entry.folder.id : entry.document.id,
            );
            const result = applySelectClick(focusIds, selAnchorId, id, orderedIds, modifiers);
            setFocusIds(result.ids);
            setSelAnchorId(result.anchorId);
            // Shift-clicks also move the lead so the preview/next column follows.
            if (result.kind === 'range') {
                if (item.kind === 'folder') {
                    setColumnPath((prev) => [...prev.slice(0, colIndex), item.folder.id]);
                    setSelectedDocumentId(null);
                } else {
                    setColumnPath((prev) => prev.slice(0, colIndex));
                    setSelectedDocumentId(item.document.id);
                }
            }
            return;
        }

        // Plain click on the one already-selected document opens it.
        if (item.kind === 'document' && item.document.id === selectedDocumentId && focusIds.size <= 1) {
            onOpenDocument(item.document);
            return;
        }

        selectColumnItem(colIndex, item);
    };

    /** Every selected item in the focus column, in display order. */
    const focusItems = ((): ColumnItem[] => {
        if (focusColumnIndex < 0) return [];
        const parent = focusColumnIndex === 0 ? null : columnPath[focusColumnIndex - 1];
        const items = columnItems(parent);
        const selected = items.filter((item) =>
            focusIds.has(item.kind === 'folder' ? item.folder.id : item.document.id),
        );
        // The lead may not be in focusIds yet (first load/path change).
        if (!selected.length && activeItem) return [activeItem];
        return selected;
    })();

    const handleSelectAll = () => {
        if (focusColumnIndex < 0) return;
        const parent = focusColumnIndex === 0 ? null : columnPath[focusColumnIndex - 1];
        const items = columnItems(parent);
        setFocusIds(new Set(items.map((item) => (item.kind === 'folder' ? item.folder.id : item.document.id))));
    };

    // ------------------------------------------------------------- clipboard ops

    /** Clone a document (and all of its pages) into a destination folder. */
    const cloneDocumentInto = async (document: MathDocument, destFolderId: string | null) => {
        const taken = new Set(
            (childrenByParent.get(destFolderId)?.documents ?? []).map((candidate) => candidate.title.toLowerCase()),
        );
        const title = taken.has(document.title.toLowerCase()) ? makeCopyName(document.title, taken) : document.title;
        const newDocumentId = generateId();
        const now = Date.now();

        await setDocument({
            key: 'mathDocuments',
            itemId: newDocumentId,
            value: {
                ...document,
                id: newDocumentId,
                title,
                folderId: destFolderId,
                pinnedAt: undefined,
                createdAt: now,
                lastOpenedAt: now,
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });

        const documentPages = allPages.filter((page) => page.documentId === document.id);
        await Promise.all(
            documentPages.map((page) => {
                const newPageId = generateId();
                return setPage({
                    key: 'mathDocumentPages',
                    itemId: newPageId,
                    value: { ...page, id: newPageId, documentId: newDocumentId },
                    privacy: 'PUBLIC',
                    filterKey: 'documentId',
                    searchKeys: ['title', 'markdown'],
                    sortKey: 'pageNumber',
                });
            }),
        );
    };

    /** Deep-clone a folder (subfolders + documents + pages) under a destination. */
    const cloneFolderInto = async (sourceFolder: MathDocumentFolder, destParentId: string | null) => {
        const subtreeIds = getFolderAndDescendantIds(sourceFolder.id, folders);
        const subtreeFolders = folders.filter((folder) => subtreeIds.has(folder.id));
        const subtreeDocuments = documents.filter((document) => document.folderId && subtreeIds.has(document.folderId));

        const taken = new Set(
            (childrenByParent.get(destParentId)?.folders ?? []).map((candidate) => candidate.name.toLowerCase()),
        );
        const sourceName = taken.has(sourceFolder.name.toLowerCase())
            ? makeCopyName(sourceFolder.name, taken)
            : sourceFolder.name;

        const folderIdMap = new Map(subtreeFolders.map((folder) => [folder.id, generateId()]));

        await Promise.all(
            subtreeFolders.map((folder) =>
                setFolder({
                    key: 'mathDocumentFolders',
                    itemId: folderIdMap.get(folder.id)!,
                    value: {
                        ...folder,
                        id: folderIdMap.get(folder.id)!,
                        name: folder.id === sourceFolder.id ? sourceName : folder.name,
                        parentId:
                            folder.id === sourceFolder.id
                                ? destParentId
                                : (folder.parentId && folderIdMap.get(folder.parentId)) ?? null,
                        createdAt: Date.now(),
                    },
                    privacy: 'PUBLIC',
                    searchKeys: ['name'],
                    sortKey: 'createdAt',
                }),
            ),
        );

        for (const document of subtreeDocuments) {
            await cloneDocumentInto(document, folderIdMap.get(document.folderId!) ?? destParentId);
        }
    };

    /** Move (Cmd+Opt+V semantics): reparent the clipboard item into the deepest open column. */
    const moveItemInto = async (item: ColumnItem, destFolderId: string | null) => {
        if (item.kind === 'document') {
            if ((item.document.folderId ?? null) === destFolderId) {
                showToast('Document is already in this folder.');
                return false;
            }
            await setDocument({
                key: 'mathDocuments',
                itemId: item.document.id,
                value: { ...item.document, folderId: destFolderId },
                privacy: 'PUBLIC',
                searchKeys: ['title', 'description'],
                sortKey: 'lastOpenedAt',
            });
            showToast(`Moved "${item.document.title}".`);
            return true;
        }

        if (item.folder.id === destFolderId) {
            showToast('A folder cannot be moved into itself.');
            return false;
        }
        if ((item.folder.parentId ?? null) === destFolderId) {
            showToast('Folder is already here.');
            return false;
        }
        if (destFolderId && getFolderAndDescendantIds(item.folder.id, folders).has(destFolderId)) {
            showToast('A folder cannot be moved into one of its own subfolders.');
            return false;
        }
        await setFolder({
            key: 'mathDocumentFolders',
            itemId: item.folder.id,
            value: { ...item.folder, parentId: destFolderId },
            privacy: 'PUBLIC',
            searchKeys: ['name'],
            sortKey: 'createdAt',
        });
        showToast(`Moved "${item.folder.name}".`);
        return true;
    };

    const handleCopy = () => {
        if (!focusItems.length) return;
        setClipboard(focusItems);
        const names = focusItems
            .map((item) => (item.kind === 'folder' ? item.folder.name : item.document.title));
        showToast(
            focusItems.length === 1
                ? `Copied "${names[0]}". Paste with Cmd+V, move with Cmd+Opt+V.`
                : `Copied ${focusItems.length} items. Paste with Cmd+V, move with Cmd+Opt+V.`,
        );
    };

    const handlePaste = async () => {
        for (const item of clipboard) {
            if (item.kind === 'document') {
                await cloneDocumentInto(item.document, activeFolderId);
            } else {
                await cloneFolderInto(item.folder, activeFolderId);
            }
        }
    };

    const handleMovePaste = async () => {
        const stillOnClipboard: ColumnItem[] = [];
        for (const item of clipboard) {
            // Finder semantics: refused moves stay in the clipboard.
            if (!(await moveItemInto(item, activeFolderId))) {
                stillOnClipboard.push(item);
            }
        }
        setClipboard(stillOnClipboard);
    };

    /** Delete the focus selection — same semantics as the dialogs: deleting a
     *  document removes it and its pages; deleting a folder unfiles its
     *  documents and reparents its subfolders. */
    const handleDeleteSelection = async () => {
        if (!focusItems.length) return;
        const deletableDocs = focusItems.filter((item) => item.kind === 'document');
        const deletableFolders = focusItems.filter((item) => item.kind === 'folder');

        for (const item of deletableDocs) {
            const pages = allPages.filter((page) => page.documentId === item.document.id);
            for (const page of pages) {
                await removeListItem({ key: 'mathDocumentPages', itemId: page.id });
            }
            await removeListItem({ key: 'mathDocuments', itemId: item.document.id });
        }

        for (const item of deletableFolders) {
            const folder = item.folder;
            const inside = documents.filter((document) => (document.folderId ?? null) === folder.id);
            for (const document of inside) {
                await setDocument({
                    key: 'mathDocuments',
                    itemId: document.id,
                    value: { ...document, folderId: folder.parentId ?? null },
                    privacy: 'PUBLIC',
                    searchKeys: ['title', 'description'],
                    sortKey: 'lastOpenedAt',
                });
            }
            const children = folders.filter((candidate) => (candidate.parentId ?? null) === folder.id);
            for (const child of children) {
                await setFolder({
                    key: 'mathDocumentFolders',
                    itemId: child.id,
                    value: { ...child, parentId: folder.parentId ?? null },
                    privacy: 'PUBLIC',
                    searchKeys: ['name'],
                    sortKey: 'createdAt',
                });
            }
            await removeListItem({ key: 'mathDocumentFolders', itemId: folder.id });
        }

        const count = deletableDocs.length + deletableFolders.length;
        showToast(`Deleted ${count} item${count === 1 ? '' : 's'}.`);
    };

    useBrowserKeyboard({
        enabled: keyboardEnabled,
        onArrowKey: handleColumnArrow,
        onPrimaryAction: () => handleColumnArrow('right'),
        onSelectAll: handleSelectAll,
        onCopy: handleCopy,
        onPaste: () => void handlePaste(),
        onMovePaste: () => void handleMovePaste(),
        onDelete: () => void handleDeleteSelection(),
    });

    // ------------------------------------------------------------- render

    const formatDate = (timestamp?: number) =>
        timestamp ? new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <ScrollShadow LinearGradientComponent={LinearGradient} className={className}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row className='items-stretch' gap={0}>
                    {Array.from({ length: columnPath.length + 1 }, (_, colIndex) => {
                        const parentId = colIndex === 0 ? null : columnPath[colIndex - 1];
                        const items = columnItems(parentId);
                        const chainFolderId = columnPath[colIndex];
                        const headerFolder = parentId ? folderById.get(parentId) : undefined;

                        return (
                            <View key={parentId ?? 'root'} className='w-60 border-r border-subtle-border h-[55vh]'>
                                {headerFolder && (
                                    <Row className='items-center gap-1 border-b border-subtle-border px-2 py-1'>
                                        <PoppinsText weight='medium' className='flex-1 text-xs' numberOfLines={1}>
                                            {headerFolder.name}
                                        </PoppinsText>
                                        <IconButton onPress={() => onEditFolder(headerFolder)} tooltip='Edit folder'>
                                            <Pencil size={13} className='text-subtext' />
                                        </IconButton>
                                    </Row>
                                )}
                                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                                    <Column className='p-1.5' gap={1}>
                                        {items.map((item) => {
                                            const id = item.kind === 'folder' ? item.folder.id : item.document.id;
                                            // Multi-select: every selected row in the focus column gets the
                                            // solid highlight; ancestor columns keep the muted path style.
                                            const inFocusSelection = colIndex === focusColumnIndex && focusIds.has(id);

                                            if (item.kind === 'folder') {
                                                const onPath = chainFolderId === item.folder.id;
                                                const isActive = inFocusSelection;
                                                return (
                                                    <Pressable
                                                        key={item.folder.id}
                                                        nativeID={id === leadId ? activeRowDomId : undefined}
                                                        onPress={(event) => handleItemClick(colIndex, item, event)}
                                                        className={`flex-row items-center gap-2 rounded-lg px-2 py-1.5 ${isActive ? 'bg-text' : onPath ? 'bg-text/15' : 'hover:bg-text/5'}`}
                                                    >
                                                        <Folder size={15} className={isActive ? 'text-background' : 'text-accent'} />
                                                        <PoppinsText
                                                            weight={isActive ? 'medium' : 'regular'}
                                                            color={isActive ? 'white' : 'black'}
                                                            className='flex-1 text-sm'
                                                            numberOfLines={1}
                                                        >
                                                            {item.folder.name}
                                                        </PoppinsText>
                                                        <ChevronRight size={13} className={isActive ? 'text-background' : 'text-subtext'} />
                                                    </Pressable>
                                                );
                                            }

                                            const isActive = inFocusSelection;
                                            return (
                                                <Pressable
                                                    key={item.document.id}
                                                    nativeID={id === leadId ? activeRowDomId : undefined}
                                                    onPress={(event) => handleItemClick(colIndex, item, event)}
                                                    className={`flex-row items-center gap-2 rounded-lg px-2 py-1.5 ${isActive ? 'bg-text' : 'hover:bg-text/5'}`}
                                                >
                                                    <FileText size={15} className={isActive ? 'text-background' : 'text-accent'} />
                                                    {item.document.pinnedAt ? (
                                                        <Pin size={11} className={isActive ? 'text-background' : 'text-accent'} />
                                                    ) : null}
                                                    <PoppinsText
                                                        weight={isActive ? 'medium' : 'regular'}
                                                        color={isActive ? 'white' : 'black'}
                                                        className='flex-1 text-sm'
                                                        numberOfLines={1}
                                                    >
                                                        {item.document.title}
                                                    </PoppinsText>
                                                </Pressable>
                                            );
                                        })}
                                        {items.length === 0 && (
                                            <PoppinsText varient='subtext' className='px-2 py-2 text-xs'>
                                                Empty
                                            </PoppinsText>
                                        )}
                                    </Column>
                                </ScrollView>
                            </View>
                        );
                    })}

                    {/* Preview column, one column right of a selected document. */}
                    {selectedDocument && (
                        <View className='w-60 h-[55vh]'>
                            <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                                <Column className='p-3' gap={2}>
                                    <Row className='items-center gap-2'>
                                        <FileText size={16} className='text-accent' />
                                        <PoppinsText weight='medium' className='flex-1 text-sm' numberOfLines={1}>
                                            {selectedDocument.title}
                                        </PoppinsText>
                                    </Row>
                                    <View className='border-b border-subtle-border' />
                                    {selectedDocument.description ? (
                                        <PoppinsText varient='subtext' className='text-xs'>
                                            {selectedDocument.description}
                                        </PoppinsText>
                                    ) : null}
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        {pageCountByDocumentId[selectedDocument.id] ?? 0} {(pageCountByDocumentId[selectedDocument.id] ?? 0) === 1 ? 'page' : 'pages'}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        Opened {formatDate(selectedDocument.lastOpenedAt)}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        Created {formatDate(selectedDocument.createdAt)}
                                    </PoppinsText>
                                    <Column gap={1} className='pt-1'>
                                        <AppButton variant='green' className='h-9 w-full' onPress={() => onOpenDocument(selectedDocument)}>
                                            <Row className='items-center' gap={2}>
                                                <SquareArrowOutUpRight size={13} color='rgb(246, 238, 219)' />
                                                <PoppinsText weight='medium' color='white' className='text-xs'>
                                                    Open
                                                </PoppinsText>
                                            </Row>
                                        </AppButton>
                                        <AppButton variant='outline-alt' className='h-9 w-full' onPress={() => onMoveDocument(selectedDocument)}>
                                            <Row className='items-center' gap={2}>
                                                <FolderInput size={13} className='text-text' />
                                                <PoppinsText weight='medium' className='text-xs'>
                                                    Move to folder
                                                </PoppinsText>
                                            </Row>
                                        </AppButton>
                                        <AppButton variant='outline-alt' className='h-9 w-full' onPress={() => onTogglePin(selectedDocument)}>
                                            <Row className='items-center' gap={2}>
                                                <Pin size={13} className='text-text' />
                                                <PoppinsText weight='medium' className='text-xs'>
                                                    {selectedDocument.pinnedAt ? 'Unpin' : 'Pin'}
                                                </PoppinsText>
                                            </Row>
                                        </AppButton>
                                    </Column>
                                </Column>
                            </ScrollView>
                        </View>
                    )}
                </Row>
            </ScrollView>
        </ScrollShadow>
    );
};

export default DocumentColumnBrowser;
