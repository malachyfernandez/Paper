import * as mupdf from 'mupdf';

const RENDER_SCALE = 2;

/**
 * Rasterize every page of a PDF buffer to PNG bytes.
 * mupdf is a WASM build — no native canvas dependency needed.
 * Returns [{ pageNumber, bytes, name }].
 */
export const renderPdfToPageImages = (pdfBytes, baseName = 'page') => {
    const doc = mupdf.Document.openDocument(new Uint8Array(pdfBytes), 'application/pdf');
    const count = doc.countPages();
    const pages = [];

    for (let index = 0; index < count; index += 1) {
        const page = doc.loadPage(index);
        const pixmap = page.toPixmap(
            [RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0],
            mupdf.ColorSpace.DeviceRGB,
            false,
            true,
        );
        pages.push({
            pageNumber: index + 1,
            bytes: pixmap.asPNG(),
            name: `${baseName}-${index + 1}.png`,
        });
    }

    return pages;
};
