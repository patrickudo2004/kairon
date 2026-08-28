import { useState, useEffect, useCallback } from 'react';

export interface ScreenInfo {
  id: string;
  index: number;
  isPrimary: boolean;
  isInternal?: boolean;
  width: number;
  height: number;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  left: number;
  top: number;
  label: string;
}

export const useScreenManagement = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [screens, setScreens] = useState<ScreenInfo[]>([]);
  const [externalScreens, setExternalScreens] = useState<ScreenInfo[]>([]);
  const [hasSecondaryScreen, setHasSecondaryScreen] = useState<boolean>(false);
  const [screenDetails, setScreenDetails] = useState<any>(null);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'getScreenDetails' in window;
    setIsSupported(supported);

    // Basic heuristic fallback for multi-screen without explicit permission
    if (typeof window !== 'undefined' && window.screen) {
      if ('isExtended' in window.screen && (window.screen as any).isExtended) {
        setHasSecondaryScreen(true);
      }
    }
  }, []);

  const updateScreensList = useCallback((details: any) => {
    if (!details || !details.screens) return;
    const list: ScreenInfo[] = details.screens.map((s: any, idx: number) => {
      const isPrimary = s.isPrimary ?? idx === 0;
      return {
        id: s.label || `display-${idx + 1}`,
        index: idx + 1,
        isPrimary,
        isInternal: s.isInternal,
        width: s.width || 1920,
        height: s.height || 1080,
        availLeft: s.availLeft ?? s.left ?? 0,
        availTop: s.availTop ?? s.top ?? 0,
        availWidth: s.availWidth ?? s.width ?? 1920,
        availHeight: s.availHeight ?? s.height ?? 1080,
        left: s.left ?? 0,
        top: s.top ?? 0,
        label: s.label || (isPrimary ? 'Primary Display (Display 1)' : `External Display ${idx + 1}`)
      };
    });
    setScreens(list);
    const externals = list.filter(s => !s.isPrimary);
    setExternalScreens(externals);
    setHasSecondaryScreen(externals.length > 0);
  }, []);

  const requestScreenAccess = useCallback(async () => {
    if (!isSupported) {
      console.warn('Window Management API not supported in this browser.');
      return false;
    }

    try {
      // @ts-ignore - Window Management API
      const details = await (window as any).getScreenDetails();
      setScreenDetails(details);
      setHasPermission(true);
      updateScreensList(details);

      // Listen for display changes (screens plugged in or unplugged)
      details.addEventListener('screenschange', () => {
        console.log('External display topology changed.');
        updateScreensList(details);
      });

      return true;
    } catch (err: any) {
      console.warn('Window Management API permission denied or error:', err);
      setHasPermission(false);
      return false;
    }
  }, [isSupported, updateScreensList]);

  const openOnTargetScreen = useCallback(async (
    path: string,
    targetScreenIndex?: number,
    windowName: string = 'kairon_target_screen'
  ) => {
    // 1. If we have detailed screen info, find the specified target screen
    if (screenDetails && screenDetails.screens && screenDetails.screens.length > 1) {
      let target: any = null;
      if (typeof targetScreenIndex === 'number') {
        // match by 1-based index (e.g. 2 for Display 2, 3 for Display 3)
        target = screenDetails.screens[targetScreenIndex - 1] || screenDetails.screens[targetScreenIndex];
      }
      
      // If no target found, default to first external screen
      if (!target) {
        target = screenDetails.screens.find((s: any) => !s.isPrimary) || screenDetails.screens[1];
      }

      if (target) {
        const left = target.availLeft ?? target.left ?? 1920;
        const top = target.availTop ?? target.top ?? 0;
        const width = target.availWidth ?? target.width ?? 1920;
        const height = target.availHeight ?? target.height ?? 1080;

        const win = window.open(
          path,
          windowName,
          `left=${left},top=${top},width=${width},height=${height},menubar=no,status=no,toolbar=no,location=no`
        );
        return win;
      }
    }

    // 2. Otherwise request access first
    if (isSupported && !hasPermission) {
      const granted = await requestScreenAccess();
      if (granted && screenDetails) {
        return openOnTargetScreen(path, targetScreenIndex, windowName);
      }
    }

    // 3. Fallback: Open with calculated geometry offset towards right
    const offsetMultiplier = typeof targetScreenIndex === 'number' && targetScreenIndex > 2 ? (targetScreenIndex - 1) : 1;
    const fallbackLeft = (window.screen.width || 1920) * offsetMultiplier;
    return window.open(
      path,
      windowName,
      `left=${fallbackLeft},top=0,width=1920,height=1080,menubar=no,status=no,toolbar=no,location=no`
    );
  }, [screenDetails, isSupported, hasPermission, requestScreenAccess]);

  const openOnSecondaryScreen = useCallback(async (path: string, windowName: string = 'kairon_secondary_screen') => {
    return openOnTargetScreen(path, 2, windowName);
  }, [openOnTargetScreen]);

  return {
    isSupported,
    hasPermission,
    screens,
    externalScreens,
    hasSecondaryScreen,
    requestScreenAccess,
    openOnSecondaryScreen,
    openOnTargetScreen,
  };
};
