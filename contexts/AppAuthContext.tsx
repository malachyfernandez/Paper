import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import { api } from '../convex/_generated/api';
import { userCodeSessionCache } from '../utils/userCodeSessionCache';
import { clearUserCodeCookie } from '../utils/userCodeCookie';

type AppAuthUser = {
  source: 'clerk' | 'userCode';
  userId: string;
  name: string;
  email: string;
  sessionToken?: string;
  code?: string;
};

export type AppAuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AppAuthUser | null;
  sessionToken?: string;
  signInWithUserCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AppAuthContext = createContext<AppAuthContextValue | undefined>(undefined);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut: signOutClerk } = useClerk();
  const [storedSessionToken, setStoredSessionToken] = useState<string | null | undefined>(undefined);
  const signInMutation = useMutation((api as any).userCodeAuth.signIn);
  const signOutMutation = useMutation((api as any).userCodeAuth.signOut);

  useEffect(() => {
    let isMounted = true;

    userCodeSessionCache.getSessionToken().then((sessionToken) => {
      if (!isMounted) {
        return;
      }

      setStoredSessionToken(sessionToken);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const bypassSession = useQuery(
    (api as any).userCodeAuth.getSession,
    storedSessionToken ? { sessionToken: storedSessionToken } : 'skip'
  ) as
    | {
        sessionToken: string;
        code: string;
        userId: string;
        name: string;
        email: string;
      }
    | null
    | undefined;

  useEffect(() => {
    if (!storedSessionToken || bypassSession !== null) {
      return;
    }

    userCodeSessionCache.clearSessionToken();
    setStoredSessionToken(null);
  }, [bypassSession, storedSessionToken]);

  const signInWithUserCode = useCallback(
    async (code: string) => {
      const trimmedCode = code.trim();

      if (!trimmedCode) {
        throw new Error('Enter a user code.');
      }

      if (isSignedIn) {
        await signOutClerk();
      }

      const nextSession = await signInMutation({ code: trimmedCode });
      await userCodeSessionCache.saveSessionToken(nextSession.sessionToken);
      setStoredSessionToken(nextSession.sessionToken);
    },
    [isSignedIn, signInMutation, signOutClerk]
  );

  const signOut = useCallback(async () => {
    if (isSignedIn) {
      await signOutClerk();
    }

    if (storedSessionToken) {
      await signOutMutation({ sessionToken: storedSessionToken });
    }

    await userCodeSessionCache.clearSessionToken();
    clearUserCodeCookie();
    setStoredSessionToken(null);
  }, [isSignedIn, signOutClerk, signOutMutation, storedSessionToken]);

  const user = useMemo(() => {
    if (isSignedIn && clerkUser) {
      return {
        source: 'clerk' as const,
        userId: clerkUser.id,
        name: clerkUser.fullName ?? '',
        email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
      };
    }

    if (bypassSession) {
      return {
        source: 'userCode' as const,
        userId: bypassSession.userId,
        name: bypassSession.name,
        email: bypassSession.email,
        sessionToken: bypassSession.sessionToken,
        code: bypassSession.code,
      };
    }

    return null;
  }, [bypassSession, clerkUser, isSignedIn]);

  const isLoading =
    !isClerkLoaded ||
    !isClerkUserLoaded ||
    storedSessionToken === undefined ||
    (!isSignedIn && !!storedSessionToken && bypassSession === undefined);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      user,
      sessionToken: user?.source === 'userCode' ? user.sessionToken : undefined,
      signInWithUserCode,
      signOut,
    }),
    [isLoading, signInWithUserCode, signOut, user]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);

  if (!context) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }

  return context;
}
