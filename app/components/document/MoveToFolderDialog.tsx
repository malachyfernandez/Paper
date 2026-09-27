import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import { useUserListSet } from 'hooks/useUserListSet';
import { MathDocument, MathDocumentFolder } from 'types/mathDocuments';
import { generateId } from 'utils/generateId';
import { Check, Folder, Home } from 'lucide-react-native';

interface MoveToFolderDialogProps {
    document: MathDocument | null;
    folders: MathDocumentFolder[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const MoveToFolderDialog = ({ document, folders, isOpen, onOpenChange }: MoveToFolderDialogProps) => {
    const setDocument = useUserListSet<MathDocument>();
    const setFolder = useUserListSet<MathDocumentFolder>();
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNewFolderName('');
        }
    }, [isOpen]);

    const moveDocument = async (folderId: string | null) => {
        if (!document) return;

        await setDocument({
            key: 'mathDocuments',
            itemId: document.id,
            value: {
                ...document,
                folderId,
            },
            privacy: 'PUBLIC',
            searchKeys: ['title', 'description'],
            sortKey: 'lastOpenedAt',
        });

        onOpenChange(false);
    };

    const handleCreateAndMove = async () => {
        if (!document || !newFolderName.trim()) return;

        const folderId = generateId();
        await setFolder({
            key: 'mathDocumentFolders',
            itemId: folderId,
            value: {
                id: folderId,
                name: newFolderName.trim(),
                createdAt: Date.now(),
            },
            privacy: 'PUBLIC',
            searchKeys: ['name'],
            sortKey: 'createdAt',
        });

        await moveDocument(folderId);
    };

    const currentFolderId = document?.folderId ?? null;

    const renderRow = (key: string, label: string, icon: React.ReactNode, isCurrent: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={key}
            onPress={onPress}
            activeOpacity={0.8}
            className={`w-full rounded-xl border p-4 ${isCurrent ? 'border-accent bg-accent/10' : 'border-subtle-border bg-inner-background'} hover:brightness-110`}
        >
            <Row className='items-center justify-between'>
                <Row className='items-center gap-2 flex-1'>
                    {icon}
                    <PoppinsText weight='medium' className='flex-1'>{label}</PoppinsText>
                </Row>
                {isCurrent && <Check size={18} className='text-accent' />}
            </Row>
        </TouchableOpacity>
    );

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Move to folder' subtext={document ? `Choose where "${document.title}" lives.` : 'Choose a folder.'} />
                        <Column className='pt-5' gap={4}>
                            <ScrollView className='max-h-64' showsVerticalScrollIndicator={false}>
                                <Column gap={2}>
                                    {renderRow(
                                        '__none__',
                                        'No folder',
                                        <Home size={18} className='text-subtext' />,
                                        currentFolderId === null,
                                        () => void moveDocument(null),
                                    )}
                                    {folders.map((folder) =>
                                        renderRow(
                                            folder.id,
                                            folder.name,
                                            <Folder size={18} className='text-accent' />,
                                            currentFolderId === folder.id,
                                            () => void moveDocument(folder.id),
                                        ),
                                    )}
                                </Column>
                            </ScrollView>

                            <Column gap={2}>
                                <PoppinsText weight='medium'>Or create a new folder</PoppinsText>
                                <Row gap={2} className='items-center'>
                                    <PoppinsTextInput
                                        value={newFolderName}
                                        onChangeText={setNewFolderName}
                                        className='flex-1 border border-subtle-border bg-inner-background p-3'
                                        placeholder='New folder name'
                                    />
                                    {newFolderName.trim().length > 0 && (
                                        <AppButton variant='green' className='h-12 px-4' onPress={() => void handleCreateAndMove()}>
                                            <PoppinsText weight='medium' color='white'>Create & move</PoppinsText>
                                        </AppButton>
                                    )}
                                </Row>
                            </Column>
                        </Column>
                    </Column>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default MoveToFolderDialog;
