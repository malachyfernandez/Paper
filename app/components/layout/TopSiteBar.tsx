import React, { useMemo } from 'react';
import Column from './Column';
import Row from './Row';
import AppButton from '../ui/buttons/AppButton';
import DownloadButton from '../ui/buttons/DownloadButton';
import ShareButton from '../ui/buttons/ShareButton';
import PoppinsText from '../ui/text/PoppinsText';
import { UserIcon } from '../ui/icons/UserIcon';
import { TouchableOpacity, Image } from 'react-native';
import { Svg, Rect, Line } from 'react-native-svg';
import UserProfileDialog from '../dialog/UserProfileDialog';
import { useUserList } from 'hooks/useUserList';
import { useUserListGet } from 'hooks/useUserListGet';
import { useUserVariable } from 'hooks/useUserVariable';
import { MathDocument, MathDocumentPage } from 'types/mathDocuments';
import DocumentDetails from '../document/DocumentDetails';

interface TopSiteBarProps {
    className?: string;
    isInDocument?: boolean;
    onHomePress: () => void;
    documentId?: string;
    userId?: string;
}

const TopSiteBar = ({ className = '', isInDocument, onHomePress, documentId, userId }: TopSiteBarProps) => {
    const [documentRecord] = useUserList<MathDocument>({
        key: 'mathDocuments',
        itemId: documentId || '',
    });

    // Get active page ID (same logic as DocumentEditorPage)
    const [activePageId] = useUserVariable<string>({
        key: "activePage",
        defaultValue: "",
    });

    // Get pages for this document (same logic as DocumentEditor)
    const scopedUserIds = userId ? [userId] : ['__loading__'];
    const pageRecords = useUserListGet<MathDocumentPage>({
        key: 'mathDocumentPages',
        filterFor: documentId || '',
        userIds: scopedUserIds,
        returnTop: 100,
    });

    const pages = useMemo(() => pageRecords ?? [], [pageRecords]);

    // Find active page (same logic as DocumentEditor line 35)
    const activePage = pages.find((page) => page.value.id === activePageId.value)?.value || null;

    const sortedPages = useMemo(
        () => pages.map((record) => record.value).sort((a, b) => a.pageNumber - b.pageNumber),
        [pages]
    );

    return (
        <Column className={className}>
            <Row className='justify-between items-center h-24 px-4'>
                <Row className='items-center flex-1'>
                    <TouchableOpacity onPress={onHomePress} className='flex-row items-center gap-2'>
                        {!isInDocument && (
                            <Svg width={48} height={48} viewBox="0 0 32 32">
                                <Rect width="32" height="32" fill="#f3f4f6" rx="4" />
                                <Rect x="6" y="4" width="20" height="24" fill="#ffffff" stroke="#d1d5db" strokeWidth="1" rx="2" />
                                <Line x1="10" y1="10" x2="22" y2="10" stroke="#9ca3af" strokeWidth="1.5" />
                                <Line x1="10" y1="14" x2="22" y2="14" stroke="#9ca3af" strokeWidth="1.5" />
                                <Line x1="10" y1="18" x2="18" y2="18" stroke="#9ca3af" strokeWidth="1.5" />
                                <Line x1="10" y1="22" x2="20" y2="22" stroke="#9ca3af" strokeWidth="1.5" />
                                <Rect x="8" y="6" width="4" height="3" fill="#3b82f6" opacity={0.8} rx="0.5" />
                            </Svg>
                        )}
                        <PoppinsText weight='bold' className='text-lg'>{isInDocument ? '<' : 'Paper'}</PoppinsText>
                    </TouchableOpacity>
                    {isInDocument && documentRecord.value && (
                        <>
                            <DocumentDetails document={documentRecord.value} onDelete={onHomePress} />

                        </>
                    )}


                </Row>
                <Row gap={6} className='items-center'>
                    {isInDocument && documentRecord.value && activePage && (
                        <Row className='border-r border-subtle-border pr-6 h-14 items-center' gap={2}>
                            <ShareButton
                                documentTitle={documentRecord.value.title}
                                documentId={documentId!}
                                activePage={activePage}
                            />
                            <DownloadButton
                                documentTitle={documentRecord.value.title}
                                documentDescription={documentRecord.value.description}
                                pages={sortedPages}
                            />
                        </Row>
                    )}

                    <UserProfileDialog>
                        <AppButton variant="outline-alt" className="h-14 w-14">
                            <UserIcon size={24} />
                        </AppButton>
                    </UserProfileDialog>
                </Row>
            </Row>
        </Column>
    );
};

export default TopSiteBar;
