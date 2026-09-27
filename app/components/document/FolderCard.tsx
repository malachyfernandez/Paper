import React from 'react';
import { TouchableOpacity } from 'react-native';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { MathDocumentFolder } from 'types/mathDocuments';
import { ChevronRight, Folder, Pencil } from 'lucide-react-native';

interface FolderCardProps {
    folder: MathDocumentFolder;
    documentCount: number;
    onPress: () => void;
    onEdit: () => void;
}

const FolderCard = ({ folder, documentCount, onPress, onEdit }: FolderCardProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className='w-full rounded-2xl border border-subtle-border bg-inner-background p-5 shadow-sm hover:brightness-110'
        >
            <Row className='items-center justify-between'>
                <Row className='items-center gap-2 flex-1'>
                    <Folder size={18} className="text-accent" />
                    <PoppinsText weight='bold' className='text-xl flex-1'>
                        {folder.name}
                    </PoppinsText>
                    <PoppinsText varient='subtext'>
                        {documentCount} {documentCount === 1 ? 'document' : 'documents'}
                    </PoppinsText>
                </Row>

                <Row className='items-center gap-1'>
                    <TouchableOpacity onPress={onEdit} hitSlop={8} className='p-1.5'>
                        <Pencil size={16} className="text-subtext" />
                    </TouchableOpacity>
                    <ChevronRight size={20} className="text-subtext" />
                </Row>
            </Row>
        </TouchableOpacity>
    );
};

export default FolderCard;
