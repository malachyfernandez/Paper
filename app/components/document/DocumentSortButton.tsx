import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react-native';
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

interface DocumentSortButtonProps {
    className?: string;
}

const DocumentSortButton = ({ className }: DocumentSortButtonProps) => {
    const [sortRecord, setSortOption] = useUserVariable<DocumentSortOption>({
        key: DOCUMENT_SORT_VARIABLE_KEY,
        defaultValue: DEFAULT_DOCUMENT_SORT,
    });
    const [isOpen, setIsOpen] = useState(false);

    const currentOption = DOCUMENT_SORT_OPTIONS.find((option) => option.value === sortRecord.value) ?? DOCUMENT_SORT_OPTIONS[0];

    const handleSelect = (option: DocumentSortOption) => {
        setSortOption(option);
        setIsOpen(false);
    };

    return (
        <Pressable
            className={`relative ${className || ''}`}
            onHoverIn={() => setIsOpen(true)}
            onHoverOut={() => setIsOpen(false)}
        >
            <AppButton
                variant='outline-alt'
                className='h-12 w-12 sm:w-auto sm:px-4'
                onPress={() => setIsOpen((current) => !current)}
            >
                <ArrowUpDown size={16} className='text-text' />
                <PoppinsText weight='medium' className='hidden sm:block'>
                    {currentOption.label}
                </PoppinsText>
                <ChevronDown size={14} className='text-text' />
            </AppButton>

            {isOpen && (
                <Pressable className='absolute right-0 top-full z-50 pt-2'>
                    <Column gap={1} className='w-52 rounded-xl border border-subtle-border bg-background p-1 shadow-lg'>
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
                </Pressable>
            )}
        </Pressable>
    );
};

export default DocumentSortButton;
