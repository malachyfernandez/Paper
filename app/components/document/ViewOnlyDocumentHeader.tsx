import React, { useState, useEffect, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Tabs } from 'heroui-native';
import { BlurView } from 'expo-blur';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import AppButton from '../ui/buttons/AppButton';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';

export type ViewOnlyTab = 'screenReadable' | 'imageOverlay';

interface ViewOnlyDocumentHeaderProps {
    activeTab: ViewOnlyTab;
    documentTitle: string;
    documentDescription: string;
    pageCount: number;
    onDownloadPdf: () => void;
    onDownloadMarkdown: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoomLevel: number;
    onZoomChange?: (zoomLevel: number) => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    onTabChange: (tab: ViewOnlyTab) => void;
    pageWidth?: number;
    screenWidth?: number;
    margin?: number;
}

const ViewOnlyDocumentHeader = ({
    activeTab,
    documentTitle,
    documentDescription,
    pageCount,
    onDownloadPdf,
    onDownloadMarkdown,
    onZoomIn,
    onZoomOut,
    zoomLevel,
    onZoomChange,
    onLayout,
    onTabChange,
    pageWidth,
    screenWidth,
    margin = 40,
}: ViewOnlyDocumentHeaderProps) => {
    const [zoomInputValue, setZoomInputValue] = useState(Math.round(zoomLevel * 100).toString());
    const [inputWidth, setInputWidth] = useState(25);
    const EXTRA_PIXELS = 10;
    const measuredTextWidth = useRef(25);
    const secondaryText = documentDescription || `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`;

    const handleZoomInputChange = (text: string) => {
        // Convert to number
        const numericValue = parseInt(text, 10);

        if (!isNaN(numericValue) && numericValue > 0) {
            // Cap at 500 for upper bound
            const cappedValue = Math.min(numericValue, 555);

            // Convert to zoom level (no arbitrary limits)
            const newZoomLevel = cappedValue / 100;

            // Update the input with the capped value (without %)
            setZoomInputValue(cappedValue.toString());

            // Call the zoom change callback if provided
            if (onZoomChange) {
                onZoomChange(newZoomLevel);
            }
        } else {
            // If invalid input, just update the display
            setZoomInputValue(text);
        }
    };

    const handleTextLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        measuredTextWidth.current = width;
        setInputWidth(Math.max(1, width + EXTRA_PIXELS));
    };

    // Update input width when text changes
    useEffect(() => {
        // The actual measurement will happen when the hidden text renders and calls onLayout
        // For now, we'll use the last measured width as a fallback
        if (measuredTextWidth.current > 0) {
            setInputWidth(Math.max(1, measuredTextWidth.current + EXTRA_PIXELS));
        }
    }, [zoomInputValue]);

    const handleZoomInputFocus = () => {
        // Keep the current value when focused (no % to remove)
    };

    const handleZoomInputBlur = () => {
        // Validate on blur (just ensure it's a positive number)
        const numericValue = parseInt(zoomInputValue, 10);

        if (!isNaN(numericValue) && numericValue > 0) {
            setZoomInputValue(numericValue.toString());
        } else {
            // Reset to current zoom level if invalid
            setZoomInputValue(Math.round(zoomLevel * 100).toString());
        }
    };

    // Calculate auto-fit zoom on initial load
    useEffect(() => {
        if (pageWidth && screenWidth && onZoomChange) {
            const availableWidth = screenWidth - margin;
            const requiredZoom = availableWidth / pageWidth;

            // Only apply auto-fit if the page doesn't fit (zoom < 1.0)
            if (requiredZoom < 1.0) {
                onZoomChange(requiredZoom);
            }
        }
    }, []); // Empty dependency array means this only runs once on mount

    // Update input when zoomLevel changes from external sources
    useEffect(() => {
        setZoomInputValue(Math.round(zoomLevel * 100).toString());
    }, [zoomLevel]);

    return (
        <View className='absolute top-0 left-0 right-0 z-10' onLayout={onLayout}>
            <BlurView
                intensity={20}
                tint='light'
                className='absolute top-0 left-0 right-0 h-full'
            />
            <View className='relative border-b border-subtle-border bg-background/50'>
                <Column className='p-4' gap={3}>
                    <Column gap={0}>
                        <PoppinsText weight='bold' className='text-lg'>
                            {documentTitle || 'Untitled math document'}
                        </PoppinsText>
                        <PoppinsText varient='subtext'>{secondaryText}</PoppinsText>
                    </Column>
                    <Row className='items-center justify-between flex-wrap' gap={3}>
                        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ViewOnlyTab)} variant='secondary' className='shrink-0'>
                            <Tabs.List>
                                <Tabs.Indicator />
                                <Tabs.Trigger value='imageOverlay'>
                                    {({ isSelected }) => (
                                        <Tabs.Label className={isSelected ? 'font-medium text-black' : 'text-gray-500'}>
                                            (Screen Readable) Images
                                        </Tabs.Label>
                                    )}
                                </Tabs.Trigger>
                                <Tabs.Trigger value='screenReadable'>
                                    {({ isSelected }) => (
                                        <Tabs.Label className={isSelected ? 'font-medium text-black' : 'text-gray-500'}>
                                            Text Only
                                        </Tabs.Label>
                                    )}
                                </Tabs.Trigger>
                            </Tabs.List>
                        </Tabs>

                        <Row gap={2} className='items-center'>
                            <Row gap={1} className='items-center bg-inner-background rounded-lg px-1 py-1'>
                                <AppButton
                                    variant='outline-alt'
                                    className='h-8 w-8 p-0'
                                    onPress={onZoomOut}
                                    disabled={zoomLevel <= 0.1}
                                >
                                    <PoppinsText weight='medium' className='text-sm'>−</PoppinsText>
                                </AppButton>

                                <Row gap={0} className='items-center w-12 pr-2 justify-center'>
                                    {/* Hidden text for measuring width */}
                                    <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                                        <PoppinsText
                                            weight='medium'
                                            className='text-sm'
                                            onLayout={handleTextLayout}
                                        >
                                            {zoomInputValue}
                                        </PoppinsText>
                                    </View>

                                    <PoppinsTextInput
                                        className='text-xs text-center overflow-visible pr-1 rounded-none'
                                        weight='medium'
                                        value={zoomInputValue}
                                        onChangeText={handleZoomInputChange}
                                        onFocus={handleZoomInputFocus}
                                        onBlur={handleZoomInputBlur}
                                        keyboardType='numeric'
                                        maxLength={4}
                                        style={{ textAlign: 'right', width: inputWidth }}
                                    />
                                    <PoppinsText className='text-xs text-center' weight='medium'>%</PoppinsText>
                                </Row>

                                <AppButton
                                    variant='outline-alt'
                                    className='h-8 w-8 p-0'
                                    onPress={onZoomIn}
                                    disabled={zoomLevel >= 5}
                                >
                                    <PoppinsText weight='medium' className='text-sm'>+</PoppinsText>
                                </AppButton>
                            </Row>

                            {/* <AppButton variant='green' className='h-10 px-4' onPress={onDownloadPdf}>
                                <Column className='items-center' gap={0}>
                                    <PoppinsText weight='medium' color='white'>
                                        {'Download PDF'}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs text-white/80'>
                                        {activeTab === 'imageOverlay' ? 'PDF with images' : 'PDF with text only'}
                                    </PoppinsText>
                                </Column>
                            </AppButton> */}

                            <AppButton variant='green' className='h-10 px-4' onPress={onDownloadMarkdown}>
                                <Column className='items-center' gap={0}>
                                    <PoppinsText weight='medium' color='white'>
                                        {'Download Markdown'}
                                    </PoppinsText>
                                    <PoppinsText varient='subtext' className='text-xs text-white/80'>
                                        All pages in one .md file
                                    </PoppinsText>
                                </Column>
                            </AppButton>
                        </Row>
                    </Row>
                </Column>
            </View>
        </View>
    );
};

export default ViewOnlyDocumentHeader;
