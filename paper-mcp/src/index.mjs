#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
    action,
    ensureAuth,
    getAuthState,
    setConvexUrl,
    signInWithCode,
} from './api.mjs';
import {
    createDocument,
    createFolder,
    createPage,
    deleteDocument,
    deleteFolder,
    getDocument,
    listDocuments,
    listFolders,
    listPages,
    moveDocument,
    moveFolder,
    savePage,
    updateDocument,
    updateFolder,
} from './data.mjs';
import { uploadImage } from './upload.mjs';
import { renderPdfToPageImages } from './pdf.mjs';
import { assembleDocumentMarkdown } from './markdown.mjs';

const DEFAULT_GUIDANCE =
    'Convert this handwritten math to Markdown + LaTeX with exact transcription.';

const IMAGE_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};

const ok = (value) => ({
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
});

const fail = (error) => ({
    isError: true,
    content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
});

const tool = (handler) => async (args) => {
    try {
        return ok(await handler(args));
    } catch (error) {
        return fail(error);
    }
};

/** Read a local path or remote URL into { bytes, name, type }. */
const loadSourceBytes = async (source, fallbackName = 'image') => {
    if (/^https?:\/\//i.test(source)) {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Could not fetch ${source} (${response.status}).`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        const name = basename(new URL(source).pathname) || fallbackName;
        const type = response.headers.get('content-type')?.split(';')[0] || IMAGE_TYPES[extname(name).toLowerCase()] || 'image/png';
        return { bytes, name, type };
    }

    const path = resolve(source);
    const bytes = new Uint8Array(await readFile(path));
    const name = basename(path);
    const type = IMAGE_TYPES[extname(name).toLowerCase()] || 'application/octet-stream';
    return { bytes, name, type };
};

const convertPageRecord = async ({ document, page, guidance, followUpPrompt }) => {
    if (!page.imageUrl) throw new Error(`Page ${page.pageNumber} has no image to convert.`);

    const result = await action('mathAi:convertMathImageToMarkdown', {
        imageUrl: page.imageUrl,
        guidance: guidance || DEFAULT_GUIDANCE,
        currentMarkdown: page.markdown?.trim() ? page.markdown : undefined,
        followUpPrompt: followUpPrompt || undefined,
        documentTitle: document.title,
        pageTitle: page.title || `Page ${page.pageNumber}`,
    });

    const nextPage = {
        ...page,
        markdown: result.markdown,
        lastAiPrompt: followUpPrompt || guidance || DEFAULT_GUIDANCE,
        lastGeneratedAt: Date.now(),
    };
    await savePage(nextPage);
    return nextPage;
};

const runWithConcurrency = async (items, worker, limit = 4) => {
    const results = new Array(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (next < items.length) {
                const index = next;
                next += 1;
                results[index] = await worker(items[index], index);
            }
        }),
    );
    return results;
};

// ---------------------------------------------------------------------------

const server = new McpServer({ name: 'paper', version: '0.1.0' });

// --- auth / config ---

server.registerTool('paper_configure', {
    description: 'Save the Convex deployment URL this server should talk to (or set PAPER_CONVEX_URL).',
    inputSchema: { convexUrl: z.string().describe('e.g. https://your-app.convex.cloud') },
}, tool(async ({ convexUrl }) => {
    setConvexUrl(convexUrl);
    return { convexUrl: getAuthState().convexUrl };
}));

server.registerTool('paper_sign_in', {
    description: 'Exchange a Paper user code for a session token (cached in ~/.paper-mcp). Alternatively set PAPER_USER_CODE or PAPER_SESSION_TOKEN.',
    inputSchema: {
        code: z.string().describe('Your Paper user code'),
        convexUrl: z.string().optional().describe('Also save this Convex URL first'),
    },
}, tool(async ({ code, convexUrl }) => {
    if (convexUrl) setConvexUrl(convexUrl);
    return await signInWithCode(code);
}));

server.registerTool('paper_whoami', {
    description: 'Check the current Paper session and Convex URL.',
    inputSchema: {},
}, tool(async () => {
    const auth = await ensureAuth();
    if (!auth?.authenticated) {
        return 'Not signed in. Call paper_sign_in with your user code, or set PAPER_USER_CODE.';
    }
    return auth;
}));

