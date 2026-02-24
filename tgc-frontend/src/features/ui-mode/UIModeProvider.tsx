import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAppSelector} from '../../store/hooks';

export type UIMode = 'USER' | 'HOST';

interface UIModeContextValue {
  uiMode: UIMode;
  isHydrating: boolean;
  canUseHostMode: boolean;
  setUIMode: (mode: UIMode) => boolean;
}

const UI_MODE_KEY = 'tgc_ui_mode';

const UIModeContext = createContext<UIModeContextValue | null>(null);

function isHostCapableRole(role?: string | null) {
  return role === 'HOST' || role === 'ADMIN';
}

export default function UIModeProvider({children}: {children: React.ReactNode}) {
  const role = useAppSelector(state => state.auth.user?.role ?? null);
  const [uiMode, setUiModeState] = useState<UIMode>('USER');
  const [isHydrating, setIsHydrating] = useState(true);

  const canUseHostMode = isHostCapableRole(role);
  const prevCanUseHostRef = useRef(canUseHostMode);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(UI_MODE_KEY);
        const nextMode: UIMode =
          canUseHostMode && stored === 'HOST' ? 'HOST' : 'USER';

        if (!cancelled) {
          setUiModeState(nextMode);
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [canUseHostMode]);

  // Auto-switch to HOST when user role transitions to HOST/ADMIN
  useEffect(() => {
    if (!isHydrating && canUseHostMode && !prevCanUseHostRef.current) {
      setUiModeState('HOST');
    }
    prevCanUseHostRef.current = canUseHostMode;
  }, [canUseHostMode, isHydrating]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    AsyncStorage.setItem(UI_MODE_KEY, uiMode).catch(() => {});
  }, [uiMode, isHydrating]);

  const setUIMode = useCallback(
    (mode: UIMode) => {
      if (mode === 'HOST' && !canUseHostMode) {
        return false;
      }
      setUiModeState(mode);
      return true;
    },
    [canUseHostMode],
  );

  const value = useMemo(
    () => ({
      uiMode,
      isHydrating,
      canUseHostMode,
      setUIMode,
    }),
    [uiMode, isHydrating, canUseHostMode, setUIMode],
  );

  return (
    <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>
  );
}

export function useUIMode() {
  const ctx = useContext(UIModeContext);
  if (!ctx) {
    throw new Error('useUIMode must be used within UIModeProvider');
  }
  return ctx;
}
