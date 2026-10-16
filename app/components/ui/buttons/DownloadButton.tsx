import React from 'react';
import { Platform, Pressable } from 'react-native';
import { ChevronDown, Download } from 'lucide-react-native';
import { MathDocumentPage } from 'types/mathDocuments';
import { downloadViewOnlyMarkdown } from 'components/mathDocuments/downloadViewOnlyMarkdown';
import { useToast } from 'contexts/ToastContext';
import AppButton from './AppButton';
import Column from '../../layout/Column';
import PoppinsText from '../text/PoppinsText';
import { HoverMenuPopup, useHoverMenu } from '../HoverMenu';

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

const MENU_WIDTH = 208;

const DownloadButton = ({ documentTitle, documentDescription, pages, className }: DownloadButtonProps) => {
    const { showToast } = useToast();
    const menu = useHoverMenu(MENU_WIDTH);

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
        menu.close();
        option.onSelect();
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
                className='h-10 w-10 sm:w-auto sm:px-3'
                onPress={menu.toggle}
            >
                <Download size={16} className='text-text' />
                <PoppinsText weight='medium' className='hidden sm:block'>
                    Download
                </PoppinsText>
                <ChevronDown size={14} className='text-text' />
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
            </HoverMenuPopup>
        </Pressable>
    );
};

export default DownloadButton;
