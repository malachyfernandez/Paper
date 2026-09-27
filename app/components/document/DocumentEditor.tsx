import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { useUserList } from 'hooks/useUserList';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListSet } from 'hooks/useUserListSet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useUndoRedo, useCreateUndoSnapshot } from 'hooks/useUndoRedo';
import { useGeneration } from '../../../contexts/GenerationContext';
import { MathDocument, MathDocumentPage } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';
import DocumentContent from './DocumentContent';
import DocumentContentPreview from './DocumentContentPreview';
import FileDropZone from './FileDropZone';
import ImageColumn from './ImageColumn';
import NewPageDialog from './NewPageDialog';
import { uploadWebFiles, UploadProgress, UploadThingSignedUpload } from './uploadWebFiles';

interface DocumentEditorProps {
    documentId: string;
    userId: string;
    activePageId: string;
    onSetActivePageId: (pageId: string) => void;
}

const DocumentEditor = ({ documentId, userId, activePageId, onSetActivePageId }: DocumentEditorProps) => {
    const { executeCommand } = useUndoRedo();
    const createUndoSnapshot = useCreateUndoSnapshot();
    const { clearRecentlyCompletedForActivePage } = useGeneration();
    const scopedUserIds = userId ? [userId] : ['__loading__'];

    const [documentRecord] = useUserList<MathDocument>({
        key: 'mathDocuments',
        itemId: documentId,
    });
    const setPage = useUserListSet<MathDocumentPage>();
    const removePage = useUserListRemove();
    const generatePublicImageUploadUrl = useAction(api.uploadthing.generatePublicImageUploadUrl);
    const [isProcessingDrop, setIsProcessingDrop] = useState(false);
    const [dropStatus, setDropStatus] = useState('');
    const [dropProgress, setDropProgress] = useState<UploadProgress | null>(null);
    const [dropError, setDropError] = useState('');

    const pages = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: documentId,
        userIds: scopedUserIds,
        returnTop: 100,
    }) ?? [];

    const activePage = pages.find((page) => page.value.id === activePageId)?.value || null;

    useEffect(() => {
        // Don't reset during initial loading
        if (!pages[0] || activePageId !== '') {
            return;
        }

        // Only reset to empty if pages are explicitly empty (not loading)
        if (!pages.length) {
            onSetActivePageId('');
            return;
        }

        const hasActivePage = pages.some((page) => page.value.id === activePageId);

        if (!hasActivePage) {
            onSetActivePageId(pages[0].value.id);
        }
    }, [activePageId, pages, onSetActivePageId]);

    // Clear checkmark when active page changes
    useEffect(() => {
        if (activePageId) {
            clearRecentlyCompletedForActivePage(activePageId);
        }
    }, [activePageId, clearRecentlyCompletedForActivePage]);

    const replacePage = (nextPage: MathDocumentPage, _description: string) => {
        void setPage({
            key: 'mathDocumentPages',
            itemId: nextPage.id,
            value: nextPage,
            privacy: 'PUBLIC',
            filterKey: 'documentId',
            searchKeys: ['title', 'markdown'],
            sortKey: 'pageNumber',
        });
    };

    const replacePageWithUndo = (nextPage: MathDocumentPage, description: string) => {
        if (!activePage) return;
        
        const previousPage = createUndoSnapshot(activePage);
        const nextPageSnapshot = createUndoSnapshot(nextPage);

        executeCommand({
            action: () => replacePage(nextPage, description),
            undoAction: () => replacePage(previousPage, description),
            description: `${description} - ${activePage.title}`
        });
    };

    const handleKeepPreview = () => {
        if (!activePage || !previewMarkdown) return;
        
        const updatedPage = {
            ...activePage,
            markdown: previewMarkdown,
        };
        
        replacePageWithUndo(updatedPage, 'Replaced content with preview');
        setPreviewMarkdown('');
    };

    const handleDiscardPreview = () => {
        setPreviewMarkdown('');
    };

    const [previewMarkdown, setPreviewMarkdown] = useState("");

    const handleDroppedFiles = async (files: File[]) => {
        setDropError('');
        setDropStatus('Uploading files...');
        setDropProgress(null);
        setIsProcessingDrop(true);

        try {
            const uploadedFiles = await uploadWebFiles(
                files,
                (args) => generatePublicImageUploadUrl(args) as Promise<UploadThingSignedUpload>,
                setDropStatus,
                setDropProgress,
            );

            const readyFiles = uploadedFiles.filter((file) => file.uploadedUrl);
            if (!readyFiles.length) {
                throw new Error('No files were uploaded.');
            }

            // A single image dropped on an empty page fills that page's image
            if (readyFiles.length === 1 && activePage && !activePage.imageUrl) {
                replacePageWithUndo({ ...activePage, imageUrl: readyFiles[0].uploadedUrl! }, 'Updated page image');
                return;
            }

            const nextPageNumber = pages.reduce((max, page) => Math.max(max, page.value.pageNumber), 0) + 1;
            const pagesToCreate: MathDocumentPage[] = readyFiles.map((file, index) => ({
                id: generateId(),
                documentId,
                pageNumber: nextPageNumber + index,
                title: 'Page',
                imageUrl: file.uploadedUrl!,
                markdown: 'BLANK PAGE',
                lastAiPrompt: '',
                followUps: [],
            }));

            executeCommand({
                action: async () => {
                    await Promise.all(
                        pagesToCreate.map((page) =>
                            setPage({
                                key: 'mathDocumentPages',
                                itemId: page.id,
                                value: page,
                                privacy: 'PUBLIC',
                                filterKey: 'documentId',
                                searchKeys: ['title', 'markdown'],
                                sortKey: 'pageNumber',
                            }),
                        ),
                    );
                },
                undoAction: async () => {
                    await Promise.all(
                        pagesToCreate.map((page) =>
                            removePage({
                                key: 'mathDocumentPages',
                                itemId: page.id,
                            }),
                        ),
                    );
                },
                description: `Added ${pagesToCreate.length} page(s) via drag & drop`,
            });

            onSetActivePageId(pagesToCreate[0].id);
        } catch (error) {
            setDropError(error instanceof Error ? error.message : 'Failed to upload dropped files.');
        } finally {
            setIsProcessingDrop(false);
            setDropStatus('');
            setDropProgress(null);
        }
    };

    if (!documentRecord.value) {
        return (
            <Column className='flex-1 rounded-2xl border-2 border-border bg-inner-background p-6' gap={2}>
                <PoppinsText weight='bold' className='text-xl'>Loading document</PoppinsText>
                <PoppinsText>Fetching your selected document and pages…</PoppinsText>
            </Column>
        );
    }

    if (pages.length === 0) {
        return (
            <Column className='flex-1 items-center justify-center px-6'>
                <Column className='rounded-2xl border-2 border-border bg-inner-background p-6' gap={4} style={{ maxWidth: '400px' }}>
                    <Column gap={2}>
                        <PoppinsText weight='bold' className='text-xl'>No pages yet</PoppinsText>
                        <PoppinsText>Create the first page to convert handwritten notes to Markdown.</PoppinsText>
                    </Column>
                    <NewPageDialog documentId={documentId} existingPageCount={0} onCreate={onSetActivePageId} />
                </Column>
            </Column>
        );
    }

    return (
        <View className='flex-1 flex-col sm:flex-row gap-4'>
            <FileDropZone
                className='sm:flex-1'
                enabled={Platform.OS === 'web'}
                dropAnywhere
                isBusy={isProcessingDrop}
                busyLabel={dropStatus || 'Processing files...'}
                progress={dropProgress}
                overlayLabel='Drop an image or PDF to add pages'
                onFiles={(files) => void handleDroppedFiles(files)}
            >
                <View className='h-48 sm:h-full border-b border-subtle-border sm:border-0 -mb-4'>
                    <ImageColumn
                        page={activePage}
                        onImageChange={(url) => {
                            if (activePage) {
                                replacePageWithUndo({ ...activePage, imageUrl: url }, 'Updated page image');
                            }
                        }}
                    />
                </View>
                {dropError ? (
                    <View className='absolute bottom-2 left-0 right-0 items-center' pointerEvents='none'>
                        <PoppinsText className='text-red-500 text-sm bg-background px-3 py-1 rounded'>
                            {dropError}
                        </PoppinsText>
                    </View>
                ) : null}
            </FileDropZone>

            {activePage?.imageUrl && (
                <View className='flex-1 min-w-min sm:min-w-[400px] shrink-0 px-4 sm:pl-0'>
                    {previewMarkdown ? (
                        <DocumentContentPreview
                            documentId={documentId}
                            activePage={activePage}
                            text={previewMarkdown}
                            onKeep={handleKeepPreview}
                            onDiscard={handleDiscardPreview}
                        />
                    ) : (
                        <DocumentContent
                            documentTitle={documentRecord.value?.title ?? 'Untitled math document'}
                            documentId={documentId}
                            activePage={activePage}
                            onReplacePage={replacePage}
                            onDeletePage={(nextPageId) => onSetActivePageId(nextPageId)}
                            setPreviewMarkdown={setPreviewMarkdown}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

export default DocumentEditor;
