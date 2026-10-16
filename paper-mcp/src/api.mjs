import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Config + session persistence
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), '.paper-mcp');
const SESSION_FILE = join(CONFIG_DIR, 'session.json');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const readJsonFile = (path) => {
    try {
        if (!existsSync(path)) return null;
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return null;
    }
};

const writeJsonFile = (path, value) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
};

/** Strip the `.convex.site` suffix to the `.convex.cloud` API origin if needed. */
export const normalizeConvexUrl = (url) => {
    const trimmed = (url ?? '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return trimmed.replace('.convex.site', '.convex.cloud');
};

/** Parse a repo `.env.local`-style file for EXPO_PUBLIC_CONVEX_URL. */
const convexUrlFromEnvFile = (path) => {
    try {
        if (!existsSync(path)) return '';
        const text = readFileSync(path, 'utf8');
        const match = text.match(/^\s*EXPO_PUBLIC_CONVEX_URL\s*=\s*"?([^"\n]+)"?\s*$/m);
        return match?.[1]?.trim() ?? '';
    } catch {
        return '';
    }
};

export const resolveConvexUrl = () => {
    const fromEnv = normalizeConvexUrl(process.env.PAPER_CONVEX_URL);
    if (fromEnv) return fromEnv;

    const config = readJsonFile(CONFIG_FILE);
    const fromConfig = normalizeConvexUrl(config?.convexUrl);
    if (fromConfig) return fromConfig;

    // Fallbacks: a .env.local sitting next to the server or in the repo root.
    const candidates = [
        join(process.cwd(), '.env.local'),
        join(dirname(new URL(import.meta.url).pathname), '..', '..', '.env.local'),
    ];
    for (const candidate of candidates) {
        const url = normalizeConvexUrl(convexUrlFromEnvFile(candidate));
        if (url) return url;
    }

    return '';
};

const sessionCache = readJsonFile(SESSION_FILE);

const state = {
    convexUrl: resolveConvexUrl(),
    sessionToken: process.env.PAPER_SESSION_TOKEN?.trim() || sessionCache?.sessionToken || '',
    userId: sessionCache?.userId || '',
    name: sessionCache?.name || '',
    email: sessionCache?.email || '',
};

export const getAuthState = () => ({
    convexUrl: state.convexUrl,
    sessionToken: state.sessionToken,
    userId: state.userId,
    name: state.name,
    email: state.email,
    authenticated: Boolean(state.sessionToken && state.userId),
});

export const setConvexUrl = (url) => {
    state.convexUrl = normalizeConvexUrl(url);
    writeJsonFile(CONFIG_FILE, { convexUrl: state.convexUrl });
};

const setSession = ({ sessionToken, userId, name, email }) => {
    state.sessionToken = sessionToken;
    state.userId = userId;
    state.name = name ?? '';
    state.email = email ?? '';
    writeJsonFile(SESSION_FILE, {
        sessionToken,
        userId,
        name: state.name,
        email: state.email,
    });
};

// ---------------------------------------------------------------------------
// Convex HTTP API  (POST /api/{query|mutation|action})
// ---------------------------------------------------------------------------

const callFunction = async (kind, path, args) => {
    if (!state.convexUrl) {
        throw new Error(
            'No Convex URL configured. Set PAPER_CONVEX_URL, save one with the paper_configure tool, or add EXPO_PUBLIC_CONVEX_URL to a .env.local.',
        );
    }

    const response = await fetch(`${state.convexUrl}/api/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, args, format: 'json' }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Convex ${kind} ${path} failed (${response.status}): ${text}`);
    }

    const envelope = await response.json();

    if (envelope.status !== 'success') {
        throw new Error(envelope.errorMessage || `Convex ${kind} ${path} returned an error.`);
    }

    return envelope.value;
};

export const query = (path, args) => callFunction('query', path, args);
export const mutation = (path, args) => callFunction('mutation', path, args);
export const action = (path, args) => callFunction('action', path, args);

// ---------------------------------------------------------------------------
// Auth — exchanges a Paper user code for a session token (userCodeAuth.signIn)
// ---------------------------------------------------------------------------

export const signInWithCode = async (code) => {
    const result = await mutation('userCodeAuth:signIn', { code: code.trim() });
    if (!result?.sessionToken) {
        throw new Error('Sign-in did not return a session token.');
    }
    setSession(result);
    return getAuthState();
};

export const refreshSession = async () => {
    if (!state.sessionToken) return null;

    const session = await query('userCodeAuth:getSession', { sessionToken: state.sessionToken });
    if (!session) {
        state.sessionToken = '';
        return null;
    }

    setSession({
        sessionToken: session.sessionToken,
        userId: session.userId,
        name: session.name,
        email: session.email,
    });
    return getAuthState();
};

/** Try to restore/refresh a session; fall back to PAPER_USER_CODE sign-in. */
export const ensureAuth = async () => {
    if (state.sessionToken) {
        const refreshed = await refreshSession();
        if (refreshed) return refreshed;
    }

    const code = process.env.PAPER_USER_CODE?.trim();
    if (code) {
        return await signInWithCode(code);
    }

    return null;
};

export const requireAuth = async () => {
    const auth = await ensureAuth();
    if (!auth?.authenticated) {
        throw new Error(
            'Not signed in. Call paper_sign_in with your user code, or set PAPER_USER_CODE / PAPER_SESSION_TOKEN.',
        );
    }
    return auth;
};
