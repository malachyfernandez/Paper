import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, ActivityIndicator, View, ScrollView, Platform, Pressable } from 'react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import SimpleFileUpload from './SimpleFileUpload';
import FileUrlModal from './FileUrlModal';
import { uploadWebFiles, UploadThingSignedUpload } from './uploadWebFiles';
import { useUserListSet } from 'hooks/useUserListSet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useUserVariable } from 'hooks/useUserVariable';
import { useCreateUndoSnapshot, useUndoRedo } from 'hooks/useUndoRedo';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGeneration } from '../../../contexts/GenerationContext';
import { MathDocumentPage } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';

interface DraftPage {
    id: string;
    pageIndex: number;
    previewUrl: string;
    uploadedUrl?: string;
    status: 'processing' | 'uploading' | 'ready' | 'error';
    error?: string;
}

interface NewPageDialogProps {
    documentId: string;
    existingPageCount: number;
    onCreate: (pageId: string) => void;
    triggerButtonVariant?: 'black' | 'green';
    createButtonVariant?: 'black' | 'green';
}

const NewPageDialog = ({ documentId, existingPageCount, onCreate, triggerButtonVariant = 'green', createButtonVariant = 'green' }: NewPageDialogProps) => {
    const { executeCommand } = useUndoRedo();
    const createUndoSnapshot = useCreateUndoSnapshot();
    const setPage = useUserListSet<MathDocumentPage>();
    const removePage = useUserListRemove();
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const generatePublicImageUploadUrl = useAction(api.uploadthing.generatePublicImageUploadUrl);
    const { setGeneratingPage, isPageGenerating } = useGeneration();
    const [isOpen, setIsOpen] = useState(false);
    const nextPageNumber = existingPageCount + 1;
    const [titleInput, setTitleInput] = useState('Page');
    const [draftPages, setDraftPages] = useState<DraftPage[]>([]);
    const [sourceKind, setSourceKind] = useState<'image' | 'pdf' | null>(null);
    const [isFileUrlModalOpen, setIsFileUrlModalOpen] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [createdPages, setCreatedPages] = useState<MathDocumentPage[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isDragActive, setIsDragActive] = useState(false);
    const dropZoneRef = useRef<any>(null);

    // Get user-wide AI guidance
    const [aiGuidance] = useUserVariable({
        key: 'aiGuidance',
        defaultValue: 'Convert this handwritten notes to Markdown with LaTeX support.',
        privacy: 'PRIVATE'
    });

    const handleFilesReady = async (files: Array<{ id: string; previewUrl: string; file: File; uploadedUrl?: string }>) => {
        try {
            setIsProcessingFile(true);
            setStatusMessage('Processing files...');
            setErrorMessage('');

            const newDraftPages: DraftPage[] = files.map((file, index) => ({
                id: file.id,
                pageIndex: index,
                previewUrl: file.previewUrl,
                uploadedUrl: file.uploadedUrl,
                status: file.uploadedUrl ? 'ready' : 'processing',
            }));

            setDraftPages(newDraftPages);
            setSourceKind(files.length === 1 ? 'image' : 'pdf');
            setStatusMessage('');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to process files.');
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleDroppedFiles = useCallback(async (files: File[]) => {
        try {
            setIsProcessingFile(true);
            setStatusMessage('Uploading files...');
            setErrorMessage('');

            const uploadedFiles = await uploadWebFiles(
                files,
                (args) => generatePublicImageUploadUrl(args) as Promise<UploadThingSignedUpload>,
                setStatusMessage,
            );

            await handleFilesReady(uploadedFiles);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to upload dropped files.');
            setStatusMessage('');
        } finally {
            setIsProcessingFile(false);
        }
    }, [generatePublicImageUploadUrl]);

    // Attach drag & drop listeners to the dialog body (web only)
    useEffect(() => {
        if (Platform.OS !== 'web' || !isOpen) {
            return;
        }

        const node = dropZoneRef.current as HTMLElement | null;
        if (!node || typeof node.addEventListener !== 'function') {
            return;
        }

        const handleDragOver = (event: DragEvent) => {
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
            setIsDragActive(true);
        };

        const handleDragLeave = (event: DragEvent) => {
            event.preventDefault();
            if (event.relatedTarget && node.contains(event.relatedTarget as Node)) {
                return;
            }
            setIsDragActive(false);
        };

        const handleDrop = (event: DragEvent) => {
            event.preventDefault();
            setIsDragActive(false);

            const files = Array.from(event.dataTransfer?.files ?? []);
            if (files.length) {
                void handleDroppedFiles(files);
            }
        };

        node.addEventListener('dragover', handleDragOver);
        node.addEventListener('dragenter', handleDragOver);
        node.addEventListener('dragleave', handleDragLeave);
        node.addEventListener('drop', handleDrop);

        return () => {
            node.removeEventListener('dragover', handleDragOver);
            node.removeEventListener('dragenter', handleDragOver);
            node.removeEventListener('dragleave', handleDragLeave);
            node.removeEventListener('drop', handleDrop);
        };
    }, [isOpen, handleDroppedFiles]);

    const revokePreviewUrl = (url: string) => {
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    };

    const removeDraftPage = (pageId: string) => {
        setDraftPages(prev => {
            const page = prev.find(p => p.id === pageId);
            if (page) {
                revokePreviewUrl(page.previewUrl);
            }
            return prev.filter(p => p.id !== pageId);
        });
    };

    const resetDialog = () => {
        draftPages.forEach(page => revokePreviewUrl(page.previewUrl));
        setDraftPages([]);
        setSourceKind(null);
        setTitleInput('Page');
        setErrorMessage('');
        setStatusMessage('');
    };

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            resetDialog();
        }
    }, [isOpen, nextPageNumber]);

    // Ensure modal states are properly closed when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setIsFileUrlModalOpen(false);
            setIsProcessingFile(false);
        }
    }, [isOpen]);

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            draftPages.forEach(page => revokePreviewUrl(page.previewUrl));
        };
    }, [draftPages]);

    const handleCreate = async (startGeneration: boolean = false) => {
        const readyPages = draftPages.filter(page => page.status === 'ready');
        
        const pagesToCreate = readyPages.map((draft, index) => {
            const pageNumber = nextPageNumber + index;

            const title = titleInput.trim() || 'Page';

            return {
                id: generateId(),
                documentId,
                pageNumber,
                title, // Store just the title, no number
                imageUrl: draft.uploadedUrl!,
                markdown: startGeneration ? '' : 'BLANK PAGE',
                lastAiPrompt: '',
                followUps: [],
            } satisfies MathDocumentPage;
        });

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
            description: `Created ${pagesToCreate.length} page(s)`,
        });

        // Close dialog immediately and navigate to the first created page
        setIsOpen(false);
        resetDialog();
        onCreate(pagesToCreate[0].id);

        if (startGeneration && pagesToCreate.length > 0) {
            // Start generation in the background after dialog is closed
            setCreatedPages(pagesToCreate);
            setIsGenerating(true);
            setErrorMessage('');

            // Generate pages in parallel
            const generationPromises = pagesToCreate.map(async (page) => {
                try {
                    setGeneratingPage(page.id, true);

                    const result = await convertMathImageToMarkdown({
                        imageUrl: page.imageUrl,
                        guidance: aiGuidance.value,
                        currentMarkdown: '',
                        documentTitle: '', // You might want to pass document title here
                        pageTitle: '', // Removed page title from generation
                    });

                    const updatedPage: MathDocumentPage = {
                        ...page,
                        markdown: result.markdown,
                        lastAiPrompt: aiGuidance.value,
                        lastGeneratedAt: Date.now(),
                    };

                    executeCommand({
                        action: async () => {
                            await setPage({
                                key: 'mathDocumentPages',
                                itemId: page.id,
                                value: updatedPage,
                                privacy: 'PUBLIC',
                                filterKey: 'documentId',
                                searchKeys: ['title', 'markdown'],
                                sortKey: 'pageNumber',
                            });
                        },
                        undoAction: async () => {
                            await setPage({
                                key: 'mathDocumentPages',
                                itemId: page.id,
                                value: page,
                                privacy: 'PUBLIC',
                                filterKey: 'documentId',
                                searchKeys: ['title', 'markdown'],
                                sortKey: 'pageNumber',
                            });
                        },
                        description: `Generated AI content for page - ${updatedPage.title}`
                    });

                    return { success: true, pageId: page.id };
                } catch (error) {
                    setErrorMessage(error instanceof Error ? error.message : 'AI conversion failed.');
                    return { success: false, pageId: page.id, error };
                } finally {
                    setGeneratingPage(page.id, false);
                }
            });

            // Wait for all generations to complete
            const results = await Promise.all(generationPromises);
            
            // Log results
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            if (failed > 0) {
                console.log(`🔍 [AI_DEBUG] Generation completed: ${successful} successful, ${failed} failed`);
            } else {
                console.log(`✅ [AI_DEBUG] All ${successful} pages generated successfully`);
            }
        }
    };

    const readyPages = draftPages.filter((page) => page.status === 'ready');
    const hasPages = readyPages.length > 0;
    const isStillProcessing = draftPages.some(
        (page) => page.status === 'processing' || page.status === 'uploading',
    );

    const canCreate = hasPages && !isStillProcessing;

    // Helper function to render page title with number
    const renderPageTitle = (title: string, pageNumber: number) => {
        return `${title} - ${pageNumber}`;
    };

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
            <ConvexDialog.Trigger asChild>
                <AppButton variant={triggerButtonVariant} className='h-12 px-5'>
                    <PoppinsText weight='medium' color='white'>Add pages</PoppinsText>
                </AppButton>
            </ConvexDialog.Trigger>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Add Pages' subtext='Create one or more pages for your document.' />
                        <Column ref={dropZoneRef} className='pt-5' gap={4}>

                            <Column gap={1}>
                                <PoppinsText weight='medium'>
                                    {draftPages.length === 1 ? 'Title' : 'Title prefix (optional)'}
                                </PoppinsText>
                                <PoppinsTextInput 
                                    value={titleInput} 
                                    onChangeText={setTitleInput} 
                                    className='w-full border border-subtle-border bg-inner-background p-3' 
                                    placeholder={draftPages.length === 1 ? 'Page' : 'Homework 7'} 
                                />
                            </Column>

                            <Column gap={1}>
                                <PoppinsText weight='medium'>Files</PoppinsText>

                                <Row gap={2}>
                                    <View className='flex-1'>
                                        <SimpleFileUpload
                                            onFilesReady={handleFilesReady}
                                            buttonLabel='Upload File'
                                            className='w-full'
                                        />
                                    </View>
                                    <View className='flex-1'>
                                        <AppButton
                                            variant='outline-alt'
                                            className='h-12 w-full'
                                            onPress={() => setIsFileUrlModalOpen(true)}
                                            disabled={Platform.OS !== 'web'}
                                        >
                                            <PoppinsText weight='medium'>
                                                {Platform.OS === 'web' ? 'Use File URL' : 'URL (Web only)'}
                                            </PoppinsText>
                                        </AppButton>
                                    </View>
                                </Row>
                            </Column>

                            <Column gap={1}>
                                <PoppinsText weight='medium'>Preview</PoppinsText>
                                
                                <View className={`w-full h-56 rounded-lg border bg-background overflow-hidden relative ${isDragActive ? 'border-2 border-dashed border-blue-500' : 'border-subtle-border'}`}>
                                    {draftPages.length === 1 ? (
                                        <View className='flex-1 items-center justify-center p-3'>
                                            <Image
                                                source={{ uri: draftPages[0].previewUrl }}
                                                className='w-full h-full'
                                                resizeMode='contain'
                                            />
                                        </View>
                                    ) : draftPages.length > 1 ? (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            className='h-full'
                                            contentContainerStyle={{ padding: 12, gap: 12 }}
                                        >
                                            {draftPages.map((page, index) => (
                                                <View
                                                    key={page.id}
                                                    className='w-36 h-full rounded-lg border border-subtle-border bg-inner-background overflow-hidden relative'
                                                >
                                                    <Image
                                                        source={{ uri: page.previewUrl }}
                                                        className='w-full h-full'
                                                        resizeMode='cover'
                                                    />

                                                    <Pressable
                                                        className='absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 items-center justify-center border border-subtle-border'
                                                        onPress={() => removeDraftPage(page.id)}
                                                    >
                                                        <PoppinsText weight='bold'>−</PoppinsText>
                                                    </Pressable>

                                                    <View className='absolute bottom-0 left-0 right-0 px-2 py-2 bg-linear-to-t from-background to-transparent'>
                                                        <PoppinsText varient='subtext' className='text-xs text-center'>
                                                            {renderPageTitle('Page', nextPageNumber + index)}
                                                        </PoppinsText>
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        <View className='flex-1 items-center justify-center p-4'>
                                            <PoppinsText varient='subtext' className='text-center'>
                                                {Platform.OS === 'web'
                                                    ? 'Upload an image or PDF to get started, or drag & drop files here'
                                                    : 'Upload an image or PDF to get started'}
                                            </PoppinsText>
                                        </View>
                                    )}

                                    {isDragActive && (
                                        <View className='absolute inset-0 items-center justify-center bg-blue-500/10' pointerEvents='none'>
                                            <PoppinsText weight='medium' className='text-blue-500'>
                                                Drop files to add pages
                                            </PoppinsText>
                                        </View>
                                    )}
                                </View>
                            </Column>

                            {statusMessage && (
                                <PoppinsText className='text-blue-500 text-center'>{statusMessage}</PoppinsText>
                            )}

                            {/* Buttons */}
                            <Row gap={3} className='w-full items-center justify-between'>
                                {canCreate ? (
                                    <>
                                        <AppButton variant='outline-alt' className='h-12 max-w-[150px] w-full' onPress={() => void handleCreate(false)}>
                                            <PoppinsText weight='medium'>
                                                {draftPages.length === 1 ? 'No Generation' : `${draftPages.length} Blank Pages`}
                                            </PoppinsText>
                                        </AppButton>
                                        <AppButton variant={createButtonVariant} className='h-12 flex-1' onPress={() => void handleCreate(true)}>
                                            <PoppinsText weight='medium' color='white'>
                                                {draftPages.length === 1 ? 'Generate Page →' : `Generate ${draftPages.length} Pages →`}
                                            </PoppinsText>
                                        </AppButton>
                                    </>
                                ) : (
                                    <StatusButton
                                        buttonText="Create pages"
                                        buttonAltText={!hasPages ? "Upload files first" : "Processing files..."}
                                        className="h-12 w-full"
                                    />
                                )}
                            </Row>

                            {errorMessage ? (
                                <PoppinsText className='text-red-500 text-sm text-center'>{errorMessage}</PoppinsText>
                            ) : null}
                        </Column>
                    </Column>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>

            <FileUrlModal
                isOpen={isFileUrlModalOpen}
                onOpenChange={setIsFileUrlModalOpen}
                onFilesReady={handleFilesReady}
            />
        </ConvexDialog.Root>
    );
};

export default NewPageDialog;
