import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Check, Copy } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Column from '../layout/Column';
import Row from '../layout/Row';
import AppButton from '../ui/buttons/AppButton';
import PoppinsText from '../ui/text/PoppinsText';
import PoppinsTextInput from '../ui/forms/PoppinsTextInput';
import ConvexDialog from '../ui/dialog/ConvexDialog';
import DialogHeader from '../ui/dialog/DialogHeader';
import { useUserVariable } from 'hooks/useUserVariable';
import { useAppAuth } from '../../../contexts/AppAuthContext';

interface UserProfileDialogProps {
    children?: React.ReactNode;
}

const UserProfileDialog = ({ children }: UserProfileDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { signOut } = useAppAuth();
    const createAgentSession = useMutation(api.userCodeAuth.createAgentSession);
    const [agentToken, setAgentToken] = useState('');
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const [didCopy, setDidCopy] = useState(false);

    const handleCreateAgentToken = async () => {
        setIsCreatingToken(true);
        try {
            const { sessionToken } = await createAgentSession({});
            setAgentToken(sessionToken);
            setDidCopy(false);
        } finally {
            setIsCreatingToken(false);
        }
    };

    const handleCopyToken = async () => {
        if (!agentToken || Platform.OS !== 'web' || typeof navigator === 'undefined') return;
        try {
            await navigator.clipboard.writeText(agentToken);
            setDidCopy(true);
        } catch {
            // Clipboard unavailable — the token stays selectable in the field.
        }
    };

    // Get user data from userVariables
    const [userData] = useUserVariable({
        key: 'userData',
        defaultValue: { name: '', email: '', userId: '' },
        privacy: 'PRIVATE'
    });

    // Get/set user-wide AI guidance
    const [aiGuidance, setAiGuidance] = useUserVariable({
        key: 'aiGuidance',
        defaultValue: 'Convert this handwritten notes to Markdown with LaTeX support.',
        privacy: 'PRIVATE'
    });

    const handleSignOut = () => {
        setIsOpen(false);
        void signOut();
    };

    return (
        <ConvexDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
            <ConvexDialog.Trigger asChild>
                {children || (
                    <AppButton variant="outline-alt" className="h-14 w-14">
                        <View className="w-6 h-6 bg-gray-400 rounded-full" />
                    </AppButton>
                )}
            </ConvexDialog.Trigger>
            <ConvexDialog.Portal>
                <ConvexDialog.Overlay />
                <ConvexDialog.Content>
                    <ConvexDialog.Close iconProps={{ color: 'rgb(246, 238, 219)' }} className='w-10 h-10 bg-accent-hover absolute right-4 top-4 z-10' />
                    <Column>
                        <DialogHeader text='Profile' subtext='Your account information' />

                        <Column className='pt-5 px-5 pb-5' gap={6}>
                            {/* Profile Info Section */}
                            <Column gap={3} className='w-full items-center'>
                                <Row className='items-center' gap={4}>
                                    <PoppinsText className='text-base  border-r border-subtle-border pr-4'>
                                        {`${userData.value?.name || 'Not set'}`}
                                    </PoppinsText>
                                    {/* <PoppinsText className='text-2xl !text-subtle-border'>||</PoppinsText> */}

                                    <PoppinsText className='text-base' varient='subtext'>
                                        {userData.value?.email || 'Not available'}
                                    </PoppinsText>
                                </Row>

                                <Column className='px-4'>
                                    <PoppinsText varient='subtext' className='text-xs font-mono'>
                                        {userData.value?.userId || 'Not available'}
                                    </PoppinsText>
                                </Column>
                            </Column>

                            {/* AI Guidance Section */}
                            <Column gap={2} className='border-t border-subtle-border pt-6'>
                                <PoppinsText weight='medium' varient='cardHeader' className='pl-2'>AI Conversion Guidance</PoppinsText>

                                <PoppinsTextInput
                                    value={aiGuidance.value}
                                    onChangeText={setAiGuidance}
                                    className='w-full border border-subtle-border bg-inner-background p-3 min-h-20'
                                    multiline={true}
                                    placeholder='Enter guidance for AI conversion...'
                                />
                                <PoppinsText varient='subtext' className='text-xs'>
                                    Default instructions for AI when converting images
                                </PoppinsText>
                            </Column>

                            {/* Agent Access Section */}
                            <Column gap={2} className='border-t border-subtle-border pt-6'>
                                <PoppinsText weight='medium' varient='cardHeader' className='pl-2'>Agent Access</PoppinsText>
                                <PoppinsText varient='subtext' className='text-xs'>
                                    A long-lived token for the Paper MCP server and other agents — full access to your documents, treat it like a password.
                                </PoppinsText>
                                {agentToken ? (
                                    <Row gap={2} className='items-center'>
                                        <PoppinsTextInput
                                            value={agentToken}
                                            onChangeText={() => {}}
                                            className='flex-1 border border-subtle-border bg-inner-background p-3 text-xs font-mono'
                                        />
                                        <AppButton variant='outline-alt' className='h-11 w-11' onPress={() => void handleCopyToken()}>
                                            {didCopy ? (
                                                <Check size={16} className='text-accent' />
                                            ) : (
                                                <Copy size={16} className='text-text' />
                                            )}
                                        </AppButton>
                                    </Row>
                                ) : (
                                    <AppButton
                                        variant='outline-alt'
                                        className='h-11'
                                        onPress={() => void handleCreateAgentToken()}
                                        disabled={isCreatingToken}
                                    >
                                        <PoppinsText weight='medium'>
                                            {isCreatingToken ? 'Creating…' : 'Create agent token'}
                                        </PoppinsText>
                                    </AppButton>
                                )}
                                {agentToken ? (
                                    <PoppinsText varient='subtext' className='text-xs'>
                                        Paste it into your MCP config as PAPER_SESSION_TOKEN. Create a new token any time — old ones keep working until signed out.
                                    </PoppinsText>
                                ) : null}
                            </Column>

                            {/* Sign Out Button */}
                            <View className='mt-auto'>
                                <AppButton
                                    variant='red'
                                    className='h-12 w-full'
                                    onPress={handleSignOut}
                                >
                                    <PoppinsText weight='medium' color='red'>
                                        Sign Out
                                    </PoppinsText>
                                </AppButton>
                            </View>
                        </Column>
                    </Column>
                </ConvexDialog.Content>
            </ConvexDialog.Portal>
        </ConvexDialog.Root>
    );
};

export default UserProfileDialog;
