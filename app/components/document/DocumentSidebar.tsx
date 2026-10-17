import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { ScrollShadow } from 'heroui-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, Copy, ClipboardPaste, Trash2 } from 'lucide-react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';
import { useUserList } from 'hooks/useUserList';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useUserListSet } from 'hooks/useUserListSet';
import { useCreateUndoSnapshot, useUndoRedo } from 'hooks/useUndoRedo';
import { useBrowserKeyboard } from 'hooks/useBrowserKeyboard';
import { useAiGuidance } from 'hooks/useAiGuidance';
import { useGeneration } from 'contexts/GenerationContext';
import { useToast } from 'contexts/ToastContext';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { applySelectClick, pressModifiers, rangeBetween } from 'utils/multiSelect';
import { getPageClipboard, setPageClipboard, usePageClipboard } from 'utils/pageClipboard';
import { generateId } from 'utils/generateId';
import { MathDocument, MathDocumentPage } from 'types/mathDocuments';
import PageListItem from './PageListItem';
import NewPageDialog from './NewPageDialog';
import PageConfigDialog from './PageConfigDialog';
import DocumentDetails from './DocumentDetails';
import ReorderPagesDialog from './ReorderPagesDialog';

interface DocumentSidebarProps {
    documentId: string;
    userId: string;
    activePageId: string;
    onSetActivePageId: (pageId: string) => void;
    onHideSidebar?: () => void;
}

