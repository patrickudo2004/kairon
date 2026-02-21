import { useState, useEffect } from 'react';

interface UseTimerProps {
    isActive: boolean;
    isManualMode: boolean;
    isOnHold?: boolean;
    startTimestamp: number | null;
    initialSeconds: number;
}

export const useTimer = ({ isActive, isManualMode, isOnHold, startTimestamp, initialSeconds }: UseTimerProps) => {
    const [secondsElapsed, setSecondsElapsed] = useState(initialSeconds);

    useEffect(() => {
        setSecondsElapsed(initialSeconds);
    }, [initialSeconds, startTimestamp]);

    useEffect(() => {
        let interval: any;

        if (isActive && !isManualMode && !isOnHold) {
            interval = setInterval(() => {
                if (startTimestamp) {
                    const now = Date.now();
                    const elapsed = Math.floor((now - startTimestamp) / 1000);
                    setSecondsElapsed(elapsed);
                } else {
                    setSecondsElapsed(prev => prev + 1);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, isManualMode, isOnHold, startTimestamp]);

    return secondsElapsed;
};
