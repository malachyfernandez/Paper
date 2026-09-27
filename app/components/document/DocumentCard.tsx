import React from 'react';
import { TouchableOpacity } from 'react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { MathDocument } from 'types/mathDocuments';
import { FileText, Calendar, ChevronRight, StickyNote, Pin, FolderInput, Folder } from 'lucide-react-native';
import { useUserListLength } from 'hooks/useUserListLength';

interface DocumentCardProps {
    document: MathDocument;
    folderName?: string;
    onPress: () => void;
    onTogglePin?: () => void;
    onMoveToFolder?: () => void;
}

const DocumentCard = ({ document, folderName, onPress, onTogglePin, onMoveToFolder }: DocumentCardProps) => {
    const lastOpenedLabel = new Date(document.lastOpenedAt).toLocaleDateString();
    const isPinned = Boolean(document.pinnedAt);

    // Get page count for this specific document
    const pageCount = useUserListLength({
        key: 'mathDocumentPages',
        filterFor: document.id,
    }) ?? 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className={`w-full rounded-2xl border bg-inner-background p-5 shadow-sm hover:brightness-110 ${isPinned ? 'border-accent' : 'border-subtle-border'}`}
        >
            <Row className='items-center justify-between'>
                <Column className='flex-1 gap-2'>
                    <Row className='items-center gap-2'>
                        <FileText size={18} className="text-accent" />
                        <PoppinsText weight='bold' className='text-xl flex-1'>
                            {document.title}
                        </PoppinsText>
                    </Row>

                    {document.description && (
                        <PoppinsText className='text-subtext ml-6'>{document.description}</PoppinsText>
                    )}

                    <Row className='items-center gap-4 ml-6'>
                        <Row className='items-center gap-1' gap={2}>
                            <StickyNote size={14} className="text-subtext" />
                            <PoppinsText varient='subtext'>
                                {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                            </PoppinsText>
                        </Row>

                        <Row className='items-center gap-1' gap={2}>
                            <Calendar size={14} className="text-subtext" />
                            <PoppinsText varient='subtext'>Last opened {lastOpenedLabel}</PoppinsText>
                        </Row>

                        {folderName ? (
                            <Row className='items-center gap-1' gap={2}>
                                <Folder size={14} className="text-subtext" />
                                <PoppinsText varient='subtext'>{folderName}</PoppinsText>
                            </Row>
                        ) : null}
                    </Row>
                </Column>

                <Row className='items-center gap-1'>
                    {onTogglePin && (
                        <TouchableOpacity onPress={onTogglePin} hitSlop={8} className='p-1.5'>
                            <Pin
                                size={16}
                                className={isPinned ? 'text-accent' : 'text-subtext'}
                                fill={isPinned ? 'currentColor' : 'none'}
                            />
                        </TouchableOpacity>
                    )}
                    {onMoveToFolder && (
                        <TouchableOpacity onPress={onMoveToFolder} hitSlop={8} className='p-1.5'>
                            <FolderInput size={16} className="text-subtext" />
                        </TouchableOpacity>
                    )}
                    <ChevronRight size={20} className="text-subtext" />
                </Row>
            </Row>
        </TouchableOpacity>
    );
};

export default DocumentCard;
