import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage the Screen Wake Lock API.
 * Prevents the screen from dimming or locking.
 */
export const useWakeLock = (enabled: boolean = true) => {
    const wakeLockRef = useRef<any>(null);

    const requestWakeLock = useCallback(async () => {
        if (!('wakeLock' in navigator)) {
            console.warn('Wake Lock API not supported in this browser.');
            return;
        }

        try {
            if (!wakeLockRef.current) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                console.log('Screen Wake Lock acquired.');

                // Attach release listener
                wakeLockRef.current.addEventListener('release', () => {
                    console.log('Screen Wake Lock was released.');
                    wakeLockRef.current = null;
                });
            }
        } catch (err: any) {
            console.error(`Failed to acquire Wake Lock: ${err.name}, ${err.message}`);
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            } catch (err: any) {
                console.error(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
            }
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        // Re-acquire if visibility changes (e.g., user switches tabs and comes back)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && enabled) {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [enabled, requestWakeLock, releaseWakeLock]);

    return {
        isActive: !!wakeLockRef.current,
        request: requestWakeLock,
        release: releaseWakeLock
    };
};
