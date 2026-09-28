import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';

interface IconButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    tooltip: string;
    className?: string;
}

const IconButton = ({ children, onPress, tooltip, className = '' }: IconButtonProps) => {
    const button = (
        <TouchableOpacity
            onPress={onPress}
            hitSlop={8}
            className={`p-1.5 rounded-lg border border-transparent hover:bg-border/10 hover:border-subtle-border active:brightness-75 ${className}`}
        >
            {children}
        </TouchableOpacity>
    );

    if (Platform.OS !== 'web') {
        return button;
    }

    return React.createElement(
        'div',
        { title: tooltip, style: { display: 'inline-flex' } },
        button,
    );
};

export default IconButton;
