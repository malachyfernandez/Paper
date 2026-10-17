import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Column from '../../layout/Column';
import LoadingText from './LoadingText';

// Shape of a useUserVariable/useUserList result: syncing means still loading.
type UserVarResult<T = unknown> =
  | {
      state?: {
        isSyncing?: boolean;
      };
      value?: T;
    }
  | undefined;

// Shape of useUserListGet / list-query results: undefined until the first fetch.
type UserVarGetResult<T = unknown> = { value: T }[] | undefined;

type DependencyItem = UserVarResult<unknown> | UserVarGetResult<unknown> | unknown[] | boolean | undefined;

interface LoadingContainerProps {
  children: React.ReactNode;
  /** Things to wait on: userVariable records (state.isSyncing), list-query
   *  results (undefined while fetching), or boolean readiness flags. */
  dependencies: DependencyItem[];
  /** Text to show while loading */
  loadingText: string;
  /** Delay before the loading text fades in (ms) — avoids flashes on fast loads */
  loadingDelayMs?: number;
  /** className applied to both the loading and content containers. Give it
   *  flex/height so the reserved space matches what the content will occupy. */
  className?: string;
  /** Fade-in duration (ms), default 300 */
  fadeInDuration?: number;
  /** Keep children mounted (invisible, non-interactive) while loading so they
   *  can run their own queries and reserve layout space. Default true. */
  keepMounted?: boolean;
  /** Called once the container transitions from loading to ready */
  onReady?: () => void;
}

/**
 * LoadingContainer — wraps content and fades it in once every dependency is
 * ready (adapted from wolfspoint; no body-readiness provider needed).
 *
 * Each dependency:
 * - undefined → loading (list queries still fetching)
 * - { state: { isSyncing: true } } → loading (useUserVariable syncing)
 * - false boolean → loading (explicit flag)
 * - anything else → ready
 *
 * ```tsx
 * <LoadingContainer
 *   dependencies={[documents, folderRecords, viewModeRecord]}
 *   loadingText="Loading your files"
 *   className="flex-1"
 * >
 *   <FileBrowser />
 * </LoadingContainer>
 * ```
 */
const LoadingContainer = ({
  children,
  dependencies,
  loadingText,
  loadingDelayMs,
  className = '',
  fadeInDuration = 300,
  keepMounted = true,
  onReady,
}: LoadingContainerProps) => {
  const isLoading = dependencies.some((dep) => {
    if (dep === undefined) return true;

    if (typeof dep === 'object' && dep !== null && 'state' in dep) {
      const state = (dep as UserVarResult)?.state;
      if (state?.isSyncing === true) return true;
    }

    if (dep === false) return true;

    return false;
  });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        onReady?.();
      }, fadeInDuration);
      return () => clearTimeout(timer);
    }
  }, [isLoading, fadeInDuration, onReady]);

  // keepMounted: children render at opacity 0 so their queries/effects run
  // during the loading phase and the layout space is already reserved.
  const contentOpacity = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  useEffect(() => {
    if (!keepMounted) return;
    contentOpacity.value = isLoading ? 0 : withTiming(1, { duration: fadeInDuration });
  }, [keepMounted, isLoading, fadeInDuration, contentOpacity]);

  if (isLoading && !keepMounted) {
    return (
      <Column className={`items-center justify-center gap-7 ${className}`}>
        <LoadingText text={loadingText} delayMs={loadingDelayMs} />
      </Column>
    );
  }

  if (keepMounted) {
    return (
      <View className={`relative ${className}`}>
        <Animated.View
          className={className}
          style={[contentStyle, { pointerEvents: isLoading ? 'none' : 'auto' }]}>
          {children}
        </Animated.View>
        {isLoading && (
          <Column className="absolute inset-0 min-h-24 items-center justify-center gap-7">
            <LoadingText text={loadingText} delayMs={loadingDelayMs} />
          </Column>
        )}
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(fadeInDuration)} className={className}>
      {children}
    </Animated.View>
  );
};

export default LoadingContainer;
