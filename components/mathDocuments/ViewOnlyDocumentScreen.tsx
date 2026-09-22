import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { ActivityIndicator, Platform, ScrollView, View, Dimensions } from 'react-native';
import Column from '../../app/components/layout/Column';
import PoppinsText from '../../app/components/ui/text/PoppinsText';
import { useUserListGet } from '../../hooks/useUserListGet';
import { MathDocument, MathDocumentPage } from '../../types/mathDocuments';
import { createMarkdownMathSourceDocument } from '../../app/components/ui/markdown/createMarkdownMathSourceDocument';
import ViewOnlyDocumentHeader, { ViewOnlyTab } from '../../app/components/document/ViewOnlyDocumentHeader';
import ViewOnlyDocumentPage from '../../app/components/document/ViewOnlyDocumentPage';
import { openViewOnlyPrintWindow } from './openViewOnlyPrintWindow';
import { downloadViewOnlyMarkdown } from './downloadViewOnlyMarkdown';

interface ViewOnlyDocumentScreenProps {
    documentId: string;
}

const DEFAULT_PAGE_ASPECT_RATIO = 8.5 / 11;

const ViewOnlyDocumentScreen = ({ documentId }: ViewOnlyDocumentScreenProps) => {
    const [activeTab, setActiveTab] = useState<ViewOnlyTab>('imageOverlay');
    const [headerHeight, setHeaderHeight] = useState(0);
    const [pageAspectRatios, setPageAspectRatios] = useState<Record<string, number>>({});
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentScrollY, setCurrentScrollY] = useState(0);
    const [screenWidth, setScreenWidth] = useState(0);
    const [screenHeight, setScreenHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [pageWidth, setPageWidth] = useState(0);
    const [userSetZoom, setUserSetZoom] = useState(1); // Track last user-set zoom
    const [zoomSource, setZoomSource] = useState<'user' | 'auto'>('user'); // Track who set the zoom
    const scrollViewRef = useRef<ScrollView>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // TODO: This route currently relies on globally accessible PUBLIC records.
    // A true per-document share token would require backend/schema support.
    const documentRecords = useUserListGet<MathDocument>({
        key: 'mathDocuments',
        itemId: documentId,
    });

    const pageRecords = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: documentId,
        returnTop: 100,
    });

    const isLoading = documentRecords === undefined || pageRecords === undefined;

    const documentValue = useMemo(() => {
        const record = documentRecords?.[0];
        return record ? record.value : undefined;
    }, [documentRecords]);

    const pages = useMemo(() => {
        return (pageRecords ?? [])
            .map((record: any) => record.value)
            .sort((a: MathDocumentPage, b: MathDocumentPage) => a.pageNumber - b.pageNumber);
    }, [pageRecords]);

    const handleZoomChange = (newZoomLevel: number, source: 'user' | 'auto' = 'user') => {
        if (source === 'user') {
            setUserSetZoom(newZoomLevel);
            setZoomSource('user');
        } else {
            setZoomSource('auto');
        }

        if (Platform.OS === 'web' && scrollViewRef.current) {
            // Only maintain scroll position for user-initiated zoom changes
            // Auto-fit zoom changes should not interfere with user scrolling
            if (source === 'user') {
                // Calculate the scroll position adjustment to maintain the same visual position
                // Standardize current scroll to zoom level 1, then apply new zoom
                const adjustedScrollY = currentScrollY * (newZoomLevel / zoomLevel);

                // Apply zoom level
                setZoomLevel(newZoomLevel);

                // Apply adjusted scroll position after a brief delay to allow the zoom to render
                setTimeout(() => {
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: adjustedScrollY, animated: true });
                    }
                }, 50);
            } else {
                // For auto-fit zoom, just change the zoom without adjusting scroll
                setZoomLevel(newZoomLevel);
            }
        } else {
            setZoomLevel(newZoomLevel);
        }
    };

    // Measure screen width and calculate page width on mount
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Get screen dimensions (accounting for padding)
            const width = Dimensions.get('window').width - 32; // 16px padding on each side
            const height = Dimensions.get('window').height;
            setScreenWidth(width);
            setScreenHeight(height);
            console.log('SETScreen width:', width);

            // Calculate page width based on standard letter size (8.5 x 11 inches)
            const pageWidth = 920; // Fixed width for letter size
            setPageWidth(pageWidth);
        }
    }, []);

    // Auto-fit zoom calculation
    const calculateAutoFitZoom = useCallback(() => {
        if (!screenWidth || !pageWidth) return null;

        const availableWidth = screenWidth - 40; // margin
        const requiredZoom = availableWidth / pageWidth;

        // Only apply auto-fit if the page doesn't fit and it's less than the user's last set zoom
        if (requiredZoom < userSetZoom) {
            return requiredZoom;
        }
        return null;
    }, [screenWidth, pageWidth, userSetZoom]);

    // Apply auto-fit zoom when needed
    const applyAutoFitZoom = useCallback(() => {
        const autoFitZoom = calculateAutoFitZoom();
        if (autoFitZoom !== null) {
            handleZoomChange(autoFitZoom, 'auto');
        } else if (zoomSource === 'auto') {
            // Restore user zoom when space allows
            handleZoomChange(userSetZoom, 'auto');
        }
    }, [calculateAutoFitZoom, zoomSource, userSetZoom, handleZoomChange]);

    // Initial auto-fit on mount
    useEffect(() => {
        if (screenWidth && pageWidth) {
            const autoFitZoom = calculateAutoFitZoom();
            if (autoFitZoom !== null) {
                handleZoomChange(autoFitZoom, 'auto');
            }
        }
    }, [screenWidth, pageWidth, calculateAutoFitZoom, handleZoomChange]);

    // Debounced resize handler that manages interval for active resizing
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        let intervalId: NodeJS.Timeout | null = null;
        let resizeTimeoutRef: NodeJS.Timeout | null = null;

        const startMonitoring = () => {
            if (!intervalId) {
                const checkScreenWidth = () => {
                    const width = Dimensions.get('window').width - 32;
                    const height = Dimensions.get('window').height;
                    setScreenWidth(width);
                    setScreenHeight(height);
                    console.log('SET 2 Screen width:', width);
                };

                // Check immediately and start interval
                checkScreenWidth();
                intervalId = setInterval(checkScreenWidth, 50);
            }
        };

        const stopMonitoring = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                // Check one final time to catch any changes in the last 150ms
                const width = Dimensions.get('window').width - 32;
                const height = Dimensions.get('window').height;
                setScreenWidth(width);
                setScreenHeight(height);
                console.log('SET 3 Screen width:', width);
            }
        };

        const handleResize = () => {
            // Clear existing timeout
            if (resizeTimeoutRef) {
                clearTimeout(resizeTimeoutRef);
            }

            // Start monitoring immediately
            startMonitoring();

            // Set timeout to stop monitoring after resize ends
            resizeTimeoutRef = setTimeout(() => {
                stopMonitoring();
            }, 150); // Stop 150ms after last resize event
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef) {
                clearTimeout(resizeTimeoutRef);
            }
            stopMonitoring();
        };
    }, []);

    // Apply auto-fit when screen width changes
    useEffect(() => {
        applyAutoFitZoom();
    }, [screenWidth, applyAutoFitZoom]);

    const handleContentLayout = (event: any) => {
        const height = event.nativeEvent.layout.height;
        setContentHeight(height);
    };

    const handleAspectRatioChange = (pageId: string, aspectRatio: number) => {
        setPageAspectRatios((current) => {
            if (current[pageId] === aspectRatio) {
                return current;
            }

            return {
                ...current,
                [pageId]: aspectRatio,
            };
        });
    };

    const handleZoomIn = () => {
        handleZoomChange(Math.min(zoomLevel + 0.25, 5));
    };

    const handleZoomOut = () => {
        handleZoomChange(Math.max(zoomLevel - 0.25, 0.1));
    };

    const handleDownloadPdf = () => {
        if (Platform.OS !== 'web') {
            return;
        }

        openViewOnlyPrintWindow({
            documentTitle: documentValue?.title || 'Math document',
            activeTab,
            pages: pages.map((page: MathDocumentPage) => ({
                id: page.id,
                title: page.title || `Page ${page.pageNumber}`,
                imageUrl: page.imageUrl,
                aspectRatio:
                    pageAspectRatios[page.id] ?? DEFAULT_PAGE_ASPECT_RATIO,
                srcDoc: createMarkdownMathSourceDocument(page.markdown),
            })),
        });
    };

    const handleDownloadMarkdown = () => {
        if (Platform.OS !== 'web') {
            return;
        }

        downloadViewOnlyMarkdown({
            documentTitle: documentValue?.title || 'Math document',
            documentDescription: documentValue?.description,
            pages,
        });
    };

    if (Platform.OS !== 'web') {
        return (
            <View className='flex-1 items-center justify-center bg-background p-6'>
                <Column className='items-center' gap={3}>
                    <PoppinsText weight='bold' className='text-lg text-center'>
                        View-only pages are only supported on web
                    </PoppinsText>
                    <PoppinsText varient='subtext' className='text-center'>
                        This screen uses iframe-based MathJax rendering.
                    </PoppinsText>
                </Column>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center bg-background p-6'>
                <Column className='items-center' gap={3}>
                    <ActivityIndicator />
                    <PoppinsText varient='subtext'>Loading document…</PoppinsText>
                </Column>
            </View>
        );
    }

    if (!documentValue) {
        return (
            <View className='flex-1 items-center justify-center bg-background p-6'>
                <Column className='items-center' gap={3}>
                    <PoppinsText weight='bold' className='text-lg text-center'>
                        Document not found
                    </PoppinsText>
                    <PoppinsText varient='subtext' className='text-center'>
                        It may not exist or may not be publicly accessible.
                    </PoppinsText>
                </Column>
            </View>
        );
    }

    if (!documentId) {
        return (
            <View className='flex-1 items-center justify-center bg-background p-6'>
                <Column className='items-center' gap={3}>
                    <PoppinsText weight='bold' className='text-lg text-center'>
                        Missing document ID
                    </PoppinsText>
                    <PoppinsText varient='subtext' className='text-center'>
                        Please provide a valid document ID in the URL.
                    </PoppinsText>
                </Column>
            </View>
        );
    }

    return (
        <View className='flex-1 bg-background'>
            <ViewOnlyDocumentHeader
                activeTab={activeTab}
                documentTitle={documentValue.title}
                documentDescription={documentValue.description}
                pageCount={pages.length}
                onDownloadPdf={handleDownloadPdf}
                onDownloadMarkdown={handleDownloadMarkdown}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                zoomLevel={zoomLevel}
                onZoomChange={handleZoomChange}
                onLayout={(event: any) => {
                    setHeaderHeight(event.nativeEvent.layout.height);
                }}
                onTabChange={setActiveTab}
                pageWidth={pageWidth}
                screenWidth={screenWidth}
                margin={40}
            />

            <ScrollView
                ref={scrollViewRef}
                className='flex-1'
                contentContainerStyle={{
                    paddingTop: headerHeight + 16,
                    paddingBottom: 24,
                    paddingHorizontal: 16,
                }}
                onScroll={(event) => {
                    setCurrentScrollY(event.nativeEvent.contentOffset.y);
                }}
                scrollEventThrottle={16}
            >
                <Column className='mx-auto w-full gap-6 transition-all' style={{ transform: [{ scale: zoomLevel }], transformOrigin: 'top center', marginBottom: (screenHeight - 100) + (contentHeight * zoomLevel - contentHeight) }}>
                    <Column className='w-full h-full' onLayout={handleContentLayout}>
                        {pages.length ? (
                            pages.map((page: MathDocumentPage) => (
                                <ViewOnlyDocumentPage
                                    key={page.id}
                                    activeTab={activeTab}
                                    page={page}
                                    onAspectRatioChange={handleAspectRatioChange}
                                />
                            ))
                        ) : (
                            <View className='items-center justify-center rounded-2xl border border-subtle-border bg-inner-background p-8'>
                                <Column className='items-center' gap={2}>
                                    <PoppinsText weight='bold'>No pages yet</PoppinsText>
                                    <PoppinsText varient='subtext' className='text-center'>
                                        This document does not have any pages to display.
                                    </PoppinsText>
                                </Column>
                            </View>
                        )}
                    </Column>
                </Column>
            </ScrollView>
        </View>
    );
};

export default ViewOnlyDocumentScreen;
