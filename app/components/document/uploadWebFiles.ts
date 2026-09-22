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

const UPLOAD_TIMEOUT_MS = 90000;

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

            reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
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

export const uploadWebFiles = async (
    files: File[],
    generateUploadUrl: GenerateUploadUrl,
    onStatus?: (message: string) => void,
): Promise<UploadedWebFile[]> => {
    const supportedFiles = files.filter(isSupportedUploadFile);

    if (!supportedFiles.length) {
        throw new Error('Only image and PDF files can be uploaded.');
    }

    const results: UploadedWebFile[] = [];

    for (const file of supportedFiles) {
        if (isPdfFile(file)) {
            onStatus?.('Rendering PDF pages...');
            const renderedPages = await renderPdfFileToImages(file);
            onStatus?.(`Uploading ${renderedPages.length} pages...`);

            const uploadedPages = await Promise.all(
                renderedPages.map(async (page) => {
                    const { publicUrl } = await uploadPreparedFile(page.file, generateUploadUrl);

                    return {
                        id: page.id,
                        previewUrl: page.previewUrl,
                        file: page.file,
                        uploadedUrl: publicUrl,
                    };
                }),
            );

            results.push(...uploadedPages);
        } else {
            onStatus?.('Uploading image...');
            const { publicUrl, preparedFile } = await uploadPreparedFile(file, generateUploadUrl);

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
