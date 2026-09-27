import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Spinner } from 'heroui-native';
import PoppinsText from '../ui/text/PoppinsText';

interface FileDropZoneProps extends PropsWithChildren {
    className?: string;
    enabled?: boolean;
    dropAnywhere?: boolean;
    isBusy?: boolean;
    busyLabel?: string;
    overlayLabel?: string;
    onFiles: (files: File[]) => void;
}

// Only the most recently mounted zone responds to drag/drop events, so a
// drop zone inside a dialog wins over one rendered on the page behind it.
const activeZoneIds: number[] = [];
let nextZoneId = 0;

const FileDropZone = ({
    children,
    className = '',
    enabled = true,
    dropAnywhere = false,
    isBusy = false,
    busyLabel = 'Processing files...',
    overlayLabel = 'Drop files here',
    onFiles,
}: FileDropZoneProps) => {
    const zoneRef = useRef<View | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const dragDepthRef = useRef(0);
    const onFilesRef = useRef(onFiles);
    onFilesRef.current = onFiles;

    useEffect(() => {
        if (Platform.OS !== 'web' || !enabled || typeof window === 'undefined') {
            return;
        }

        const zoneId = ++nextZoneId;
        activeZoneIds.push(zoneId);
        const isTopZone = () => activeZoneIds[activeZoneIds.length - 1] === zoneId;

        const hasFiles = (event: DragEvent) =>
            Array.from(event.dataTransfer?.types ?? []).includes('Files');

        const handleDragEnter = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            dragDepthRef.current += 1;
            if (isTopZone()) {
                setIsDragActive(true);
            }
        };

        const handleDragOver = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        };

        const handleDragLeave = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
                setIsDragActive(false);
            }
        };

        const handleDrop = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            dragDepthRef.current = 0;
            setIsDragActive(false);

            if (!isTopZone()) return;

            const files = Array.from(event.dataTransfer?.files ?? []);
            if (!files.length) return;

            if (!dropAnywhere) {
                const node = zoneRef.current as unknown as HTMLElement | null;
                const target = event.target as Node | null;
                if (!node || typeof node.contains !== 'function' || !target || !node.contains(target)) {
                    return;
                }
            }

            onFilesRef.current(files);
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
            const index = activeZoneIds.indexOf(zoneId);
            if (index !== -1) {
                activeZoneIds.splice(index, 1);
            }
            dragDepthRef.current = 0;
            setIsDragActive(false);
        };
    }, [enabled, dropAnywhere]);

    return (
        <View ref={zoneRef} className={`relative ${className}`}>
            {children}
            {(isDragActive || isBusy) && (
                <View
                    pointerEvents='none'
                    className={`absolute inset-0 z-50 items-center justify-center rounded-lg ${
                        isDragActive && !isBusy
                            ? 'border-2 border-dashed border-accent bg-accent/10'
                            : 'bg-background/60'
                    }`}
                >
                    {isBusy && <Spinner size='sm' />}
                    <PoppinsText weight='medium' className='text-accent mt-2'>
                        {isBusy ? busyLabel : overlayLabel}
                    </PoppinsText>
                </View>
            )}
        </View>
    );
};

export default FileDropZone;
