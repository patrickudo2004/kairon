import { useState, useCallback, useEffect } from 'react';

export const useFlightBridge = () => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isFloatingBridgeOpen, setIsFloatingBridgeOpen] = useState(false);
    const [hasNativePip, setHasNativePip] = useState(false);

    useEffect(() => {
        const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
        setHasNativePip(supported);

        // Listen for native Electron Flight Bridge window close
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.onFlightBridgeClosed === 'function') {
            const unsub = electron.onFlightBridgeClosed(() => {
                setIsFloatingBridgeOpen(false);
            });
            return () => {
                if (typeof unsub === 'function') unsub();
            };
        }
    }, []);

    const openFlightBridge = useCallback(async (targetProgramId?: string, width = 380, height = 550) => {
        const isElectron = typeof window !== 'undefined' && Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;

        // In Electron desktop runtime, launch true detached native OS BrowserWindow
        if (isElectron && electron && typeof electron.toggleFlightBridge === 'function') {
            try {
                const res = await electron.toggleFlightBridge(targetProgramId);
                setIsFloatingBridgeOpen(Boolean(res?.open));
                return null;
            } catch (err) {
                console.warn('Native Flight Bridge window toggle failed, falling back to in-app floating HUD:', err);
            }
        }

        const canUseNativePip = !isElectron && typeof window !== 'undefined' && 'documentPictureInPicture' in window;
        if (canUseNativePip) {
            try {
                if (pipWindow) {
                    pipWindow.close();
                }

                // @ts-ignore - Experimental API
                const pip = await window.documentPictureInPicture.requestWindow({
                    width,
                    height,
                });

                // Copy all stylesheets from main document
                const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                styles.forEach((styleNode) => {
                    const clone = styleNode.cloneNode(true);
                    pip.document.head.appendChild(clone);
                });

                pip.document.title = 'Kairon Flight Bridge';
                pip.document.body.className = document.body.className;

                pip.addEventListener('pagehide', () => {
                    setPipWindow(null);
                    setIsFloatingBridgeOpen(false);
                });

                setPipWindow(pip);
                setIsFloatingBridgeOpen(true);
                return pip;
            } catch (err) {
                console.warn('Document Picture-in-Picture failed, falling back to in-app floating HUD:', err);
            }
        }

        // Universal fallback for web browsers without Document PiP: Toggle in-app floating HUD
        setIsFloatingBridgeOpen(prev => !prev);
        return null;
    }, [pipWindow]);

    const closeFlightBridge = useCallback(() => {
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.closeFlightBridge === 'function') {
            electron.closeFlightBridge();
        }
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        }
        setIsFloatingBridgeOpen(false);
    }, [pipWindow]);

    const recallFlightBridge = useCallback(() => {
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.recallFlightBridge === 'function') {
            electron.recallFlightBridge();
        }
    }, []);

    return {
        pipWindow,
        isFloatingBridgeOpen,
        isSupported: true, // Always supported via Native Window, PiP, or Floating HUD
        hasNativePip,
        openFlightBridge,
        closeFlightBridge,
        recallFlightBridge
    };
};