// --- folders ---

server.registerTool('paper_list_folders', {
    description: 'List all document folders (id, name, parentId).',
    inputSchema: {},
}, tool(async () => await listFolders()));

server.registerTool('paper_create_folder', {
    description: 'Create a folder, optionally nested under parentId.',
    inputSchema: {
        name: z.string(),
        parentId: z.string().nullable().optional(),
    },
}, tool(async (args) => await createFolder(args)));

server.registerTool('paper_rename_folder', {
    description: 'Rename a folder.',
    inputSchema: { folderId: z.string(), name: z.string() },
}, tool(async ({ folderId, name }) => {
    const folders = await listFolders();
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (!folder) throw new Error(`Folder "${folderId}" not found.`);
    return await updateFolder(folder, { name: name.trim() || folder.name });
}));

server.registerTool('paper_move_folder', {
    description: 'Move a folder under parentId (null = root). Refuses to move a folder into itself or its descendants.',
    inputSchema: { folderId: z.string(), parentId: z.string().nullable().optional() },
}, tool(async ({ folderId, parentId = null }) => await moveFolder({ folderId, parentId })));

server.registerTool('paper_delete_folder', {
    description: 'Delete a folder. Documents inside become unfiled; subfolders move up to the deleted folder\'s parent.',
    inputSchema: { folderId: z.string() },
}, tool(async ({ folderId }) => await deleteFolder(folderId)));

// --- documents ---

server.registerTool('paper_list_documents', {
    description: 'List documents. Pass folderId to filter (null = unfiled only, omit = all).',
    inputSchema: { folderId: z.string().nullable().optional() },
}, tool(async ({ folderId }) => await listDocuments(folderId)));

server.registerTool('paper_get_document', {
    description: 'Get a document with its pages (imageUrl, markdown, pageNumber).',
    inputSchema: { documentId: z.string() },
}, tool(async ({ documentId }) => await getDocument(documentId)));

server.registerTool('paper_get_markdown', {
    description: 'Get the whole document as one combined markdown file. Optionally write it to outputPath.',
    inputSchema: {
        documentId: z.string(),
        outputPath: z.string().optional().describe('If set, write the markdown to this local file'),
    },
}, tool(async ({ documentId, outputPath }) => {
    const document = await getDocument(documentId);
    const markdown = assembleDocumentMarkdown(document);
    if (outputPath) {
        await writeFile(resolve(outputPath), markdown, 'utf8');
        return { outputPath: resolve(outputPath), characters: markdown.length };
    }
    return markdown;
}));

server.registerTool('paper_create_document', {
    description: 'Create an empty document, optionally inside a folder.',
    inputSchema: {
        title: z.string(),
        description: z.string().optional(),
        folderId: z.string().nullable().optional(),
    },
}, tool(async (args) => await createDocument(args)));

server.registerTool('paper_rename_document', {
    description: 'Rename a document and/or change its description.',
    inputSchema: {
        documentId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
    },
}, tool(async ({ documentId, title, description }) => {
    const document = await getDocument(documentId);
    const patch = {};
    if (title !== undefined) patch.title = title.trim() || document.title;
    if (description !== undefined) patch.description = description;
    if (!Object.keys(patch).length) throw new Error('Nothing to update — pass title and/or description.');
    return await updateDocument(document, patch);
}));

server.registerTool('paper_move_document', {
    description: 'Move a document into a folder (folderId null = unfiled at root).',
    inputSchema: { documentId: z.string(), folderId: z.string().nullable().optional() },
}, tool(async ({ documentId, folderId = null }) => await moveDocument({ documentId, folderId })));

server.registerTool('paper_delete_document', {
    description: 'Delete a document and all of its pages.',
    inputSchema: { documentId: z.string() },
}, tool(async ({ documentId }) => await deleteDocument(documentId)));

// --- pages / upload / convert ---

