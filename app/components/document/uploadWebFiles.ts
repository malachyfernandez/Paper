import { prepareWebFileForUpload, UploadThingReactNativeFile } from '../../../utils/imageCompression';
import { renderPdfFileToImages, isPdfFile } from '../../../utils/pdfToImages';

export interface UploadThingSignedUpload {
    url: string;
    key: string;
}

export interface UploadThingUploadedFileResponse {
    url: string;
    appUrl: string;
    ufsUrl: string;
}

export interface UploadedWebFile {
    id: string;
    previewUrl: string;
    file: File;
    uploadedUrl?: string;
}

export type GenerateUploadUrl = (args: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
}) => Promise<UploadThingSignedUpload>;

export type UploadProgress = {
    phase: 'rendering' | 'uploading';
    completed: number;
    total: number;
};

const UPLOAD_TIMEOUT_MS = 90000;
const UPLOAD_CONCURRENCY = 6;

export const withTimeout = async <T,>(promise: Promise<T>, message: string, timeoutMs: number = UPLOAD_TIMEOUT_MS) => {
    return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
    ]);
};

export const uploadFileToPresignedUrl = async (
    file: UploadThingReactNativeFile,
    signedUpload: UploadThingSignedUpload,
) => {
    return new Promise<UploadThingUploadedFileResponse>(async (resolve, reject) => {
        const formData = new FormData();

        if (file.file) {
            formData.append('file', file.file);
        } else {
            // Create a blob from the URI for React Native
            const response = await fetch(file.uri);
            const blob = await response.blob();
            formData.append('file', blob, file.name);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUpload.url, true);
        xhr.setRequestHeader('Range', 'bytes=0-');
        xhr.setRequestHeader('x-uploadthing-version', '7.7.4');
        xhr.responseType = 'json';
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response as UploadThingUploadedFileResponse);
                return;
            }

            const responseBody = xhr.response
                ? typeof xhr.response === 'string'
                    ? xhr.response
                    : JSON.stringify(xhr.response)
                : '';
            reject(new Error(`Upload failed with status ${xhr.status}${responseBody ? `: ${responseBody}` : ''}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
};

const MAX_UPLOAD_ATTEMPTS = 3;

const withRetry = async <T,>(operation: () => Promise<T>, attempts: number = MAX_UPLOAD_ATTEMPTS): Promise<T> => {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    throw lastError;
};

const uploadPreparedFile = async (
    file: File,
    generateUploadUrl: GenerateUploadUrl,
) => {
    const preparedFile = await withTimeout(
        prepareWebFileForUpload(file),
        'Preparing the image took too long. Please try a smaller image.',
    );

    const signedUpload = await withTimeout(
        generateUploadUrl({
            name: preparedFile.name,
            size: preparedFile.size,
            type: preparedFile.type,
            lastModified: preparedFile.lastModified,
        }),
        'Generating the upload URL took too long. Please try again.',
    );

    const uploadedFile = await withTimeout(
        uploadFileToPresignedUrl(preparedFile, signedUpload),
        'Uploading the image took too long. Please try again.',
    );

    const publicUrl = uploadedFile.ufsUrl ?? uploadedFile.url;

    if (!publicUrl) {
        throw new Error('Upload completed but no public image URL was returned.');
    }

    return { publicUrl, preparedFile };
};

export const isSupportedUploadFile = (file: File) => {
    return isPdfFile(file) || file.type.startsWith('image/');
};

const uploadInBatches = async <T, R>(
    items: T[],
    uploadOne: (item: T) => Promise<R>,
    onProgress?: (completed: number, total: number) => void,
): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;
    let completed = 0;

    const workers = Array.from(
        { length: Math.min(UPLOAD_CONCURRENCY, items.length) },
        async () => {
            while (nextIndex < items.length) {
                const index = nextIndex;
                nextIndex += 1;
                results[index] = await uploadOne(items[index]);
                completed += 1;
                onProgress?.(completed, items.length);
            }
        },
    );

    await Promise.all(workers);
    return results;
};

export const uploadWebFiles = async (
    files: File[],
    generateUploadUrl: GenerateUploadUrl,
    onStatus?: (message: string) => void,
    onProgress?: (progress: UploadProgress) => void,
): Promise<UploadedWebFile[]> => {
    const supportedFiles = files.filter(isSupportedUploadFile);

    if (!supportedFiles.length) {
        throw new Error('Only image and PDF files can be uploaded.');
    }

    const results: UploadedWebFile[] = [];

    for (const file of supportedFiles) {
        if (isPdfFile(file)) {
            onStatus?.('Rendering PDF pages...');
            const renderedPages = await renderPdfFileToImages(
                file,
                (completed, total) => onProgress?.({ phase: 'rendering', completed, total }),
            );
            onStatus?.(`Uploading ${renderedPages.length} pages...`);

            const uploadedPages = await uploadInBatches(
                renderedPages,
                async (page) => {
                    const { publicUrl } = await withRetry(() => uploadPreparedFile(page.file, generateUploadUrl));

                    return {
                        id: page.id,
                        previewUrl: page.previewUrl,
                        file: page.file,
                        uploadedUrl: publicUrl,
                    };
                },
                (completed, total) => {
                    onStatus?.(`Uploading pages... ${completed}/${total}`);
                    onProgress?.({ phase: 'uploading', completed, total });
                },
            );

            results.push(...uploadedPages);
        } else {
            onStatus?.('Uploading image...');
            const { publicUrl, preparedFile } = await withRetry(() => uploadPreparedFile(file, generateUploadUrl));
            onProgress?.({ phase: 'uploading', completed: 1, total: 1 });

            results.push({
                id: preparedFile.name,
                previewUrl: publicUrl,
                file,
                uploadedUrl: publicUrl,
            });
        }
    }

    return results;
};
