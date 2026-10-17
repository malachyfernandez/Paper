import React from 'react';
import { Pressable } from 'react-native';
import { ArrowUpDown, Check } from 'lucide-react-native';
import { useUserVariable } from 'hooks/useUserVariable';
import {
    DEFAULT_DOCUMENT_SORT,
    DOCUMENT_SORT_OPTIONS,
    DOCUMENT_SORT_VARIABLE_KEY,
    DocumentSortOption,
} from 'utils/documentSort';
import AppButton from '../ui/buttons/AppButton';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { HoverMenuPopup, useHoverMenu } from '../ui/HoverMenu';

interface DocumentSortButtonProps {
    className?: string;
}

const MENU_WIDTH = 208;

const DocumentSortButton = ({ className }: DocumentSortButtonProps) => {
    const [sortRecord, setSortOption] = useUserVariable<DocumentSortOption>({
        key: DOCUMENT_SORT_VARIABLE_KEY,
        defaultValue: DEFAULT_DOCUMENT_SORT,
    });
    const menu = useHoverMenu(MENU_WIDTH);

    const currentOption = DOCUMENT_SORT_OPTIONS.find((option) => option.value === sortRecord.value) ?? DOCUMENT_SORT_OPTIONS[0];

    const handleSelect = (option: DocumentSortOption) => {
        setSortOption(option);
        menu.close();
    };

    return (
        <Pressable
            ref={menu.anchorRef}
            className={`relative ${className || ''}`}
            onHoverIn={menu.open}
            onHoverOut={() => menu.scheduleClose()}
        >
            <AppButton
                variant='outline-alt'
                className='h-12 w-12'
                onPress={menu.toggle}
            >
                <ArrowUpDown size={17} className='text-text' />
            </AppButton>

            <HoverMenuPopup
                isOpen={menu.isOpen}
                pinned={menu.pinned}
                position={menu.position}
                menuWidth={MENU_WIDTH}
                onMouseEnter={menu.clearCloseTimer}
                onMouseLeave={() => menu.scheduleClose(150)}
                onBackdropPress={menu.close}
            >
                <Column gap={1} className='w-full rounded-xl border border-subtle-border bg-background p-1 shadow-lg'>
                    {DOCUMENT_SORT_OPTIONS.map((option) => {
                        const isSelected = option.value === currentOption.value;

                        return (
                            <Pressable
                                key={option.value}
                                className='w-full flex-row items-center gap-3 rounded-lg px-3 py-2 hover:bg-border/10'
                                onPress={() => handleSelect(option.value)}
                            >
                                <Column gap={0} className='flex-1'>
                                    <PoppinsText weight='medium' className='text-sm'>
                                        {option.label}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        {option.description}
                                    </PoppinsText>
                                </Column>
                                <Row className='w-4 items-center justify-center' gap={0}>
                                    {isSelected && <Check size={14} className='text-accent' />}
                                </Row>
                            </Pressable>
                        );
                    })}
                </Column>
            </HoverMenuPopup>
        </Pressable>
    );
};

export default DocumentSortButton;
