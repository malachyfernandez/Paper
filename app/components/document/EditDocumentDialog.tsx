import React, { useEffect, useState } from 'react';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import { RefreshCw } from 'lucide-react-native';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserListSet } from 'hooks/useUserListSet';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserListRemove } from 'hooks/useUserListRemove';
import { useAiGuidance } from 'hooks/useAiGuidance';
import { useAppAuth } from '../../../contexts/AppAuthContext';
import { MathDocument, MathDocumentPage } from 'types/mathDocuments';

interface EditDocumentDialogProps {
    document: MathDocument;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
}

const EditDocumentDialog = ({ document, isOpen, onOpenChange, onDelete }: EditDocumentDialogProps) => {
    const setDocument = useUserListSet<MathDocument>();
    const removeDocument = useUserListRemove();
    const [title, setTitle] = useState(document.title);
    const [description, setDescription] = useState(document.description);
    const [aiGuidance, setAiGuidance] = useState(document.aiGuidance ?? '');
    // Resolved fallback (account default) — shown as the field's placeholder.
    const accountGuidance = useAiGuidance();
    const [regenState, setRegenState] = useState<'idle' | 'confirm' | 'running' | 'done'>('idle');
    const [regenProgress, setRegenProgress] = useState({ done: 0, total: 0 });
    const [regenFailures, setRegenFailures] = useState(0);

    const { user } = useAppAuth();
    const convertMathImageToMarkdown = useAction(api.mathAi.convertMathImageToMarkdown);
    const setPage = useUserListSet<MathDocumentPage>();
    const pageRecords = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: document.id,
        userIds: user?.userId ? [user.userId] : ['__loading__'],
        returnTop: 100,
    });
    const regenerablePages = (pageRecords ?? [])
        .map((record) => record.value)
        .filter((page) => page.imageUrl)
        .sort((a, b) => a.pageNumber - b.pageNumber);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setTitle(document.title);
        setDescription(document.description);
        setAiGuidance(document.aiGuidance ?? '');
        setRegenState('idle');
        setRegenProgress({ done: 0, total: 0 });
        setRegenFailures(0);
    }, [document, isOpen]);

    const handleSave = async () => {
        await setDocument({
            key: 'mathDocuments',
            itemId: document.id,
            value: {
                ...document,
                title: title.trim() || document.title,
                description: description.trim(),
                aiGuidance: aiGuidance.trim() || undefined,
                lastOpenedAt: document.lastOpenedAt,
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });

        onOpenChange(false);
    };

    const handleDelete = async () => {
        await removeDocument({
            key: 'mathDocuments',
            itemId: document.id,
        });
        onDelete();
        onOpenChange(false);
    };

    const isValidTitle = title.trim().length > 0;

    const handleRegenerateAll = async () => {
        const guidance = aiGuidance.trim() || accountGuidance;
        const pages = regenerablePages;
        const documentTitle = title.trim() || document.title;

        setRegenState('running');
        setRegenProgress({ done: 0, total: pages.length });
        setRegenFailures(0);

        let failures = 0;
        await Promise.all(
            pages.map(async (page) => {
                try {
                    const result = await convertMathImageToMarkdown({
                        imageUrl: page.imageUrl,
                        guidance,
                        documentTitle,
                        pageTitle: page.title || `Page ${page.pageNumber}`,
                    });

                    await setPage({
                        key: 'mathDocumentPages',
                        itemId: page.id,
                        value: {
                            ...page,
                            markdown: result.markdown,
                            lastAiPrompt: guidance,
                            lastGeneratedAt: Date.now(),
                        },
                        privacy: 'PUBLIC',
                        filterKey: 'documentId',
                        searchKeys: ['title', 'markdown'],
                        sortKey: 'pageNumber',
                    });
                } catch {
                    failures += 1;
                    setRegenFailures(failures);
                } finally {
                    setRegenProgress((current) => ({ ...current, done: current.done + 1 }));
                }
            }),
        );

        setRegenState('done');
    };

    const regenLabel = () => {
        if (regenState === 'running') {
            return `Regenerating… ${regenProgress.done}/${regenProgress.total}`;
        }
        if (regenState === 'done') {
            return regenFailures > 0
                ? `Done — ${regenProgress.total - regenFailures} regenerated, ${regenFailures} failed`
                : `Done — ${regenProgress.total} page${regenProgress.total === 1 ? '' : 's'} regenerated`;
        }
        if (regenState === 'confirm') {
            return `Confirm regenerate ${regenerablePages.length} page${regenerablePages.length === 1 ? '' : 's'}?`;
        }
        return `Regenerate all pages (${regenerablePages.length})`;
    };

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Edit document' subtext='Update your document details.' />
                        <Column className='pt-5' gap={3}>
                            <Column gap={1}>
                                <PoppinsText weight='medium'>Title</PoppinsText>
                                <PoppinsTextInput value={title} onChangeText={setTitle} className='w-full border border-subtle-border bg-inner-background p-3' placeholder='Document title' />
                            </Column>
                            <Column gap={1}>
                                <PoppinsText weight='medium'>Description</PoppinsText>
                                <PoppinsTextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    className='w-full border border-subtle-border bg-inner-background p-3 min-h-28'
                                    multiline={true}
                                    autoGrow={true}
                                    placeholder='Optional description'
                                />
                            </Column>
                            <Column gap={1}>
                                <PoppinsText weight='medium'>AI conversion guidance</PoppinsText>
                                <PoppinsTextInput
                                    value={aiGuidance}
                                    onChangeText={setAiGuidance}
                                    className='w-full border border-subtle-border bg-inner-background p-3 min-h-20'
                                    multiline={true}
                                    autoGrow={true}
                                    placeholder={accountGuidance}
                                />
                                <PoppinsText varient='subtext' className='text-xs'>
                                    Instructions for this document only. Leave empty to use your account default.
                                </PoppinsText>
                            </Column>
                            <Column gap={1}>
                                <AppButton
                                    variant={regenState === 'confirm' ? 'red' : 'outline-alt'}
                                    className='h-11'
                                    disabled={regenState === 'running' || regenerablePages.length === 0}
                                    onPress={() => {
                                        if (regenState === 'idle' || regenState === 'done') {
                                            setRegenState('confirm');
                                        } else if (regenState === 'confirm') {
                                            void handleRegenerateAll();
                                        }
                                    }}
                                >
                                    <Row className='items-center' gap={2}>
                                        <RefreshCw size={14} className={regenState === 'confirm' ? 'text-red-500' : 'text-text'} />
                                        <PoppinsText weight='medium' color={regenState === 'confirm' ? 'red' : 'black'} className='text-sm'>
                                            {regenLabel()}
                                        </PoppinsText>
                                    </Row>
                                </AppButton>
                                {regenState === 'idle' && regenerablePages.length === 0 ? (
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        Add pages with images to enable regeneration.
                                    </PoppinsText>
                                ) : (
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        {regenState === 'confirm'
                                            ? 'This overwrites the current markdown of every page with an image.'
                                            : 'Re-runs AI conversion on every page using the guidance above.'}
                                    </PoppinsText>
                                )}
                            </Column>
                            <Column gap={2}>
                                {isValidTitle ? (
                                    <AppButton variant='black' className='h-12' onPress={() => void handleSave()}>
                                        <PoppinsText weight='medium' color='white'>Save changes</PoppinsText>
                                    </AppButton>
                                ) : (
                                    <StatusButton 
                                        buttonText="Save changes" 
                                        buttonAltText="Add a title"
                                        className="h-12 w-full"
                                    />
                                )}
                                <AppButton variant='red' className='h-12' onPress={handleDelete}>
                                    <PoppinsText weight='medium' color='red'>Delete document</PoppinsText>
                                </AppButton>
                            </Column>
                        </Column>
                    </Column>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default EditDocumentDialog;
