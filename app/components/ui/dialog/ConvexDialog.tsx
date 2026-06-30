import React from 'react';
import { Dialog } from 'heroui-native/dialog';
import { ConvexProvider } from 'convex/react';
import convex from '../../../../utils/convexClient';
import { AppAuthContext, AppAuthContextValue, useAppAuth } from '../../../../contexts/AppAuthContext';

const ConvexDialogContent = ({ children, appAuth }: { children: React.ReactNode; appAuth: AppAuthContextValue }) => {
    return (
        <ConvexProvider client={convex}>
            <AppAuthContext.Provider value={appAuth}>
                {children}
            </AppAuthContext.Provider>
        </ConvexProvider>
    );
};

const ConvexDialog = {
    Root: Dialog,
    Trigger: Dialog.Trigger,
    Portal: ({ children, ...props }: any) => {
        const appAuth = useAppAuth();

        return (
            <Dialog.Portal {...props}>
                <ConvexDialogContent appAuth={appAuth}>
                    {children}
                </ConvexDialogContent>
            </Dialog.Portal>
        );
    },
    Overlay: ({ className, ...props }: any) => (
        <Dialog.Overlay className="bg-black/20" {...props} />
    ),
    Content: ({ children, className, ...props }: any) => {
        return (
            <Dialog.Content className="bg-background rounded border-2 border-border max-w-2xl w-full mx-auto" {...props}>
                {children}
            </Dialog.Content>
        );
    },
    Close: Dialog.Close,
    Title: Dialog.Title,
    Description: Dialog.Description,
};

export default ConvexDialog;
