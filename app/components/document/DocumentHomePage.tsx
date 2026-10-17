import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { ScrollShadow, SearchField } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { useUserListSet } from 'hooks/useUserListSet';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useUserVariable } from 'hooks/useUserVariable';
import { useListSearch } from 'hooks/useListSearch';
import { MathDocument, MathDocumentFolder } from 'types/mathDocuments';
import { DEFAULT_DOCUMENT_SORT, DEFAULT_DOCUMENT_VIEW_MODE, DOCUMENT_SORT_VARIABLE_KEY, DOCUMENT_VIEW_MODE_VARIABLE_KEY, DocumentSortOption, DocumentViewMode, sortDocuments, sortFolders } from 'utils/documentSort';
import { getFolderAncestorChain } from 'utils/folderTree';
import DocumentCard from './DocumentCard';
import DocumentColumnBrowser from './DocumentColumnBrowser';
import DocumentSortButton from './DocumentSortButton';
import FolderCard from './FolderCard';
import NewDocumentDialog from './NewDocumentDialog';
import NewFolderDialog from './NewFolderDialog';
import NewPageDialog from './NewPageDialog';
import EditFolderDialog from './EditFolderDialog';
import MoveToFolderDialog from './MoveToFolderDialog';
import FileDropZone from './FileDropZone';
import { generateId } from 'utils/generateId';
import { ArrowLeft, Columns3, FileText, Folder, List, Pencil } from 'lucide-react-native';
import IconButton from '../ui/buttons/IconButton';
import LoadingState from '../ui/loading/LoadingState';
import LoadingContainer from '../ui/loading/LoadingContainer';

interface DocumentHomePageProps {
    userId: string;
    setActiveDocumentId: (documentId: string) => void;
}

