import { useState, useEffect, useCallback } from 'react';

export interface ScreenInfo {
  id: string;
  isPrimary: boolean;
  isInternal?: boolean;
  width: number;
  height: number;
  left: number;
  top: number;
  label: string;
}

export const useScreenManagement = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [screens, setScreens] = useState<ScreenInfo[]>([]);
  const [hasSecondaryScreen, setHasSecondaryScreen] = useState<boolean>(false);
  const [screenDetails, setScreenDetails] = useState<any>(null);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'getScreenDetails' in window;
    setIsSupported(supported);

    // Basic heuristic fallback for multi-screen without explicit permission
    if (typeof window !== 'undefined' && window.screen) {
      // If window.screen.isExtended is available
      if ('isExtended' in window.screen && (window.screen as any).isExtended) {
        setHasSecondaryScreen(true);
      }
    }
  }, []);

  const updateScreensList = useCallback((details: any) => {
    if (!details || !details.screens) return;
    const list: ScreenInfo[] = details.screens.map((s: any, idx: number) => ({
      id: s.label || `display-${idx + 1}`,
      isPrimary: s.isPrimary,
      isInternal: s.isInternal,
      width: s.width,
      height: s.height,
      left: s.left,
      top: s.top,
      label: s.label || (s.isPrimary ? 'Primary Display' : `External Display ${idx}`)
    }));
    setScreens(list);
    setHasSecondaryScreen(list.length > 1);
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

      // Listen for display changes (HDMI plugged in or unplugged)
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

  const openOnSecondaryScreen = useCallback(async (path: string, windowName: string = 'kairon_secondary_screen') => {
    // 1. If we have detailed screen info, find the secondary screen
    if (screenDetails && screenDetails.screens && screenDetails.screens.length > 1) {
      const secondary = screenDetails.screens.find((s: any) => !s.isPrimary) || screenDetails.screens[1];
      if (secondary) {
        const left = secondary.availLeft ?? secondary.left ?? 1920;
        const top = secondary.availTop ?? secondary.top ?? 0;
        const width = secondary.availWidth ?? secondary.width ?? 1920;
        const height = secondary.availHeight ?? secondary.height ?? 1080;

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
        return openOnSecondaryScreen(path, windowName);
      }
    }

    // 3. Fallback: Open with large geometry offset towards right
    const fallbackLeft = window.screen.width || 1920;
    return window.open(
      path,
      windowName,
      `left=${fallbackLeft},top=0,width=1920,height=1080,menubar=no,status=no,toolbar=no,location=no`
    );
  }, [screenDetails, isSupported, hasPermission, requestScreenAccess]);

  return {
    isSupported,
    hasPermission,
    screens,
    hasSecondaryScreen,
    requestScreenAccess,
    openOnSecondaryScreen,
  };
};
