import React, { useState } from 'react';
import { Platform } from 'react-native';
import Column from '../layout/Column';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import FileDropZone from './FileDropZone';
import { useUserListSet } from 'hooks/useUserListSet';
import { MathDocument } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';

interface NewDocumentDialogProps {
    onCreate: (documentId: string) => void;
    buttonVariant?: 'black' | 'green';
    folderId?: string | null;
    /** Display name of the folder new documents land in (shown as button subtext). */
    folderName?: string;
    /** Dropping files while this dialog is open creates the document with the
     *  typed title, then hands the files back so the caller can open the new
     *  page dialog for them. */
    onFilesDropped?: (documentId: string, files: File[]) => void;
}

const NewDocumentDialog = ({ onCreate, buttonVariant = 'black', folderId = null, folderName = 'Main folder', onFilesDropped }: NewDocumentDialogProps) => {
    const setDocument = useUserListSet<MathDocument>();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const createDocument = async () => {
        const documentId = generateId();
        const now = Date.now();

        await setDocument({
            key: 'mathDocuments',
            itemId: documentId,
            value: {
                id: documentId,
                title: title.trim() || 'Untitled notes document',
                description: description.trim(),
                createdAt: now,
                lastOpenedAt: now,
                folderId,
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });

        return documentId;
    };

    const handleCreate = async () => {
        const documentId = await createDocument();
        setIsOpen(false);
        onCreate(documentId);
    };

    /** A drop mid-creation counts as "create with this title, then add pages". */
    const handleDroppedFiles = async (files: File[]) => {
        const documentId = await createDocument();
        setIsOpen(false);
        if (onFilesDropped) {
            onFilesDropped(documentId, files);
        } else {
            onCreate(documentId);
        }
    };

    const isValidTitle = title.trim().length > 0;

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
            <ConvexDialog.Trigger asChild>
                <AppButton variant={buttonVariant} className='h-12 px-5'>
                    <Column className='items-center' gap={0}>
                        <PoppinsText weight='medium' color='white' className='leading-tight'>New document</PoppinsText>
                        <PoppinsText color='white' className='text-[10px] leading-tight opacity-70'>in {folderName}</PoppinsText>
                    </Column>
                </AppButton>
            </ConvexDialog.Trigger>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <FileDropZone
                        enabled={Platform.OS === 'web' && isOpen}
                        dropAnywhere
                        overlayLabel='Drop files to create document with pages'
                        onFiles={(files) => void handleDroppedFiles(files)}
                    >
                    <Column>
                        <DialogHeader text='Create document' subtext='Start a new handwritten notes conversion document.' />
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
                            {isValidTitle ? (
                            <AppButton variant={buttonVariant} className='h-12' onPress={() => void handleCreate()}>
                                <PoppinsText weight='medium' color='white'>Create document</PoppinsText>
                            </AppButton>
                        ) : (
                            <StatusButton 
                                buttonText="Create document" 
                                buttonAltText="Add a title"
                                className="h-12 w-full"
                            />
                        )}
                        </Column>
                    </Column>
                    </FileDropZone>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default NewDocumentDialog;
