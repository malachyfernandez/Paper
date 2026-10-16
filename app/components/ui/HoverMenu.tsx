import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { WebDropdownPortal } from '../../../contexts/WebDropdownProvider';

const CLOSE_DELAY_MS = 250;
const MENU_GAP_PX = 6;
const VIEWPORT_PADDING_PX = 8;

interface MenuPosition {
    top: number;
    left: number;
}

/**
 * Shared hover-dropdown behavior.
 *
 * Hover-opened menus close a beat after the pointer leaves both the trigger
 * and the menu — the delay plus the portal div overlapping the button->menu
 * gap keep it from collapsing while the mouse is in transit.
 *
 * Press-opened (pinned) menus ignore hover and stay up until an option is
 * chosen, the trigger is pressed again, or the backdrop behind them is hit.
 */
export const useHoverMenu = (menuWidth: number) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [position, setPosition] = useState<MenuPosition | null>(null);
    const anchorRef = useRef<any>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const close = useCallback(() => {
        clearCloseTimer();
        setPinned(false);
        setIsOpen(false);
    }, [clearCloseTimer]);

    const scheduleClose = useCallback((delay = CLOSE_DELAY_MS) => {
        if (pinned) return;
        clearCloseTimer();
        closeTimer.current = setTimeout(() => setIsOpen(false), delay);
    }, [clearCloseTimer, pinned]);

    const measure = useCallback(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return;
        const rect = anchorRef.current?.getBoundingClientRect?.();
        if (!rect) return;
        const left = Math.min(
            Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
            Math.max(VIEWPORT_PADDING_PX, window.innerWidth - menuWidth - VIEWPORT_PADDING_PX),
        );
        setPosition({ top: rect.bottom, left });
    }, [menuWidth]);

    const open = useCallback(() => {
        clearCloseTimer();
        measure();
        setIsOpen(true);
    }, [clearCloseTimer, measure]);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            setPinned(true);
            open();
        }
    }, [isOpen, close, open]);

    // A fixed-position menu doesn't follow the page — close on scroll/resize.
    useEffect(() => {
        if (!isOpen || Platform.OS !== 'web' || typeof window === 'undefined') return;
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [isOpen, close]);

    useEffect(() => clearCloseTimer, [clearCloseTimer]);

    return { anchorRef, isOpen, pinned, position, open, close, toggle, scheduleClose, clearCloseTimer };
};

interface HoverMenuPopupProps {
    isOpen: boolean;
    pinned: boolean;
    position: MenuPosition | null;
    menuWidth: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onBackdropPress: () => void;
    children: React.ReactNode;
}

/**
 * The floating menu itself. On web it portals to document.body and positions
 * fixed above everything else (RN containers clip absolute children); on
 * native it falls back to an absolute view inside the trigger's parent.
 */
export const HoverMenuPopup = ({ isOpen, pinned, position, menuWidth, onMouseEnter, onMouseLeave, onBackdropPress, children }: HoverMenuPopupProps) => {
    if (!isOpen) return null;

    if (Platform.OS !== 'web') {
        return <View className='absolute right-0 top-full z-50 pt-1.5'>{children}</View>;
    }

    if (!position) return null;

    return (
        <WebDropdownPortal>
            <>
                {pinned && React.createElement('div', {
                    'aria-hidden': true,
                    onMouseDown: (event: { preventDefault?: () => void }) => {
                        event.preventDefault?.();
                        onBackdropPress();
                    },
                    style: {
                        inset: 0,
                        pointerEvents: 'auto',
                        position: 'fixed',
                    },
                })}
                {React.createElement(
                    'div',
                    {
                        onMouseEnter,
                        onMouseLeave,
                        style: {
                            left: position.left,
                            paddingTop: MENU_GAP_PX,
                            pointerEvents: 'auto',
                            position: 'fixed',
                            top: position.top,
                            width: menuWidth,
                        },
                    },
                    children,
                )}
            </>
        </WebDropdownPortal>
    );
};