const DocumentSidebar = ({ documentId, userId, activePageId, onSetActivePageId, onHideSidebar }: DocumentSidebarProps) => {
    const { executeCommand } = useUndoRedo();
    const createUndoSnapshot = useCreateUndoSnapshot();
    const scopedUserIds = userId ? [userId] : ['__loading__'];
    const [documentRecord] = useUserList<MathDocument>({
        key: 'mathDocuments',
        itemId: documentId,
    });
    const setPage = useUserListSet<MathDocumentPage>();
    const removePage = useUserListRemove();
    const restorePage = useUserListSet<MathDocumentPage>();

    const [pageConfigDialogOpen, setPageConfigDialogOpen] = useState(false);
    const [configuringPage, setConfiguringPage] = useState<MathDocumentPage | null>(null);
    const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
    /** Multi-selection (Finder-style: cmd/ctrl toggle, shift range). */
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [pageAnchorId, setPageAnchorId] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const aiGuidance = useAiGuidance(documentId);
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const { setGeneratingPage } = useGeneration();
    const { showToast } = useToast();
    const pageClipboard = usePageClipboard();

    const pagesResult = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: documentId,
        userIds: scopedUserIds,
        returnTop: 100,
    });
    const pages = useMemo(() => pagesResult ?? [], [pagesResult]);

    const sortedPages = useMemo(
        () => [...pages].sort((left, right) => left.value.pageNumber - right.value.pageNumber),
        [pages],
    );
    const highestPageNumber = sortedPages.length > 0 ? sortedPages[sortedPages.length - 1].value.pageNumber : 0;
    const orderedPageIds = useMemo(() => sortedPages.map((page) => page.value.id), [sortedPages]);
    const selectedPages = sortedPages.filter((page) => selectedPageIds.has(page.value.id));

    // Prune selected ids that no longer exist (deletes, document switches).
    useEffect(() => {
        const pageIdSet = new Set(orderedPageIds);
        setSelectedPageIds((prev) => {
            const next = new Set([...prev].filter((id) => pageIdSet.has(id)));
            return next.size === prev.size ? prev : next;
        });
        setPageAnchorId((prev) => (prev && pageIdSet.has(prev) ? prev : null));
    }, [orderedPageIds]);

    const handlePageConfig = (page: MathDocumentPage) => {
        setConfiguringPage(page);
        setPageConfigDialogOpen(true);
    };

    const handlePageConfigOpenChange = (open: boolean) => {
        setPageConfigDialogOpen(open);

        if (!open) {
            setConfiguringPage(null);
        }
    };

    const handlePageUpdate = (updatedPage: MathDocumentPage) => {
        if (!configuringPage) return;
        
        const previousPage = createUndoSnapshot(configuringPage);
        
        executeCommand({
            action: () => {
                void setPage({
                    key: 'mathDocumentPages',
                    itemId: updatedPage.id,
                    value: updatedPage,
                    privacy: 'PUBLIC',
                    filterKey: 'documentId',
                    searchKeys: ['title', 'markdown'],
                    sortKey: 'pageNumber',
                });
            },
            undoAction: () => {
                void setPage({
                    key: 'mathDocumentPages',
                    itemId: previousPage.id,
                    value: previousPage,
                    privacy: 'PUBLIC',
                    filterKey: 'documentId',
                    searchKeys: ['title', 'markdown'],
                    sortKey: 'pageNumber',
                });
            },
            description: `Updated page configuration - ${updatedPage.title}`
        });
    };

    const handlePageDelete = () => {
        if (configuringPage) {
            const deletedPage = createUndoSnapshot(configuringPage);

            executeCommand({
                action: () => {
                    void removePage({ key: 'mathDocumentPages', itemId: configuringPage.id });
                    onSetActivePageId('');
                },
                undoAction: () => {
                    void restorePage({
                        key: 'mathDocumentPages',
                        itemId: deletedPage.id,
                        value: deletedPage,
                        privacy: 'PUBLIC',
                        filterKey: 'documentId',
                        searchKeys: ['title', 'markdown'],
                        sortKey: 'pageNumber',
                    });
                    onSetActivePageId(deletedPage.id);
                },
                description: `Deleted page - ${configuringPage.title}`,
            });
        }
    };

    const handleReorderPages = (updatedPages: MathDocumentPage[]) => {
        const previousPages = createUndoSnapshot(pages.map(p => p.value));
        
        executeCommand({
            action: () => {
                updatedPages.forEach((page) => {
                    void setPage({
                        key: 'mathDocumentPages',
                        itemId: page.id,
                        value: page,
                        privacy: 'PUBLIC',
                        filterKey: 'documentId',
                        searchKeys: ['title', 'markdown'],
                        sortKey: 'pageNumber',
                    });
                });
            },
            undoAction: () => {
                previousPages.forEach((page) => {
                    void setPage({
                        key: 'mathDocumentPages',
                        itemId: page.id,
                        value: page,
                        privacy: 'PUBLIC',
                        filterKey: 'documentId',
                        searchKeys: ['title', 'markdown'],
                        sortKey: 'pageNumber',
                    });
                });
            },
            description: 'Reordered pages'
        });
    };

    // ----------------------------------------------------- page selection

    const writePage = (page: MathDocumentPage) =>
        setPage({
            key: 'mathDocumentPages',
            itemId: page.id,
            value: page,
            privacy: 'PUBLIC',
            filterKey: 'documentId',
            searchKeys: ['title', 'markdown'],
            sortKey: 'pageNumber',
        });

    /** Click on a page row: cmd/ctrl toggles, shift ranges from the anchor,
     *  plain click opens the page (and collapses selection to it). */
    const handlePageClick = (page: MathDocumentPage, event: unknown) => {
        const modifiers = pressModifiers(event);
        if (modifiers.meta || modifiers.shift) {
            const result = applySelectClick(selectedPageIds, pageAnchorId, page.id, orderedPageIds, modifiers);
            setSelectedPageIds(result.ids);
            setPageAnchorId(result.anchorId);
            if (result.kind === 'range') {
                onSetActivePageId(page.id);
            }
            return;
        }
        setSelectedPageIds(new Set([page.id]));
        setPageAnchorId(page.id);
        onSetActivePageId(page.id);
        onHideSidebar?.();
    };

    const handlePageArrow = (dir: 'up' | 'down' | 'left' | 'right', shiftKey: boolean) => {
        if (dir !== 'up' && dir !== 'down') return;
        if (!orderedPageIds.length) return;
        const delta = dir === 'down' ? 1 : -1;
        const currentIndex = orderedPageIds.indexOf(activePageId);
        const start = currentIndex < 0 ? (delta > 0 ? -1 : orderedPageIds.length) : currentIndex;
        const nextIndex = Math.max(0, Math.min(orderedPageIds.length - 1, start + delta));
        const nextId = orderedPageIds[nextIndex];

        onSetActivePageId(nextId);
        if (shiftKey && pageAnchorId) {
            setSelectedPageIds(new Set(rangeBetween(orderedPageIds, pageAnchorId, nextId)));
        } else {
            setSelectedPageIds(new Set([nextId]));
            setPageAnchorId(nextId);
        }
    };

    const handleSelectAllPages = () => setSelectedPageIds(new Set(orderedPageIds));

    const handleCopyPages = () => {
        if (!selectedPages.length) return;
        setPageClipboard({
            sourceDocumentId: documentId,
            pages: selectedPages.map((page) => ({ ...page.value })),
        });
        showToast(
            selectedPages.length === 1
                ? 'Copied page. Paste with Cmd+V, move with Cmd+Opt+V.'
                : `Copied ${selectedPages.length} pages. Paste with Cmd+V, move with Cmd+Opt+V.`,
        );
    };

    /** Paste duplicates pages into this document; move reparents them here. */
    const handlePastePages = (move: boolean) => {
        const clip = getPageClipboard();
        if (!clip?.pages.length) return;
        const maxPageNumber = highestPageNumber;

        if (move) {
            if (clip.sourceDocumentId === documentId) {
                showToast('Pages are already in this document.');
                return;
            }
            const previousPages = clip.pages.map((page) => ({ ...page }));
            const movedPages = clip.pages.map((page, index) => ({
                ...page,
                documentId,
                pageNumber: maxPageNumber + index + 1,
            }));
            executeCommand({
                action: () => {
                    movedPages.forEach((page) => void writePage(page));
                },
                undoAction: () => {
                    previousPages.forEach((page) => void writePage(page));
                },
                description: `Moved ${movedPages.length} page${movedPages.length === 1 ? '' : 's'}`,
            });
            showToast(`Moved ${movedPages.length} page${movedPages.length === 1 ? '' : 's'} here.`);
            return;
        }

        const newPages = clip.pages.map((page, index) => ({
            ...page,
            id: generateId(),
            documentId,
            pageNumber: maxPageNumber + index + 1,
        }));
        executeCommand({
            action: () => {
                newPages.forEach((page) => void writePage(page));
            },
            undoAction: () => {
                newPages.forEach((page) => void removePage({ key: 'mathDocumentPages', itemId: page.id }));
            },
            description: `Pasted ${newPages.length} page${newPages.length === 1 ? '' : 's'}`,
        });
        showToast(`Pasted ${newPages.length} page${newPages.length === 1 ? '' : 's'}.`);
    };

    const handleDeleteSelectedPages = () => {
        if (!selectedPages.length) return;
        const snapshots = selectedPages.map((page) => ({ ...page.value }));
        const deletedIds = new Set(snapshots.map((page) => page.id));
        const fallback = sortedPages.find((page) => !deletedIds.has(page.value.id))?.value.id ?? '';

        executeCommand({
            action: () => {
                snapshots.forEach((page) => void removePage({ key: 'mathDocumentPages', itemId: page.id }));
                if (deletedIds.has(activePageId)) {
                    onSetActivePageId(fallback);
                }
            },
            undoAction: () => {
                snapshots.forEach((page) => void writePage(page));
            },
            description: `Deleted ${snapshots.length} page${snapshots.length === 1 ? '' : 's'}`,
        });
        // Close the config dialog if its page was deleted — otherwise a later
        // save would recreate the record.
        if (configuringPage && deletedIds.has(configuringPage.id)) {
            setPageConfigDialogOpen(false);
            setConfiguringPage(null);
        }
        showToast(`Deleted ${snapshots.length} page${snapshots.length === 1 ? '' : 's'}.`);
    };

    /** Re-run AI conversion on every selected page that has an image. */
    const handleRegenerateSelectedPages = async () => {
        const targets = selectedPages.filter((page) => page.value.imageUrl);
        if (!targets.length) {
            showToast('Selected pages have no images to convert.');
            return;
        }
        setIsRegenerating(true);
        const documentTitle = documentRecord.value?.title;
        let failures = 0;
        const results = await Promise.all(
            targets.map(async (item) => {
                const page = item.value;
                setGeneratingPage(page.id, true);
                try {
                    const result = await convertMathImageToMarkdown({
                        imageUrl: page.imageUrl,
                        guidance: aiGuidance || undefined,
                        currentMarkdown: page.markdown,
                        documentTitle,
                        pageTitle: page.title,
                    });
                    return { page, markdown: result.markdown };
                } catch {
                    failures += 1;
                    return null;
                } finally {
                    setGeneratingPage(page.id, false);
                }
            }),
        );

        const applied = results.filter((result): result is { page: MathDocumentPage; markdown: string } =>
            Boolean(result?.markdown),
        );
        if (applied.length) {
            const generatedAt = Date.now();
            const previousPages = applied.map(({ page }) => ({ ...page }));
            executeCommand({
                action: () => {
                    applied.forEach(({ page, markdown }) =>
                        void writePage({ ...page, markdown, lastAiPrompt: aiGuidance, lastGeneratedAt: generatedAt }),
                    );
                },
                undoAction: () => {
                    previousPages.forEach((page) => void writePage(page));
                },
                description: `Regenerated ${applied.length} page${applied.length === 1 ? '' : 's'}`,
            });
        }
        showToast(
            failures
                ? `Regenerated ${applied.length} page${applied.length === 1 ? '' : 's'}, ${failures} failed.`
                : `Regenerated ${applied.length} page${applied.length === 1 ? '' : 's'}.`,
        );
        setIsRegenerating(false);
    };

    useBrowserKeyboard({
        enabled: !pageConfigDialogOpen && !reorderDialogOpen,
        onArrowKey: handlePageArrow,
        onSelectAll: handleSelectAllPages,
        onCopy: handleCopyPages,
        onPaste: () => handlePastePages(false),
        onMovePaste: () => handlePastePages(true),
        onDelete: handleDeleteSelectedPages,
    });

    if (!documentRecord.value) {
        return null;
    }

    return (
        <Column gap={0} className='h-full'>
            <Column className={`flex-1 ${Platform.OS === 'web' ? 'w-64' : 'w-full'}`} gap={4}>
                <Column className='rounded-tr-2xl border-t-2 border-r-2 border-border bg-inner-background p-4 flex-1' gap={3}>
                    <PoppinsText weight='bold' varient='cardHeader'>Pages</PoppinsText>
                    {selectedPageIds.size > 0 && (
                        <Row gap={1} className='items-center flex-wrap'>
                            <PoppinsText varient='subtext' className='text-xs mr-1'>
                                {selectedPageIds.size} selected
                            </PoppinsText>
                            <TouchableOpacity
                                onPress={() => void handleRegenerateSelectedPages()}
                                disabled={isRegenerating}
                                className='flex-row items-center gap-1 rounded-md border border-subtle-border bg-inner-background px-2 py-1'
                            >
                                <RefreshCw size={12} className='text-accent' />
                                <PoppinsText varient='subtext' className='text-xs'>
                                    {isRegenerating ? 'Working…' : 'Regenerate'}
                                </PoppinsText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCopyPages}
                                className='flex-row items-center gap-1 rounded-md border border-subtle-border bg-inner-background px-2 py-1'
                            >
                                <Copy size={12} className='text-accent' />
                                <PoppinsText varient='subtext' className='text-xs'>Copy</PoppinsText>
                            </TouchableOpacity>
                            {pageClipboard?.pages.length ? (
                                <TouchableOpacity
                                    onPress={() => handlePastePages(false)}
                                    className='flex-row items-center gap-1 rounded-md border border-subtle-border bg-inner-background px-2 py-1'
                                >
                                    <ClipboardPaste size={12} className='text-accent' />
                                    <PoppinsText varient='subtext' className='text-xs'>Paste</PoppinsText>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                onPress={handleDeleteSelectedPages}
                                className='flex-row items-center gap-1 rounded-md border border-subtle-border bg-inner-background px-2 py-1'
                            >
                                <Trash2 size={12} className='text-accent' />
                                <PoppinsText varient='subtext' className='text-xs'>Delete</PoppinsText>
                            </TouchableOpacity>
                        </Row>
                    )}
                    <NewPageDialog
                        documentId={documentId} 
                        existingPageCount={highestPageNumber} 
                        triggerButtonVariant='green'
                        createButtonVariant='green'
                        onCreate={(pageId) => {
                            onSetActivePageId(pageId);
                            onHideSidebar?.();
                        }} 
                    />
                    <ScrollShadow LinearGradientComponent={LinearGradient} className='flex-1' color='rgb(253, 251, 246)'>
                        <ScrollView className='flex-1'>
                            <Column gap={2} className='pb-6'>
                                {sortedPages.map((page) => (
                                    <PageListItem
                                        key={page.itemId ?? page.value.id}
                                        page={page.value}
                                        isActive={page.value.id === activePageId}
                                        isSelected={selectedPageIds.has(page.value.id)}
                                        onPress={(event) => handlePageClick(page.value, event)}
                                        onConfigure={() => handlePageConfig(page.value)}
                                    />
                                ))}
                                <View className='w-full items-center justify-center'>
                                    {sortedPages.length > 1 && (
                                        <AppButton variant='black' className='h-8! w-32! rounded-full' onPress={() => setReorderDialogOpen(true)}>
                                            <PoppinsText weight='regular' color='white'>Reorder Pages</PoppinsText>
                                        </AppButton>
                                    )}
                                </View>
                            </Column>
                        </ScrollView>
                    </ScrollShadow>

                </Column>

                {/* <DocumentDetails document={documentRecord.value} /> */}

            </Column>
            {configuringPage && (
                <PageConfigDialog
                    page={configuringPage}
                    isOpen={pageConfigDialogOpen}
                    onOpenChange={handlePageConfigOpenChange}
                    onUpdate={handlePageUpdate}
                    onDelete={handlePageDelete}
                />
            )}
            <ReorderPagesDialog
                pages={sortedPages.map(p => p.value)}
                isOpen={reorderDialogOpen}
                onOpenChange={setReorderDialogOpen}
                onReorderPages={handleReorderPages}
            />
        </Column>
    );
};

export default DocumentSidebar;