const DocumentHomePage = ({ userId, setActiveDocumentId }: DocumentHomePageProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [editingFolder, setEditingFolder] = useState<MathDocumentFolder | null>(null);
    const [movingDocument, setMovingDocument] = useState<MathDocument | null>(null);
    const scopedUserIds = userId ? [userId] : ['__loading__'];
    const setDocument = useUserListSet<MathDocument>();
    const setFolder = useUserListSet<MathDocumentFolder>();
    const removeFolder = useUserListRemove();
    const [sortRecord] = useUserVariable<DocumentSortOption>({
        key: DOCUMENT_SORT_VARIABLE_KEY,
        defaultValue: DEFAULT_DOCUMENT_SORT,
    });
    const sortOption = sortRecord.value;
    const [viewModeRecord, setViewMode] = useUserVariable<DocumentViewMode>({
        key: DOCUMENT_VIEW_MODE_VARIABLE_KEY,
        defaultValue: DEFAULT_DOCUMENT_VIEW_MODE,
    });
    const viewMode: DocumentViewMode = viewModeRecord.value === 'columns' ? 'columns' : 'list';
    /** Where the user last was in the file browser — survives navigation/reloads. */
    const [browserFolderRecord, setBrowserFolder] = useUserVariable<string>({
        key: 'documentBrowserFolder',
        defaultValue: '',
    });
    /** Deepest column open in the Finder-style browser (drives create-button targets). */
    const [columnsFolderId, setColumnsFolderId] = useState<string | null>(null);
    /** Files dropped on the browser -> temp document + page dialog for it. */
    const [dropSession, setDropSession] = useState<{ documentId: string; files: File[] } | null>(null);
    const [dropDialogOpen, setDropDialogOpen] = useState(false);
    /** List view: folders expanded in place via their disclosure triangle. */
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

    // Use the new generic search hook
    const { items: documents, isLoading, hasResults, resultCount } = useListSearch<MathDocument>({
        searchQuery,
        userIds: scopedUserIds,
        searchKey: 'mathDocuments',
        additionalKeys: ['mathDocumentPages'],
    });

    const folderRecords = useUserListGet<MathDocumentFolder>({
        key: 'mathDocumentFolders',
        userIds: scopedUserIds,
        returnTop: 100,
    });

    const folders = useMemo(
        () => sortFolders((folderRecords ?? []).map((record) => record.value), sortOption),
        [folderRecords, sortOption],
    );

    const isSearching = searchQuery.trim().length > 0;
    const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null;

    // Subfolders that live directly inside the folder currently being browsed
    const visibleFolders = useMemo(
        () => folders.filter((folder) => (folder.parentId ?? null) === activeFolderId),
        [folders, activeFolderId],
    );

    // Direct children maps for list-view expansion (folders are already sorted)
    const foldersByParentId = useMemo(() => {
        const map = new Map<string, MathDocumentFolder[]>();
        for (const folder of folders) {
            const parentId = folder.parentId ?? null;
            if (!parentId) continue;
            const siblings = map.get(parentId) ?? [];
            siblings.push(folder);
            map.set(parentId, siblings);
        }
        return map;
    }, [folders]);

    const documentsByFolderId = useMemo(() => {
        const map = new Map<string, MathDocument[]>();
        for (const document of documents ?? []) {
            if (!document.folderId) continue;
            const siblings = map.get(document.folderId) ?? [];
            siblings.push(document);
            map.set(document.folderId, siblings);
        }
        for (const [folderId, siblings] of map) {
            map.set(folderId, sortDocuments(siblings, sortOption));
        }
        return map;
    }, [documents, sortOption]);

    // Ancestor chain from the root down to the active folder (for the breadcrumb)
    const ancestorChain = useMemo(
        () => getFolderAncestorChain(activeFolderId, folders),
        [activeFolderId, folders],
    );

    // Reset the folder view if the open folder gets deleted or folders finish loading without it
    useEffect(() => {
        if (activeFolderId && folderRecords && !activeFolder) {
            setActiveFolderId(null);
        }
    }, [activeFolderId, activeFolder, folderRecords]);

    // Restore the last browsed folder once the persisted location resolves.
    const didRestoreFolderRef = useRef(false);
    useEffect(() => {
        if (didRestoreFolderRef.current || browserFolderRecord.state.isSyncing) return;
        didRestoreFolderRef.current = true;
        const stored = browserFolderRecord.value;
        if (stored) {
            setActiveFolderId(stored);
            setColumnsFolderId(stored);
        }
    }, [browserFolderRecord]);

    // Persist wherever the user currently is in the file browser.
    const currentBrowserFolderId = viewMode === 'columns' ? columnsFolderId : activeFolderId;
    useEffect(() => {
        if (!didRestoreFolderRef.current) return;
        if ((currentBrowserFolderId ?? '') !== (browserFolderRecord.value ?? '')) {
            setBrowserFolder(currentBrowserFolderId ?? '');
        }
    }, [currentBrowserFolderId, browserFolderRecord.value, setBrowserFolder]);

    const folderChildrenById = useMemo(() => {
        const map: Record<string, MathDocumentFolder[]> = {};
        for (const folder of folders) {
            const parentId = folder.parentId ?? null;
            if (!parentId) {
                continue;
            }
            (map[parentId] ??= []).push(folder);
        }
        return map;
    }, [folders]);

    const subfolderCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const folder of folders) {
            counts[folder.id] = folderChildrenById[folder.id]?.length ?? 0;
        }
        return counts;
    }, [folders, folderChildrenById]);

    // Document counts include documents inside descendant folders
    const folderDocumentCounts = useMemo(() => {
        const directCounts: Record<string, number> = {};
        for (const document of documents ?? []) {
            if (document.folderId) {
                directCounts[document.folderId] = (directCounts[document.folderId] ?? 0) + 1;
            }
        }

        const totals: Record<string, number> = {};
        const countWithDescendants = (folderId: string, seen: Set<string>): number => {
            if (seen.has(folderId)) {
                return 0;
            }
            seen.add(folderId);

            let total = directCounts[folderId] ?? 0;
            for (const child of folderChildrenById[folderId] ?? []) {
                total += countWithDescendants(child.id, seen);
            }
            return total;
        };

        for (const folder of folders) {
            totals[folder.id] = countWithDescendants(folder.id, new Set());
        }
        return totals;
    }, [documents, folders, folderChildrenById]);

    const folderNameById = useMemo(() => {
        const names: Record<string, string> = {};
        for (const folder of folders) {
            names[folder.id] = folder.name;
        }
        return names;
    }, [folders]);

    const visibleDocuments = useMemo(() => {
        const filtered = (documents ?? []).filter((document) => {
            if (isSearching) return true;
            if (activeFolderId) return document.folderId === activeFolderId;
            return !document.folderId;
        });

        return sortDocuments(filtered, sortOption);
    }, [documents, isSearching, activeFolderId, sortOption]);

    const openDocument = async (document: MathDocument) => {
        await setDocument({
            key: 'mathDocuments',
            itemId: document.id,
            value: {
                ...document,
                lastOpenedAt: Date.now(),
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });

        setActiveDocumentId(document.id);
    };

    const togglePin = (document: MathDocument) => {
        void setDocument({
            key: 'mathDocuments',
            itemId: document.id,
            value: {
                ...document,
                pinnedAt: document.pinnedAt ? undefined : Date.now(),
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });
    };

    const toggleFolderExpanded = (folderId: string) => {
        setExpandedFolderIds((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleViewModeChange = (mode: DocumentViewMode) => {
        // Carry the deepest navigated folder back into list view when leaving columns.
        if (mode === 'list') {
            setActiveFolderId(columnsFolderId);
        }
        setViewMode(mode);
    };

    const deleteFolder = async (folder: MathDocumentFolder) => {
        // Unfile the folder's documents instead of deleting them
        const folderDocuments = (documents ?? []).filter((document) => document.folderId === folder.id);
        await Promise.all(
            folderDocuments.map((document) =>
                setDocument({
                    key: 'mathDocuments',
                    itemId: document.id,
                    value: { ...document, folderId: null },
                    privacy: 'PUBLIC',
                    searchKeys: ['title', 'description'],
                    sortKey: 'lastOpenedAt',
                }),
            ),
        );

        // Subfolders move up to the deleted folder's parent instead of being deleted
        const childFolders = folders.filter((candidate) => (candidate.parentId ?? null) === folder.id);
        await Promise.all(
            childFolders.map((child) =>
                setFolder({
                    key: 'mathDocumentFolders',
                    itemId: child.id,
                    value: { ...child, parentId: folder.parentId ?? null },
                    privacy: 'PUBLIC',
                    searchKeys: ['name'],
                    sortKey: 'createdAt',
                }),
            ),
        );

        await removeFolder({ key: 'mathDocumentFolders', itemId: folder.id });
        setEditingFolder(null);
        if (activeFolderId === folder.id) {
            setActiveFolderId(null);
        }
    };

    if (!userId) {
        return (
            <Column className='flex-1 items-center justify-center p-8'>
                <LoadingState>
                    <Column className='rounded-3xl border-2 border-border bg-inner-background p-8 items-center' gap={3}>
                        <FileText size={48} className="text-accent" />
                        <PoppinsText weight='bold' className='text-2xl text-center'>Loading your workspace</PoppinsText>
                        <PoppinsText className='text-center text-subtext'>Syncing your account…</PoppinsText>
                    </Column>
                </LoadingState>
            </Column>
        );
    }

    const showFolderBrowser = !isSearching && visibleFolders.length > 0;
    const showEmptyState = visibleDocuments.length === 0 && (isSearching || !showFolderBrowser);
    const showColumns = viewMode === 'columns' && !isSearching;
    // In columns mode, create/paste actions target the deepest open column.
    const createTargetFolderId = showColumns ? columnsFolderId : activeFolderId;
    const createTargetFolderName = createTargetFolderId
        ? (folderNameById[createTargetFolderId] ?? 'Main folder')
        : 'Main folder';

    const openPageDialogForDrop = (documentId: string, files: File[]) => {
        setDropSession({ documentId, files });
        setDropDialogOpen(true);
    };

    const createTempDocument = async (files: File[]) => {
        const documentId = generateId();
        const now = Date.now();
        const stem = files[0]?.name?.replace(/\.[^.]+$/, '').trim() || 'New document';
        await setDocument({
            key: 'mathDocuments',
            itemId: documentId,
            value: {
                id: documentId,
                title: stem,
                description: '',
                createdAt: now,
                lastOpenedAt: now,
                folderId: createTargetFolderId,
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });
        return documentId;
    };

    const handleDroppedFiles = async (files: File[]) => {
        openPageDialogForDrop(await createTempDocument(files), files);
    };

    /** Recursive list-view rendering: a folder card plus, when expanded via its
     *  disclosure triangle, its subfolders and documents indented underneath. */
    const renderFolderItem = (folder: MathDocumentFolder, depth: number): React.ReactNode => {
        const isExpanded = expandedFolderIds.has(folder.id);
        const hasChildren =
            (foldersByParentId.get(folder.id)?.length ?? 0) + (documentsByFolderId.get(folder.id)?.length ?? 0) > 0;

        return (
            <React.Fragment key={folder.id}>
                <View style={{ marginLeft: depth * 20 }}>
                    <FolderCard
                        folder={folder}
                        documentCount={folderDocumentCounts[folder.id] ?? 0}
                        folderCount={subfolderCounts[folder.id] ?? 0}
                        expanded={isExpanded}
                        onToggleExpand={hasChildren ? () => toggleFolderExpanded(folder.id) : undefined}
                        onPress={() => setActiveFolderId(folder.id)}
                        onEdit={() => setEditingFolder(folder)}
                    />
                </View>
                {isExpanded && (
                    <Column gap={3} className='pt-3'>
                        {(foldersByParentId.get(folder.id) ?? []).map((child) => renderFolderItem(child, depth + 1))}
                        {(documentsByFolderId.get(folder.id) ?? []).map((document) => (
                            <View key={document.id} style={{ marginLeft: (depth + 1) * 20 }}>
                                <DocumentCard
                                    document={document}
                                    onPress={() => void openDocument(document)}
                                    onTogglePin={() => togglePin(document)}
                                    onMoveToFolder={() => setMovingDocument(document)}
                                />
                            </View>
                        ))}
                    </Column>
                )}
            </React.Fragment>
        );
    };

    return (
        <FileDropZone
            enabled={Platform.OS === 'web'}
            dropAnywhere
            className='flex-1'
            overlayLabel='Drop files to create a document'
            onFiles={(files) => void handleDroppedFiles(files)}
        >
        <Column className='flex-1' gap={6}>
            {/* Header Section */}
            <Column className='max-w-[800px] w-full mx-auto px-4' gap={4}>
                {/* Search Bar */}
                <SearchField value={searchQuery} onChange={setSearchQuery}>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input
                            placeholder="Search documents..."
                            className="border border-subtle-border bg-inner-background rounded-xl focus:outline-none"
                        />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>

                {/* Create Buttons */}
                <Row gap={2} className='items-center'>
                    <View className='flex-1'>
                        <NewDocumentDialog
                            onCreate={setActiveDocumentId}
                            buttonVariant='green'
                            folderId={createTargetFolderId}
                            folderName={createTargetFolderName}
                            onFilesDropped={(documentId, files) => openPageDialogForDrop(documentId, files)}
                        />
                    </View>
                    <NewFolderDialog parentFolderId={createTargetFolderId} parentFolderName={createTargetFolderName} />
                    <DocumentSortButton />
                    {/* View toggle - macOS segmented control (list / columns) */}
                    <Row className='overflow-hidden rounded border-2 border-border h-12' gap={0}>
                        <Pressable
                            accessibilityLabel='List view'
                            onPress={() => handleViewModeChange('list')}
                            className={`h-full w-12 items-center justify-center ${viewMode === 'list' ? 'bg-border/20' : 'hover:bg-border/10'}`}
                        >
                            <List size={18} className='text-text' />
                        </Pressable>
                        <Pressable
                            accessibilityLabel='Column view'
                            onPress={() => handleViewModeChange('columns')}
                            className={`h-full w-12 items-center justify-center border-l-2 border-border ${viewMode === 'columns' ? 'bg-border/20' : 'hover:bg-border/10'}`}
                        >
                            <Columns3 size={18} className='text-text' />
                        </Pressable>
                    </Row>
                </Row>
            </Column>

            {/* Documents List — held back until records + persisted prefs resolve,
                so the browser never flashes an empty/wrong folder first. */}
            <LoadingContainer
                dependencies={[
                    folderRecords,
                    documents,
                    viewModeRecord,
                    sortRecord,
                    browserFolderRecord,
                ]}
                loadingText='Loading your files'
                className='flex-1'
            >
            <ScrollShadow LinearGradientComponent={LinearGradient} className='flex-1'>
                {showColumns ? (
                    <DocumentColumnBrowser
                        userId={userId}
                        folders={folders}
                        documents={documents ?? []}
                        sortOption={sortOption}
                        initialFolderId={activeFolderId}
                        onActiveFolderChange={setColumnsFolderId}
                        onOpenDocument={(document) => void openDocument(document)}
                        onEditFolder={setEditingFolder}
                        onMoveDocument={setMovingDocument}
                        onTogglePin={togglePin}
                        keyboardEnabled={!editingFolder && !movingDocument}
                    />
                ) : (
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    <Column gap={4} className='pb-8 max-w-[800px] w-full mx-auto px-4'>
                        {/* Breadcrumb when inside a folder */}
                        {!isSearching && activeFolder && (
                            <Row className='items-center gap-2 px-1 flex-wrap'>
                                <TouchableOpacity onPress={() => setActiveFolderId(activeFolder.parentId ?? null)} hitSlop={8} className='rounded-lg px-2 py-1 -ml-2 hover:bg-border/10'>
                                    <Row className='items-center gap-1'>
                                        <ArrowLeft size={16} className='text-accent' />
                                        <PoppinsText weight='medium' className='text-accent'>Back</PoppinsText>
                                    </Row>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setActiveFolderId(null)} hitSlop={8} className='rounded-lg px-2 py-1 hover:bg-border/10'>
                                    <PoppinsText weight='medium' className='text-accent'>All documents</PoppinsText>
                                </TouchableOpacity>
                                {ancestorChain.map((ancestor, index) => {
                                    const isCurrent = index === ancestorChain.length - 1;

                                    if (isCurrent) {
                                        return (
                                            <Row key={ancestor.id} className='items-center gap-2'>
                                                <PoppinsText varient='subtext'>/</PoppinsText>
                                                <Folder size={16} className='text-accent' />
                                                <PoppinsText weight='bold'>{ancestor.name}</PoppinsText>
                                            </Row>
                                        );
                                    }

                                    return (
                                        <Row key={ancestor.id} className='items-center gap-2'>
                                            <PoppinsText varient='subtext'>/</PoppinsText>
                                            <TouchableOpacity onPress={() => setActiveFolderId(ancestor.id)} hitSlop={8} className='rounded-lg px-1 py-1 hover:bg-border/10'>
                                                <PoppinsText weight='medium' className='text-accent'>{ancestor.name}</PoppinsText>
                                            </TouchableOpacity>
                                        </Row>
                                    );
                                })}
                                <View className='flex-1' />
                                <IconButton onPress={() => setEditingFolder(activeFolder)} tooltip='Edit folder'>
                                    <Pencil size={16} className='text-subtext' />
                                </IconButton>
                            </Row>
                        )}

                        {isSearching && hasResults && (
                            <PoppinsText varient='subtext' className='px-2'>
                                Found {resultCount} document{resultCount !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;
                            </PoppinsText>
                        )}

                        {/* Folders in the current view (expandable via disclosure triangles) */}
                        {showFolderBrowser && (
                            <Column gap={3}>
                                <PoppinsText varient='cardHeader' className='px-2'>{activeFolder ? 'Subfolders' : 'Folders'}</PoppinsText>
                                {visibleFolders.map((folder) => renderFolderItem(folder, 0))}
                            </Column>
                        )}

                        {/* Documents */}
                        {visibleDocuments.length > 0 && (
                            <Column gap={3}>
                                {!isSearching && (
                                    <PoppinsText varient='cardHeader' className='px-2'>
                                        {activeFolder ? 'Documents' : showFolderBrowser ? 'Unfiled documents' : 'Documents'}
                                    </PoppinsText>
                                )}
                                {visibleDocuments.map((document) => (
                                    <DocumentCard
                                        key={document.id}
                                        document={document}
                                        folderName={isSearching && document.folderId ? folderNameById[document.folderId] : undefined}
                                        onPress={() => void openDocument(document)}
                                        onTogglePin={() => togglePin(document)}
                                        onMoveToFolder={() => setMovingDocument(document)}
                                    />
                                ))}
                            </Column>
                        )}

                        {/* Empty / loading states */}
                        {isLoading ? (
                            <LoadingState>
                                <Column className='rounded-2xl border border-subtle-border bg-inner-background p-8 items-center' gap={3}>
                                    <FileText size={48} className="text-subtext" />
                                    <PoppinsText weight='bold' className='text-xl text-center'>
                                        Loading documents...
                                    </PoppinsText>
                                    <PoppinsText className='text-center text-subtext'>
                                        Please wait while we fetch your documents.
                                    </PoppinsText>
                                </Column>
                            </LoadingState>
                        ) : showEmptyState ? (
                            <Column className='rounded-2xl border border-subtle-border bg-inner-background p-8 items-center' gap={3}>
                                {activeFolder ? (
                                    <Folder size={48} className="text-subtext" />
                                ) : (
                                    <FileText size={48} className="text-subtext" />
                                )}
                                <PoppinsText weight='bold' className='text-xl text-center'>
                                    {isSearching
                                        ? 'No documents found'
                                        : activeFolder
                                            ? 'No documents in this folder'
                                            : 'No documents yet'}
                                </PoppinsText>
                                <PoppinsText className='text-center text-subtext'>
                                    {isSearching
                                        ? `Try adjusting your search for "${searchQuery}"`
                                        : activeFolder
                                            ? 'Move documents here or create a subfolder to fill this folder.'
                                            : 'Create your first document to start converting handwritten notes to Markdown.'}
                                </PoppinsText>
                            </Column>
                        ) : null}
                    </Column>
                </ScrollView>
                )}
            </ScrollShadow>
            </LoadingContainer>

            <EditFolderDialog
                folder={editingFolder}
                folders={folders}
                isOpen={editingFolder !== null}
                onOpenChange={(open) => { if (!open) setEditingFolder(null); }}
                onDelete={(folder) => void deleteFolder(folder)}
            />
            <MoveToFolderDialog
                document={movingDocument}
                folders={folders}
                isOpen={movingDocument !== null}
                onOpenChange={(open) => { if (!open) setMovingDocument(null); }}
            />
            {dropSession && (
                <NewPageDialog
                    documentId={dropSession.documentId}
                    existingPageCount={0}
                    isOpen={dropDialogOpen}
                    onOpenChange={(open) => {
                        setDropDialogOpen(open);
                        if (!open) setDropSession(null);
                    }}
                    initialFiles={dropSession.files}
                    onCreate={() => {
                        setDropDialogOpen(false);
                        const documentId = dropSession.documentId;
                        setDropSession(null);
                        setActiveDocumentId(documentId);
                    }}
                />
            )}
        </Column>
        </FileDropZone>
    );
};

export default DocumentHomePage;
