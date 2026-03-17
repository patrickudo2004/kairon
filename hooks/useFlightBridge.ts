import { useState, useCallback, useEffect } from 'react';

export const useFlightBridge = () => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('documentPictureInPicture' in window);
    }, []);

    const openFlightBridge = useCallback(async (width = 380, height = 550) => {
        if (!isSupported) {
            console.warn('Document Picture-in-Picture is not supported in this browser.');
            return null;
        }

        try {
            // Close existing if open
            if (pipWindow) {
                pipWindow.close();
            }

            // @ts-ignore - Experimental API
            const pip = await window.documentPictureInPicture.requestWindow({
                width,
                height,
            });

            // Copy all stylesheets from the main document to the PiP window
            // Robustly copy all stylesheets to support both dev (inline <style>) and prod (<link rel="stylesheet">)
            const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach((styleNode) => {
                const clone = styleNode.cloneNode(true);
                pip.document.head.appendChild(clone);
            });

            // Set title and body class for theme support
            pip.document.title = 'Kairon Flight Bridge';
            pip.document.body.className = document.body.className;

            pip.addEventListener('pagehide', () => {
                setPipWindow(null);
            });

            setPipWindow(pip);
            return pip;
        } catch (err) {
            console.error('Failed to open Flight Bridge:', err);
            return null;
        }
    }, [isSupported, pipWindow]);

    const closeFlightBridge = useCallback(() => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        }
    }, [pipWindow]);

    return {
        pipWindow,
        isSupported,
        openFlightBridge,
        closeFlightBridge
    };
};
