import React, { useState } from 'react';
import Column from '../layout/Column';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import { useUserListSet } from 'hooks/useUserListSet';
import { MathDocumentFolder } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';
import { FolderPlus } from 'lucide-react-native';

interface NewFolderDialogProps {
    onCreate?: (folderId: string) => void;
}

const NewFolderDialog = ({ onCreate }: NewFolderDialogProps) => {
    const setFolder = useUserListSet<MathDocumentFolder>();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');

    const handleCreate = async () => {
        const folderId = generateId();

        await setFolder({
            key: 'mathDocumentFolders',
            itemId: folderId,
            value: {
                id: folderId,
                name: name.trim() || 'Untitled folder',
                createdAt: Date.now(),
            },
            privacy: 'PUBLIC',
            searchKeys: ['name'],
            sortKey: 'createdAt',
        });

        setName('');
        setIsOpen(false);
        onCreate?.(folderId);
    };

    const isValidName = name.trim().length > 0;

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
            <ConvexDialog.Trigger asChild>
                <AppButton variant='outline-alt' className='h-12 px-5'>
                    <FolderPlus size={18} className='text-text' />
                    <PoppinsText weight='medium'>New folder</PoppinsText>
                </AppButton>
            </ConvexDialog.Trigger>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Create folder' subtext='Organize documents into a folder.' />
                        <Column className='pt-5' gap={3}>
                            <Column gap={1}>
                                <PoppinsText weight='medium'>Name</PoppinsText>
                                <PoppinsTextInput value={name} onChangeText={setName} className='w-full border border-subtle-border bg-inner-background p-3' placeholder='Folder name' />
                            </Column>
                            {isValidName ? (
                                <AppButton variant='green' className='h-12' onPress={() => void handleCreate()}>
                                    <PoppinsText weight='medium' color='white'>Create folder</PoppinsText>
                                </AppButton>
                            ) : (
                                <StatusButton
                                    buttonText="Create folder"
                                    buttonAltText="Add a name"
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

export default NewFolderDialog;
