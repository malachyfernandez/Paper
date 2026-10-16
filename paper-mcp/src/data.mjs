import { mutation, query, requireAuth } from './api.mjs';

// List keys + write config mirror the app's userLists usage exactly.
const DOCUMENTS_KEY = 'mathDocuments';
const PAGES_KEY = 'mathDocumentPages';
const FOLDERS_KEY = 'mathDocumentFolders';

const ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateId = (length = 12) => {
    let result = '';
    for (let index = 0; index < length; index += 1) {
        result += ID_CHARACTERS[Math.floor(Math.random() * ID_CHARACTERS.length)];
    }
    return result;
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const listItems = async ({ userId, sessionToken }, key, extra = {}) => {
    const records = await query('user_lists_get:search', {
        key,
        userIds: [userId],
        returnTop: 500,
        sessionToken,
        ...extra,
    });
    return (records ?? []).map((record) => record.value);
};

export const listFolders = async () => {
    const auth = await requireAuth();
    return await listItems(auth, FOLDERS_KEY);
};

export const listDocuments = async (folderId) => {
    const auth = await requireAuth();
    const documents = await listItems(auth, DOCUMENTS_KEY);
    if (folderId === undefined) return documents;
    return documents.filter((document) => (document.folderId ?? null) === (folderId ?? null));
};

export const listPages = async (documentId) => {
    const auth = await requireAuth();
    const pages = await listItems(auth, PAGES_KEY, { filterFor: documentId });
    return pages.sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));
};

export const getDocument = async (documentId) => {
    const documents = await listDocuments();
    const document = documents.find((candidate) => candidate.id === documentId);
    if (!document) throw new Error(`Document "${documentId}" not found.`);
    const pages = await listPages(documentId);
    return { ...document, pages };
};

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const documentSetArgs = (document, sessionToken) => ({
    key: DOCUMENTS_KEY,
    itemId: document.id,
    value: document,
    privacy: 'PUBLIC',
    searchKeys: ['title', 'description'],
    sortKey: 'lastOpenedAt',
    sessionToken,
});

const folderSetArgs = (folder, sessionToken) => ({
    key: FOLDERS_KEY,
    itemId: folder.id,
    value: folder,
    privacy: 'PUBLIC',
    searchKeys: ['name'],
    sortKey: 'createdAt',
    sessionToken,
});

export const pageSetArgs = (page, sessionToken) => ({
    key: PAGES_KEY,
    itemId: page.id,
    value: page,
    privacy: 'PUBLIC',
    filterKey: 'documentId',
    searchKeys: ['title', 'markdown'],
    sortKey: 'pageNumber',
    sessionToken,
});

export const createDocument = async ({ title, description = '', folderId = null }) => {
    const auth = await requireAuth();
    const now = Date.now();
    const document = {
        id: generateId(),
        title: title?.trim() || 'Untitled document',
        description,
        createdAt: now,
        lastOpenedAt: now,
        folderId: folderId ?? null,
    };
    await mutation('user_lists:set', documentSetArgs(document, auth.sessionToken));
    return document;
};

export const updateDocument = async (document, patch) => {
    const auth = await requireAuth();
    const next = { ...document, ...patch };
    await mutation('user_lists:set', documentSetArgs(next, auth.sessionToken));
    return next;
};

export const createFolder = async ({ name, parentId = null }) => {
    const auth = await requireAuth();
    const folder = {
        id: generateId(),
        name: name?.trim() || 'New folder',
        createdAt: Date.now(),
        parentId: parentId ?? null,
    };
    await mutation('user_lists:set', folderSetArgs(folder, auth.sessionToken));
    return folder;
};

export const updateFolder = async (folder, patch) => {
    const auth = await requireAuth();
    const next = { ...folder, ...patch };
    await mutation('user_lists:set', folderSetArgs(next, auth.sessionToken));
    return next;
};

export const savePage = async (page) => {
    const auth = await requireAuth();
    await mutation('user_lists:set', pageSetArgs(page, auth.sessionToken));
    return page;
};

const removeItem = async (key, itemId) => {
    const auth = await requireAuth();
    await mutation('user_lists:remove', { key, itemId, sessionToken: auth.sessionToken });
};

// ---------------------------------------------------------------------------
// Higher-level operations
// ---------------------------------------------------------------------------

const findDocument = async (documentId) => {
    const documents = await listDocuments();
    const document = documents.find((candidate) => candidate.id === documentId);
    if (!document) throw new Error(`Document "${documentId}" not found.`);
    return document;
};

const findFolder = async (folderId) => {
    const folders = await listFolders();
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (!folder) throw new Error(`Folder "${folderId}" not found.`);
    return folder;
};

/** Ids of `folderId` plus every descendant — used to block move cycles. */
const folderSubtreeIds = (folderId, folders) => {
    const ids = new Set([folderId]);
    const queue = [folderId];
    while (queue.length) {
        const current = queue.shift();
        for (const folder of folders) {
            if ((folder.parentId ?? null) === current && !ids.has(folder.id)) {
                ids.add(folder.id);
                queue.push(folder.id);
            }
        }
    }
    return ids;
};

export const moveDocument = async ({ documentId, folderId = null }) => {
    const document = await findDocument(documentId);
    if (folderId) await findFolder(folderId);
    return await updateDocument(document, { folderId: folderId ?? null });
};

export const moveFolder = async ({ folderId, parentId = null }) => {
    const folders = await listFolders();
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (!folder) throw new Error(`Folder "${folderId}" not found.`);

    if (parentId) {
        if (!folders.some((candidate) => candidate.id === parentId)) {
            throw new Error(`Destination folder "${parentId}" not found.`);
        }
        if (folderSubtreeIds(folderId, folders).has(parentId)) {
            throw new Error('A folder cannot be moved into itself or one of its own subfolders.');
        }
    }

    return await updateFolder(folder, { parentId: parentId ?? null });
};

/** Same semantics as the app: docs get unfiled, subfolders reparent upward. */
export const deleteFolder = async (folderId) => {
    const folders = await listFolders();
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (!folder) throw new Error(`Folder "${folderId}" not found.`);

    const documents = await listDocuments(folderId);
    for (const document of documents) {
        await updateDocument(document, { folderId: null });
    }

    const children = folders.filter((candidate) => (candidate.parentId ?? null) === folderId);
    for (const child of children) {
        await updateFolder(child, { parentId: folder.parentId ?? null });
    }

    await removeItem(FOLDERS_KEY, folderId);
    return { unfiledDocuments: documents.length, reparentedFolders: children.length };
};

export const deleteDocument = async (documentId) => {
    await findDocument(documentId);
    const pages = await listPages(documentId);
    for (const page of pages) {
        await removeItem(PAGES_KEY, page.id);
    }
    await removeItem(DOCUMENTS_KEY, documentId);
    return { removedPages: pages.length };
};

export const createPage = async ({ documentId, title = '', imageUrl = '', pageNumber }) => {
    const pages = await listPages(documentId);
    const nextNumber = pageNumber ?? (pages.reduce((max, page) => Math.max(max, page.pageNumber ?? 0), 0) + 1);
    const page = {
        id: generateId(),
        documentId,
        pageNumber: nextNumber,
        title,
        imageUrl,
        markdown: '',
        lastAiPrompt: '',
        followUps: [],
    };
    return await savePage(page);
};
