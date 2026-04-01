import { useState, useEffect } from 'react';

/**
 * useTimerSync
 * A drift-proof, autonomous timer hook that calculates the "True" elapsed seconds
 * based on a shard database timestamp (Anchor) and the local system clock.
 * 
 * @param timestamp - The Unix epoch (ms) when the timer started.
 * @param isActive - Whether the timer is currently running.
 * @param baseSeconds - The amount of seconds already elapsed when the timer was started/resumed.
 * @returns The current elapsed seconds.
 */
export const useTimerSync = (
    timestamp: number | null, 
    isActive: boolean, 
    baseSeconds: number = 0
) => {
    const [elapsed, setElapsed] = useState(baseSeconds);

    useEffect(() => {
        if (!isActive || !timestamp) {
            setElapsed(baseSeconds);
            return;
        }

        // Immediate initial calculation to avoid frame-jump
        const initialNow = Date.now();
        setElapsed(Math.floor((initialNow - timestamp) / 1000));

        const interval = setInterval(() => {
            const now = Date.now();
            setElapsed(Math.floor((now - timestamp) / 1000));
        }, 1000); // 1s tick is enough for second-precision countdowns

        return () => clearInterval(interval);
    }, [timestamp, isActive, baseSeconds]);

    return elapsed;
};
