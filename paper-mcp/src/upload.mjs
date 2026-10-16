import { action } from './api.mjs';

/**
 * Mirrors the app's uploadWebFiles flow:
 *   uploadthing.generatePublicImageUploadUrl -> multipart PUT -> ufsUrl
 * The action is public (no auth arg) just like the app calls it.
 */
export const uploadImage = async ({ bytes, name, type }) => {
    const signed = await action('uploadthing:generatePublicImageUploadUrl', {
        name,
        size: bytes.byteLength,
        type,
        lastModified: Date.now(),
    });

    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type }), name);

    const response = await fetch(signed.url, {
        method: 'PUT',
        headers: {
            Range: 'bytes=0-',
            'x-uploadthing-version': '7.7.4',
        },
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
    }

    const result = await response.json();
    const publicUrl = result.ufsUrl ?? result.url ?? result.appUrl;

    if (!publicUrl) {
        throw new Error('Upload completed but no public URL was returned.');
    }

    return publicUrl;
};
