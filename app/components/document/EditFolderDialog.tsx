import React, { useEffect, useState } from 'react';
import Column from '../layout/Column';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import StatusButton from '../ui/StatusButton';
import { useUserListSet } from 'hooks/useUserListSet';
import { MathDocumentFolder } from 'types/mathDocuments';

interface EditFolderDialogProps {
    folder: MathDocumentFolder | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (folder: MathDocumentFolder) => void;
}

const EditFolderDialog = ({ folder, isOpen, onOpenChange, onDelete }: EditFolderDialogProps) => {
    const setFolder = useUserListSet<MathDocumentFolder>();
    const [name, setName] = useState(folder?.name ?? '');

    useEffect(() => {
        if (isOpen) {
            setName(folder?.name ?? '');
        }
    }, [folder, isOpen]);

    const handleSave = async () => {
        if (!folder) return;

        await setFolder({
            key: 'mathDocumentFolders',
            itemId: folder.id,
            value: {
                ...folder,
                name: name.trim() || folder.name,
            },
            privacy: 'PUBLIC',
            searchKeys: ['name'],
            sortKey: 'createdAt',
        });

        onOpenChange(false);
    };

    const isValidName = name.trim().length > 0;

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Edit folder' subtext='Rename or delete this folder. Deleting keeps the documents inside it.' />
                        <Column className='pt-5' gap={3}>
                            <Column gap={1}>
                                <PoppinsText weight='medium'>Name</PoppinsText>
                                <PoppinsTextInput value={name} onChangeText={setName} className='w-full border border-subtle-border bg-inner-background p-3' placeholder='Folder name' />
                            </Column>
                            <Column gap={2}>
                                {isValidName ? (
                                    <AppButton variant='black' className='h-12' onPress={() => void handleSave()}>
                                        <PoppinsText weight='medium' color='white'>Save changes</PoppinsText>
                                    </AppButton>
                                ) : (
                                    <StatusButton
                                        buttonText="Save changes"
                                        buttonAltText="Add a name"
                                        className="h-12 w-full"
                                    />
                                )}
                                {folder && (
                                    <AppButton variant='red' className='h-12' onPress={() => onDelete(folder)}>
                                        <PoppinsText weight='medium' color='red'>Delete folder</PoppinsText>
                                    </AppButton>
                                )}
                            </Column>
                        </Column>
                    </Column>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default EditFolderDialog;
