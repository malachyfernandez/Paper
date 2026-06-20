import React from 'react';
import { View } from 'react-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import StatusIconButton from '../ui/StatusIconButton';
import { MathDocumentPage } from 'types/mathDocuments';
import ChevronUpIcon from '../ui/icons/ChevronUpIcon';
import ChevronDownIcon from '../ui/icons/ChevronDownIcon';
import PageThumbnail from './PageThumbnail';

interface ReorderablePageItemProps {
    page: MathDocumentPage;
    index: number;
    totalCount: number;
    isAnimating: boolean;
    onPress: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const renderPageTitle = (title: string, pageNumber: number) => {
    return `${title} - ${pageNumber}`;
};

const ReorderablePageItem = ({ 
    page, 
    index, 
    totalCount, 
    isAnimating, 
    onPress, 
    onMoveUp, 
    onMoveDown 
}: ReorderablePageItemProps) => {
    return (
        <View
            className={`border border-subtle-border bg-inner-background rounded-xl p-3 w-full transition-all duration-100 ease-in-out ${
                isAnimating ? 'scale-55 opacity-70' : ''
            }`}
        >
            <Row className='items-center w-full justify-between'>
                <Row gap={2}>
                    {index > 0 ? (
                        <AppButton variant='none' className='h-10 w-10' onPress={onMoveUp}>
                            <ChevronUpIcon size={24} color="black" />
                        </AppButton>
                    ) : (
                        <StatusIconButton
                            icon={<ChevronUpIcon size={20} color="white" />}
                            className="h-10 w-10"
                            variant="none"
                        />
                    )}
                </Row>
                
                <Column className='flex-1 justify-center min-w-0'>
                    <AppButton variant='none' className='flex-1' onPress={onPress}>
                        <Column className='flex-1 justify-between'>
                            <PoppinsText weight='medium' className='text-left'>
                                {renderPageTitle(page.title || 'Page', page.pageNumber)}
                            </PoppinsText>
                            <PoppinsText varient='subtext' className='text-xs text-left'>
                                Position {index + 1}
                            </PoppinsText>
                        </Column>
                    </AppButton>
                </Column>
                
                <PageThumbnail imageUrl={page.imageUrl} className="w-16 h-12 sm:w-36 sm:h-24" />
                
                <Row gap={2}>
                    {index < totalCount - 1 ? (
                        <AppButton variant='none' className='h-10 w-10' onPress={onMoveDown}>
                            <ChevronDownIcon size={24} color="black" />
                        </AppButton>
                    ) : (
                        <StatusIconButton
                            icon={<ChevronDownIcon size={20} color="white" />}
                            className="h-10 w-10"
                            variant="none"
                        />
                    )}
                </Row>
            </Row>
        </View>
    );
};

export default ReorderablePageItem;
