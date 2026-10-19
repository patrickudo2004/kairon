import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Power } from 'lucide-react';

export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  onQuickClick?: () => void;
  durationMs?: number; // Default: 1200ms
  label?: string;
  holdingLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'danger' | 'warning' | 'primary';
  disabled?: boolean;
  title?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  onConfirm,
  onQuickClick,
  durationMs = 1200,
  label = 'END EVENT',
  holdingLabel = 'HOLD TO END',
  icon = <Power size={14} className="relative z-10 flex-shrink-0" />,
  className = '',
  variant = 'danger',
  disabled = false,
  title = 'Click to confirm or hold to end this live session'
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently ignore if not allowed by browser permissions
      }
    }
  }, []);

  const stopHolding = useCallback(() => {
    const elapsed = startTimeRef.current !== null ? (performance.now() - startTimeRef.current) : 0;
    const wasHolding = isHoldingRef.current;
    isHoldingRef.current = false;
    setIsHolding(false);
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setProgress(0);

    // If quick-tapped (< 400ms) without completing hold, trigger onQuickClick if available
    if (wasHolding && elapsed > 0 && elapsed < 400 && onQuickClick) {
      onQuickClick();
    }
  }, [onQuickClick]);

  const handleHoldSuccess = useCallback(() => {
    isHoldingRef.current = false;
    setIsHolding(false);
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setProgress(0);
    triggerHaptic([80, 40, 80]);
    onConfirm();
  }, [triggerHaptic, onConfirm]);

  const startHolding = useCallback(() => {
    if (disabled) return;
    isHoldingRef.current = true;
    setIsHolding(true);
    startTimeRef.current = performance.now();
    triggerHaptic(40);

    const tick = (now: number) => {
      if (!isHoldingRef.current || startTimeRef.current === null) return;
      const elapsed = now - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleHoldSuccess();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [disabled, durationMs, handleHoldSuccess, triggerHaptic]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const colorConfig = {
    danger: {
      bg: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30',
      bar: 'bg-rose-600',
      activeRing: 'ring-rose-500/30'
    },
    warning: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30',
      bar: 'bg-amber-500',
      activeRing: 'ring-amber-500/30'
    },
    primary: {
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
      bar: 'bg-indigo-600',
      activeRing: 'ring-indigo-500/30'
    }
  }[variant];

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={startHolding}
      onMouseUp={stopHolding}
      onMouseLeave={stopHolding}
      onTouchStart={startHolding}
      onTouchEnd={stopHolding}
      onTouchCancel={stopHolding}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !isHolding) {
          e.preventDefault();
          startHolding();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          stopHolding();
        }
      }}
      aria-label={label}
      aria-pressed={isHolding}
      className={`relative overflow-hidden border rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all select-none flex items-center justify-center gap-2 shadow-sm min-h-[44px] px-4 py-2.5 outline-none focus-visible:ring-2 ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
          : `${colorConfig.bg} ${isHolding ? `scale-[0.98] ring-2 ${colorConfig.activeRing}` : 'hover:scale-[1.01]'}`
      } ${className}`}
    >
      {/* Progress fill bar */}
      <div
        className={`absolute inset-0 ${colorConfig.bar} opacity-30 origin-left pointer-events-none transition-transform will-change-transform`}
        style={{
          transform: `scaleX(${progress / 100})`,
          transitionDuration: isHolding ? '0ms' : '150ms'
        }}
      />

      {/* Button content */}
      <div className="relative z-10 flex items-center gap-2 pointer-events-none">
        {icon}
        <span className="tabular-nums">
          {isHolding ? `${holdingLabel} (${Math.round(progress)}%)` : label}
        </span>
      </div>
    </button>
  );
};

export default HoldToConfirmButton;
