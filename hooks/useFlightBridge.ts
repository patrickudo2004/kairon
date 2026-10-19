import { useState, useCallback, useEffect } from 'react';

export const useFlightBridge = () => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isFloatingBridgeOpen, setIsFloatingBridgeOpen] = useState(false);
    const [hasNativePip, setHasNativePip] = useState(false);

    useEffect(() => {
        const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
        setHasNativePip(supported);
    }, []);

    const openFlightBridge = useCallback(async (width = 380, height = 550) => {
        const canUseNativePip = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
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

        // Universal fallback for Electron & browsers without Document PiP: Toggle in-app floating HUD
        setIsFloatingBridgeOpen(prev => !prev);
        return null;
    }, [pipWindow]);

    const closeFlightBridge = useCallback(() => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        }
        setIsFloatingBridgeOpen(false);
    }, [pipWindow]);

    return {
        pipWindow,
        isFloatingBridgeOpen,
        isSupported: true, // Always supported via PiP or Floating HUD
        hasNativePip,
        openFlightBridge,
        closeFlightBridge
    };
};
