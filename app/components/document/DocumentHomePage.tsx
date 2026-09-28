import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { ScrollShadow, SearchField } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { useUserListSet } from 'hooks/useUserListSet';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useListSearch } from 'hooks/useListSearch';
import { MathDocument, MathDocumentFolder } from 'types/mathDocuments';
import DocumentCard from './DocumentCard';
import FolderCard from './FolderCard';
import NewDocumentDialog from './NewDocumentDialog';
import NewFolderDialog from './NewFolderDialog';
import EditFolderDialog from './EditFolderDialog';
import MoveToFolderDialog from './MoveToFolderDialog';
import { ArrowLeft, FileText, Folder, Pencil } from 'lucide-react-native';
import IconButton from '../ui/buttons/IconButton';
import LoadingState from '../ui/loading/LoadingState';

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
    const removeFolder = useUserListRemove();

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
        () => (folderRecords ?? []).map((record) => record.value).sort((a, b) => a.name.localeCompare(b.name)),
        [folderRecords],
    );

    const isSearching = searchQuery.trim().length > 0;
    const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null;

    // Reset the folder view if the open folder gets deleted or folders finish loading without it
    useEffect(() => {
        if (activeFolderId && folderRecords && !activeFolder) {
            setActiveFolderId(null);
        }
    }, [activeFolderId, activeFolder, folderRecords]);

    const folderDocumentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const document of documents ?? []) {
            if (document.folderId) {
                counts[document.folderId] = (counts[document.folderId] ?? 0) + 1;
            }
        }
        return counts;
    }, [documents]);

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

        // Pinned documents float to the top, then most recently opened
        return filtered.sort((a, b) => {
            const pinnedDelta = (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
            if (pinnedDelta !== 0) return pinnedDelta;
            return b.lastOpenedAt - a.lastOpenedAt;
        });
    }, [documents, isSearching, activeFolderId]);

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

    const showFolderBrowser = !isSearching && !activeFolderId && folders.length > 0;
    const showEmptyState = visibleDocuments.length === 0 && (!showFolderBrowser || isSearching || Boolean(activeFolderId));

    return (
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
                <Row gap={2}>
                    <View className='flex-1'>
                        <NewDocumentDialog onCreate={setActiveDocumentId} buttonVariant='green' folderId={activeFolderId} />
                    </View>
                    <NewFolderDialog />
                </Row>
            </Column>

            {/* Documents List */}
            <ScrollShadow LinearGradientComponent={LinearGradient} className='flex-1'>
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    <Column gap={4} className='pb-8 max-w-[800px] w-full mx-auto px-4'>
                        {/* Breadcrumb when inside a folder */}
                        {!isSearching && activeFolder && (
                            <Row className='items-center gap-2 px-1'>
                                <TouchableOpacity onPress={() => setActiveFolderId(null)} hitSlop={8} className='rounded-lg px-2 py-1 -ml-2 hover:bg-border/10'>
                                    <Row className='items-center gap-1'>
                                        <ArrowLeft size={16} className='text-accent' />
                                        <PoppinsText weight='medium' className='text-accent'>All documents</PoppinsText>
                                    </Row>
                                </TouchableOpacity>
                                <PoppinsText varient='subtext'>/</PoppinsText>
                                <Folder size={16} className='text-accent' />
                                <PoppinsText weight='bold' className='flex-1'>{activeFolder.name}</PoppinsText>
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

                        {/* Folders (root view only) */}
                        {showFolderBrowser && (
                            <Column gap={3}>
                                <PoppinsText varient='cardHeader' className='px-2'>Folders</PoppinsText>
                                {folders.map((folder) => (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        documentCount={folderDocumentCounts[folder.id] ?? 0}
                                        onPress={() => setActiveFolderId(folder.id)}
                                        onEdit={() => setEditingFolder(folder)}
                                    />
                                ))}
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
                                            ? 'Move documents here or create a new one to fill this folder.'
                                            : 'Create your first document to start converting handwritten notes to Markdown.'}
                                </PoppinsText>
                            </Column>
                        ) : null}
                    </Column>
                </ScrollView>
            </ScrollShadow>

            <EditFolderDialog
                folder={editingFolder}
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
        </Column>
    );
};

export default DocumentHomePage;
