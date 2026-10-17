import { useState } from 'react';
import { Platform } from 'react-native';
import { useUserVariable } from 'hooks/useUserVariable';
import { useAppAuth } from '../contexts/AppAuthContext';

export interface DownloadPreferences {
    includePageSeparators: boolean;
    includeAiDisclaimer: boolean;
}

const LOCAL_KEY = 'paper.downloadPreferences';

const readLocal = (): Partial<DownloadPreferences> => {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
    } catch {
        return {};
    }
};

const writeLocal = (prefs: Partial<DownloadPreferences>) => {
    if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...readLocal(), ...prefs }));
    } catch {
        // Private browsing etc — preferences just won't persist.
    }
};

/**
 * Download output preferences shared by every download surface. Signed-in
 * users persist them as userVariables; anonymous viewers (the public
 * view-only page) fall back to localStorage so the toggles still work.
 */
export const useDownloadPreferences = () => {
    const { isAuthenticated } = useAppAuth();

    const [separatorsVar, setSeparatorsVar] = useUserVariable<boolean>({
        key: 'downloadPageSeparators',
        defaultValue: true,
        privacy: 'PRIVATE',
    });
    const [disclaimerVar, setDisclaimerVar] = useUserVariable<boolean>({
        key: 'downloadAiDisclaimer',
        defaultValue: true,
        privacy: 'PRIVATE',
    });

    const [localPrefs, setLocalPrefs] = useState<Partial<DownloadPreferences>>(readLocal);

    const setLocal = (patch: Partial<DownloadPreferences>) => {
        setLocalPrefs((prev) => {
            const next = { ...prev, ...patch };
            writeLocal(next);
            return next;
        });
    };

    const includePageSeparators = isAuthenticated
        ? (separatorsVar.value ?? true)
        : (localPrefs.includePageSeparators ?? true);
    const includeAiDisclaimer = isAuthenticated
        ? (disclaimerVar.value ?? true)
        : (localPrefs.includeAiDisclaimer ?? true);

    return {
        includePageSeparators,
        includeAiDisclaimer,
        setIncludePageSeparators: (value: boolean) =>
            isAuthenticated ? setSeparatorsVar(value) : setLocal({ includePageSeparators: value }),
        setIncludeAiDisclaimer: (value: boolean) =>
            isAuthenticated ? setDisclaimerVar(value) : setLocal({ includeAiDisclaimer: value }),
    };
};
