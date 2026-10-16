import React from 'react';
import { Pressable, TouchableOpacity } from 'react-native';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { MathDocumentFolder } from 'types/mathDocuments';
import { ChevronDown, ChevronRight, Folder, Pencil } from 'lucide-react-native';
import IconButton from '../ui/buttons/IconButton';

interface FolderCardProps {
    folder: MathDocumentFolder;
    documentCount: number;
    folderCount?: number;
    /** When provided, renders a disclosure triangle that expands the folder in place. */
    expanded?: boolean;
    onToggleExpand?: () => void;
    onPress: () => void;
    onEdit: () => void;
}

const FolderCard = ({ folder, documentCount, folderCount = 0, expanded = false, onToggleExpand, onPress, onEdit }: FolderCardProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className='w-full rounded-2xl border border-subtle-border bg-inner-background p-5 shadow-sm hover:brightness-110'
        >
            <Row className='items-center justify-between'>
                <Row className='items-center gap-2 flex-1'>
                    {onToggleExpand && (
                        <Pressable
                            accessibilityLabel={expanded ? 'Collapse folder' : 'Expand folder'}
                            onPress={(e) => {
                                e.stopPropagation?.();
                                onToggleExpand();
                            }}
                            className='-ml-1 h-6 w-6 items-center justify-center rounded-md hover:bg-text/10'
                        >
                            {expanded ? (
                                <ChevronDown size={14} className='text-text' />
                            ) : (
                                <ChevronRight size={14} className='text-text' />
                            )}
                        </Pressable>
                    )}
                    <Folder size={18} className="text-accent" />
                    <PoppinsText weight='bold' className='text-xl flex-1' numberOfLines={1}>
                        {folder.name}
                    </PoppinsText>
                    <PoppinsText varient='subtext'>
                        {documentCount} {documentCount === 1 ? 'document' : 'documents'}
                        {folderCount > 0 ? `, ${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}` : ''}
                    </PoppinsText>
                </Row>

                <Row className='items-center gap-1'>
                    <IconButton onPress={onEdit} tooltip='Edit folder'>
                        <Pencil size={16} className="text-subtext" />
                    </IconButton>
                    <ChevronRight size={20} className="text-subtext" />
                </Row>
            </Row>
        </TouchableOpacity>
    );
};

export default FolderCard;
