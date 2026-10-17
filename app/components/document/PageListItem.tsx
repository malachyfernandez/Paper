import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { Spinner } from 'heroui-native';
import Column from '../layout/Column';
import Row from '../layout/Row';
import PoppinsText from '../ui/text/PoppinsText';
import { MonoIconsOptionsHorizontal } from '../icons/MonoIconsOptionsHorizontal';
import { MathDocumentPage } from 'types/mathDocuments';
import { useGeneration } from '../../../contexts/GenerationContext';

interface PageListItemProps {
    page: MathDocumentPage;
    isActive: boolean;
    /** Member of the multi-selection set (independent of the open/active page). */
    isSelected?: boolean;
    onPress: (event?: unknown) => void;
    onConfigure?: () => void;
}

const PageListItem = ({ page, isActive, isSelected = false, onPress, onConfigure }: PageListItemProps) => {
    const { isPageGenerating, isPageRecentlyCompleted, clearRecentlyCompleted } = useGeneration();
    const isGenerating = isPageGenerating(page.id);
    const isRecentlyCompleted = isPageRecentlyCompleted(page.id);

    // Helper function to render page title with number
    const renderPageTitle = (title: string, pageNumber: number) => {
        return `${title} - ${pageNumber}`;
    };

    const handlePress = (event?: unknown) => {
        // Clear recently completed status when user interacts with the page
        if (isRecentlyCompleted) {
            clearRecentlyCompleted(page.id);
        }

        // Modifier clicks are selection gestures — never the "tap active page
        // to configure" shortcut.
        const native = (event as { nativeEvent?: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } })?.nativeEvent;
        const hasModifier = Boolean(native?.metaKey || native?.ctrlKey || native?.shiftKey);

        if (!hasModifier && isActive && onConfigure) {
            onConfigure();
        } else {
            onPress(event);
        }
    };

    const containerClass = isActive
        ? 'border-primary-accent bg-primary-accent/10'
        : isSelected
          ? 'border-primary-accent/50 bg-primary-accent/5'
          : 'border-subtle-border bg-inner-background';

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            className={`rounded-xl border p-3 select-none ${containerClass}`}
        >
            <Row className='items-center justify-between'>
                <Column gap={1} className='flex-1'>
                    <PoppinsText weight='medium'>
                        {renderPageTitle(page.title || 'Page', page.pageNumber)}
                    </PoppinsText>
                </Column>
                {isGenerating ? (
                    <Spinner size="sm" color="primary" />
                ) : isRecentlyCompleted ? (
                    <Image 
                        source={require('../../../assets/svgs/check-mark.svg')}
                        className='w-5 h-5 text-primary'
                        style={{ tintColor: '#3B82F6' }}
                    />
                ) : (
                    isActive && onConfigure && (
                        <MonoIconsOptionsHorizontal className='text-text opacity-50' width={20} height={20} />
                    )
                )}
            </Row>
        </TouchableOpacity>
    );
};

export default PageListItem;
