import React, { useState } from 'react';
import Column from '../layout/Column';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import { useUserListSet } from 'hooks/useUserListSet';
import { MathDocument } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';

interface NewDocumentDialogProps {
    onCreate: (documentId: string) => void;
    buttonVariant?: 'black' | 'green';
    folderId?: string | null;
}

const NewDocumentDialog = ({ onCreate, buttonVariant = 'black', folderId = null }: NewDocumentDialogProps) => {
    const setDocument = useUserListSet<MathDocument>();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = async () => {
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

        setIsOpen(false);
        onCreate(documentId);
    };

    const isValidTitle = title.trim().length > 0;

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
            <ConvexDialog.Trigger asChild>
                <AppButton variant={buttonVariant} className='h-12 px-5'>
                    <PoppinsText weight='medium' color='white'>New document</PoppinsText>
                </AppButton>
            </ConvexDialog.Trigger>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
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
                    
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default NewDocumentDialog;