server.registerTool('paper_add_image_page', {
    description: 'Upload an image (local path or https URL) and add it as a page to a document.',
    inputSchema: {
        documentId: z.string(),
        source: z.string().describe('Local file path or https URL of a PNG/JPEG/WebP/GIF image'),
        title: z.string().optional(),
        pageNumber: z.number().int().positive().optional().describe('Defaults to the next page number'),
    },
}, tool(async ({ documentId, source, title = '', pageNumber }) => {
    await getDocument(documentId); // verifies it exists
    const { bytes, name, type } = await loadSourceBytes(source, 'page.png');
    const imageUrl = await uploadImage({ bytes, name, type });
    return await createPage({ documentId, title, imageUrl, pageNumber });
}));

server.registerTool('paper_convert_page', {
    description: 'Run the AI image->markdown conversion on one page and save the result.',
    inputSchema: {
        documentId: z.string(),
        pageNumber: z.number().int().positive(),
        guidance: z.string().optional().describe('Conversion guidance prompt (defaults to the app default)'),
        followUpPrompt: z.string().optional().describe('Adjustment prompt applied on top of the current markdown'),
    },
}, tool(async ({ documentId, pageNumber, guidance, followUpPrompt }) => {
    const document = await getDocument(documentId);
    const page = document.pages.find((candidate) => candidate.pageNumber === pageNumber);
    if (!page) throw new Error(`Document "${documentId}" has no page ${pageNumber}.`);
    return await convertPageRecord({ document, page, guidance, followUpPrompt });
}));

server.registerTool('paper_convert_document', {
    description: 'Convert every page that has an image (skips pages without images). Returns per-page markdown.',
    inputSchema: {
        documentId: z.string(),
        guidance: z.string().optional(),
    },
}, tool(async ({ documentId, guidance }) => {
    const document = await getDocument(documentId);
    const convertible = document.pages.filter((page) => page.imageUrl);
    if (!convertible.length) throw new Error(`Document "${documentId}" has no pages with images.`);
    const converted = await runWithConcurrency(convertible, (page) =>
        convertPageRecord({ document, page, guidance }));
    return {
        documentId,
        convertedPages: converted.map((page) => page.pageNumber),
        skippedPages: document.pages.filter((page) => !page.imageUrl).map((page) => page.pageNumber),
    };
}));

server.registerTool('paper_import_pdf', {
    description:
        'Full pipeline: render a PDF to page images, upload them, create a document with one page each, ' +
        'and optionally convert every page to markdown. source = local path or https URL.',
    inputSchema: {
        source: z.string().describe('Local path or https URL of the PDF'),
        title: z.string().optional().describe('Defaults to the file name'),
        description: z.string().optional(),
        folderId: z.string().nullable().optional(),
        guidance: z.string().optional(),
        convert: z.boolean().optional().describe('Convert all pages to markdown after upload (default true)'),
    },
}, tool(async ({ source, title, description = '', folderId = null, guidance, convert = true }) => {
    const { bytes, name } = await loadSourceBytes(source, 'document.pdf');
    const baseName = name.replace(/\.pdf$/i, '') || 'document';
    const pageImages = renderPdfToPageImages(bytes, baseName);
    if (!pageImages.length) throw new Error('The PDF has no pages.');

    const document = await createDocument({ title: title?.trim() || baseName, description, folderId });

    const uploaded = await runWithConcurrency(pageImages, async (pageImage) => {
        const imageUrl = await uploadImage({ bytes: pageImage.bytes, name: pageImage.name, type: 'image/png' });
        return await createPage({ documentId: document.id, imageUrl, pageNumber: pageImage.pageNumber });
    });

    const result = { document, pages: uploaded.map((page) => page.id), pageCount: uploaded.length };

    if (convert) {
        await runWithConcurrency(uploaded, (page) =>
            convertPageRecord({ document, page, guidance }));
        const refreshed = await getDocument(document.id);
        result.markdown = assembleDocumentMarkdown(refreshed);
    }

    return result;
}));

// ---------------------------------------------------------------------------

await ensureAuth().catch(() => null); // best-effort; tools re-check on demand
await server.connect(new StdioServerTransport());
console.error('paper-mcp server running on stdio');
