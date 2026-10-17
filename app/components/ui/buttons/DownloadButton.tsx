import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { Check, ChevronDown, Download, Ellipsis } from 'lucide-react-native';
import { MathDocumentPage } from 'types/mathDocuments';
import { downloadViewOnlyMarkdown } from 'components/mathDocuments/downloadViewOnlyMarkdown';
import { useToast } from 'contexts/ToastContext';
import { useDownloadPreferences } from 'hooks/useDownloadPreferences';
import AppButton from './AppButton';
import Column from '../../layout/Column';
import Row from '../../layout/Row';
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
    /** Extra format rows (e.g. PDF on the view-only screen). */
    extraFormats?: DownloadOption[];
    /** Green two-line trigger used on the public view-only header. */
    prominent?: boolean;
}

const MENU_WIDTH = 232;

const DownloadButton = ({
    documentTitle,
    documentDescription,
    pages,
    className,
    extraFormats = [],
    prominent = false,
}: DownloadButtonProps) => {
    const { showToast } = useToast();
    const menu = useHoverMenu(MENU_WIDTH);
    const [showOptions, setShowOptions] = useState(false);
    const {
        includePageSeparators,
        includeAiDisclaimer,
        setIncludePageSeparators,
        setIncludeAiDisclaimer,
    } = useDownloadPreferences();

    const handleDownloadMarkdown = () => {
        if (Platform.OS !== 'web') {
            showToast('Downloads are only supported on web.');
            return;
        }

        downloadViewOnlyMarkdown({
            documentTitle,
            documentDescription,
            pages,
            includePageSeparators,
            includeAiDisclaimer,
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
        ...extraFormats,
    ];

    const handleOptionSelect = (option: DownloadOption) => {
        menu.close();
        option.onSelect();
    };

    const optionToggles: { label: string; description: string; value: boolean; onToggle: (v: boolean) => void }[] = [
        {
            label: 'Page separators',
            description: 'Keep "## Page N" headings and dividers',
            value: includePageSeparators,
            onToggle: setIncludePageSeparators,
        },
        {
            label: 'AI disclaimer',
            description: 'Note at the top about AI-generated content',
            value: includeAiDisclaimer,
            onToggle: setIncludeAiDisclaimer,
        },
    ];

    return (
        <Pressable
            ref={menu.anchorRef}
            className={`relative ${className || ''}`}
            onHoverIn={menu.open}
            onHoverOut={() => menu.scheduleClose()}
        >
            {prominent ? (
                <AppButton variant='green' className='h-11 px-4' onPress={menu.toggle}>
                    <Column className='items-center' gap={0}>
                        <PoppinsText weight='medium' color='white' className='leading-tight'>
                            Download
                        </PoppinsText>
                        <PoppinsText varient='subtext' className='text-[10px] leading-tight text-white/80'>
                            Markdown & options
                        </PoppinsText>
                    </Column>
                    <ChevronDown size={14} color='rgb(246, 238, 219)' />
                </AppButton>
            ) : (
                <AppButton
                    variant='outline-alt'
                    className='h-10 w-10 sm:w-auto sm:px-3'
                    onPress={menu.toggle}
                >
                    <Download size={15} className='text-text' />
                    <PoppinsText weight='medium' className='hidden sm:block'>
                        Download
                    </PoppinsText>
                    <ChevronDown size={13} className='text-text hidden sm:block' />
                </AppButton>
            )}

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
                    <Row className='items-center justify-between px-3 pt-2 pb-1'>
                        <PoppinsText varient='subtext' className='text-xs'>
                            Download
                        </PoppinsText>
                        <Pressable
                            onPress={() => setShowOptions((prev) => !prev)}
                            className={`rounded-md p-1 ${showOptions ? 'bg-text/10' : 'hover:bg-text/5'}`}
                            accessibilityLabel='Download options'
                        >
                            <Ellipsis size={14} className='text-subtext' />
                        </Pressable>
                    </Row>

                    {showOptions && (
                        <Column gap={1} className='border-t border-subtle-border px-1 pt-1'>
                            {optionToggles.map((toggle) => (
                                <Pressable
                                    key={toggle.label}
                                    className='w-full flex-row items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-border/10'
                                    onPress={() => toggle.onToggle(!toggle.value)}
                                >
                                    <Column gap={0} className='flex-1'>
                                        <PoppinsText weight='medium' className='text-sm'>
                                            {toggle.label}
                                        </PoppinsText>
                                        <PoppinsText varient='subtext' className='text-xs'>
                                            {toggle.description}
                                        </PoppinsText>
                                    </Column>
                                    {toggle.value && <Check size={14} className='text-accent' />}
                                </Pressable>
                            ))}
                        </Column>
                    )}

                    <Column gap={1} className='border-t border-subtle-border pt-1'>
                        {downloadOptions.map((option) => (
                            <Pressable
                                key={option.id}
                                className='w-full flex-row items-center gap-3 rounded-lg px-2 py-2 hover:bg-border/10'
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
                </Column>
            </HoverMenuPopup>
        </Pressable>
    );
};

export default DownloadButton;
