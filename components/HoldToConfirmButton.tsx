import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Power } from 'lucide-react';

export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  durationMs?: number; // Default: 1200ms
  label?: string;
  holdingLabel?: string;
  tapHintLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'danger' | 'warning' | 'primary';
  disabled?: boolean;
  title?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  onConfirm,
  durationMs = 1200,
  label = 'END EVENT',
  holdingLabel = 'ENDING...',
  tapHintLabel = 'HOLD 1.2s TO END',
  icon = <Power size={14} className="relative z-10 flex-shrink-0" />,
  className = '',
  variant = 'danger',
  disabled = false,
  title = 'Press and hold 1.2 seconds to end this live session'
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const completedRef = useRef(false);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently ignore if not allowed by browser permissions
      }
    }
  }, []);

  const clearHintTimer = useCallback(() => {
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  }, []);

  const flashTapHint = useCallback(() => {
    clearHintTimer();
    setShowTapHint(true);
    hintTimeoutRef.current = window.setTimeout(() => {
      setShowTapHint(false);
      hintTimeoutRef.current = null;
    }, 1800);
  }, [clearHintTimer]);

  const stopHolding = useCallback((showHintOnEarlyRelease = false) => {
    const wasHolding = isHoldingRef.current;
    const elapsed = startTimeRef.current !== null ? performance.now() - startTimeRef.current : 0;
    isHoldingRef.current = false;
    setIsHolding(false);
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setProgress(0);

    if (showHintOnEarlyRelease && wasHolding && !completedRef.current && elapsed < durationMs) {
      flashTapHint();
    }
  }, [durationMs, flashTapHint]);

  const handleHoldSuccess = useCallback(() => {
    completedRef.current = true;
    stopHolding(false);
    clearHintTimer();
    setShowTapHint(false);
    triggerHaptic([80, 40, 80]);
    onConfirm();
  }, [stopHolding, clearHintTimer, triggerHaptic, onConfirm]);

  const startHolding = useCallback(() => {
    if (disabled || isHoldingRef.current) return;
    completedRef.current = false;
    clearHintTimer();
    setShowTapHint(false);
    isHoldingRef.current = true;
    setIsHolding(true);
    startTimeRef.current = performance.now();
    triggerHaptic(35);

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
  }, [disabled, durationMs, clearHintTimer, handleHoldSuccess, triggerHaptic]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      clearHintTimer();
    };
  }, [clearHintTimer]);

  const colorConfig = {
    danger: {
      bg: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30',
      hintBg: 'bg-rose-500/20 text-rose-400 border-rose-400/60 ring-2 ring-rose-500/30',
      bar: 'bg-rose-600',
      activeRing: 'ring-rose-500/40'
    },
    warning: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30',
      hintBg: 'bg-amber-500/20 text-amber-400 border-amber-400/60 ring-2 ring-amber-500/30',
      bar: 'bg-amber-500',
      activeRing: 'ring-amber-500/40'
    },
    primary: {
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
      hintBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-400/60 ring-2 ring-indigo-500/30',
      bar: 'bg-indigo-600',
      activeRing: 'ring-indigo-500/40'
    }
  }[variant];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !completedRef.current && !isHoldingRef.current) {
          flashTapHint();
        }
      }}
      onContextMenu={(e) => {
        // Prevent mobile/tablet long-press menu from cancelling the 1.2s hold
        e.preventDefault();
      }}
      title={title}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        startHolding();
      }}
      onPointerUp={(e) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {}
        stopHolding(true);
      }}
      onPointerCancel={() => stopHolding(false)}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !isHoldingRef.current) {
          e.preventDefault();
          startHolding();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          stopHolding(true);
        }
      }}
      aria-label={`${label} — ${title}`}
      aria-pressed={isHolding}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      className={`relative overflow-hidden border rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all select-none touch-none flex items-center justify-center gap-2 shadow-sm min-h-[44px] px-4 py-2.5 outline-none focus-visible:ring-2 ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
          : showTapHint
            ? colorConfig.hintBg
            : `${colorConfig.bg} ${isHolding ? `scale-[0.98] ring-2 ${colorConfig.activeRing}` : 'hover:scale-[1.01]'}`
      } ${className}`}
    >
      {/* Progress fill bar */}
      <div
        className={`absolute inset-0 ${colorConfig.bar} opacity-35 origin-left pointer-events-none transition-transform will-change-transform`}
        style={{
          transform: `scaleX(${progress / 100})`,
          transitionDuration: isHolding ? '0ms' : '150ms'
        }}
      />

      {/* Button content */}
      <div className="relative z-10 flex items-center gap-2 pointer-events-none">
        {icon}
        <span className="tabular-nums whitespace-nowrap">
          {isHolding
            ? `${holdingLabel} ${Math.round(progress)}%`
            : showTapHint
              ? tapHintLabel
              : label}
        </span>
      </div>
    </button>
  );
};

export default HoldToConfirmButton;
