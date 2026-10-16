import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { ChevronDown, Download } from 'lucide-react-native';
import { MathDocumentPage } from 'types/mathDocuments';
import { downloadViewOnlyMarkdown } from 'components/mathDocuments/downloadViewOnlyMarkdown';
import { useToast } from 'contexts/ToastContext';
import AppButton from './AppButton';
import Column from '../../layout/Column';
import PoppinsText from '../text/PoppinsText';

interface DownloadOption {
    id: string;
    label: string;
    fileType: string;
    description: string;
    onSelect: () => void;
}

interface DownloadButtonProps {
    documentTitle: string;
    documentDescription?: string;
    pages: MathDocumentPage[];
    className?: string;
}

const DownloadButton = ({ documentTitle, documentDescription, pages, className }: DownloadButtonProps) => {
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleDownloadMarkdown = () => {
        if (Platform.OS !== 'web') {
            showToast('Downloads are only supported on web.');
            return;
        }

        downloadViewOnlyMarkdown({
            documentTitle,
            documentDescription,
            pages,
        });
    };

    // Add new download formats to this list as they become available.
    const downloadOptions: DownloadOption[] = [
        {
            id: 'markdown',
            label: 'Markdown',
            fileType: '.md',
            description: 'All pages in one file',
            onSelect: handleDownloadMarkdown,
        },
    ];

    const handleOptionSelect = (option: DownloadOption) => {
        option.onSelect();
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
                className='h-10 w-10 sm:w-auto sm:px-3'
                onPress={() => setIsOpen((current) => !current)}
            >
                <Download size={16} className='text-text' />
                <PoppinsText weight='medium' className='hidden sm:block'>
                    Download
                </PoppinsText>
                <ChevronDown size={14} className='text-text' />
            </AppButton>

            {isOpen && (
                <Pressable className='absolute right-0 top-full z-50 pt-2'>
                    <Column gap={1} className='w-52 rounded-xl border border-subtle-border bg-background p-1 shadow-lg'>
                        {downloadOptions.map((option) => (
                            <Pressable
                                key={option.id}
                                className='w-full flex-row items-center gap-3 rounded-lg px-3 py-2 hover:bg-border/10'
                                onPress={() => handleOptionSelect(option)}
                            >
                                <Column gap={0} className='flex-1'>
                                    <PoppinsText weight='medium' className='text-sm'>
                                        {option.label}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        {option.description}
                                    </PoppinsText>
                                </Column>
                                <PoppinsText varient='subtext' className='text-xs'>
                                    {option.fileType}
                                </PoppinsText>
                            </Pressable>
                        ))}
                    </Column>
                </Pressable>
            )}
        </Pressable>
    );
};

export default DownloadButton;
