import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Palette,
  Heart,
  HelpCircle,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  Loader2,
} from 'lucide-react';
import { convex } from '../services/convexClient';
import { api } from '../convex/_generated/api';
import { CURRENT_APP_VERSION, detectPlatform, openDownloadUrl } from '../services/updateService';

export type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'praise' | 'other';
export type FeedbackSource = 'website' | 'web_app' | 'desktop_app';

export const OWNER_FEEDBACK_EMAIL = 'patrickudo2004@gmail.com';

export function isOwnerFeedbackEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === OWNER_FEEDBACK_EMAIL;
}

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: FeedbackSource;
  defaultEmail?: string;
  defaultName?: string;
  workspaceName?: string;
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-rose-400 border-rose-500/35 bg-rose-500/15' },
  { id: 'feature', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-300 border-amber-400/35 bg-amber-500/15' },
  { id: 'ux', label: 'UI & Workflow', icon: Palette, color: 'text-sky-300 border-sky-400/35 bg-sky-500/15' },
  { id: 'praise', label: 'Love It', icon: Heart, color: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/15' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-300 border-white/20 bg-white/10' },
];

export const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({
  isOpen,
  onClose,
  source,
  defaultEmail = '',
  defaultName = '',
  workspaceName = '',
}) => {
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContactEmail((prev) => prev || defaultEmail || '');
      setContactName((prev) => prev || defaultName || '');
      setErrorMsg(null);
    }
  }, [isOpen, defaultEmail, defaultName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const platform = detectPlatform();
  const isElectron =
    typeof window !== 'undefined' &&
    Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);

  const effectiveSource: FeedbackSource = isElectron ? 'desktop_app' : source;
  const currentRoute =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.hash ? ` (${window.location.hash})` : ''}`.slice(0, 120)
      : '/';

  const sourceLabel =
    effectiveSource === 'desktop_app'
      ? `Desktop (${platform.toUpperCase()})`
      : effectiveSource === 'web_app'
      ? 'Web Studio'
      : 'Website';

  const handleResetAndClose = () => {
    setSubmitted(false);
    setMessage('');
    setRating(0);
    setErrorMsg(null);
    onClose();
  };

  const buildMailtoHref = () => {
    const subj = encodeURIComponent(`[Kairon Beta v${CURRENT_APP_VERSION}] ${category.toUpperCase()} Feedback`);
    const body = encodeURIComponent(
      `Category: ${category}\nRating: ${rating ? `${rating}/5` : 'Not set'}\nSource: ${sourceLabel} (v${CURRENT_APP_VERSION})\nRoute: ${currentRoute}\nName: ${contactName || 'Anonymous'}\nEmail: ${contactEmail || 'Not provided'}\n\nMessage:\n${message}`
    );
    return `mailto:${OWNER_FEEDBACK_EMAIL}?subject=${subj}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setErrorMsg('Please write at least a brief note before sending.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const isTestBypass =
        typeof window !== 'undefined' &&
        (window.location.search.includes('testBypass=true') || sessionStorage.getItem('testBypass') === 'true');

      if (isTestBypass) {
        try {
          const existing = JSON.parse(localStorage.getItem('kairon_mock_feedback') || '[]');
          existing.unshift({
            _id: `fb-${Date.now()}`,
            category,
            rating: rating || undefined,
            message: trimmed,
            contactEmail: contactEmail.trim() || undefined,
            contactName: contactName.trim() || undefined,
            source: effectiveSource,
            appVersion: CURRENT_APP_VERSION,
            pageRoute: currentRoute,
            platformInfo: `${platform}${isElectron ? ' / Electron' : ' / Browser'}`,
            workspaceName: workspaceName || undefined,
            status: 'new',
            createdAt: Date.now(),
          });
          localStorage.setItem('kairon_mock_feedback', JSON.stringify(existing));
        } catch {}
        setSubmitted(true);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error('You appear to be offline right now.');
      }

      await convex.mutation(api.feedback.submitFeedback, {
        category,
        rating: rating > 0 ? rating : undefined,
        message: trimmed,
        contactEmail: contactEmail.trim() || undefined,
        contactName: contactName.trim() || undefined,
        source: effectiveSource,
        appVersion: CURRENT_APP_VERSION,
        pageRoute: currentRoute,
        platformInfo: `${platform}${isElectron ? ' / Electron' : ' / Browser'}`,
        workspaceName: workspaceName || undefined,
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('[Kairon Beta Feedback] Submission failed:', err);
      setErrorMsg(
        err?.message ||
          'Could not reach the feedback server right now. You can use the direct email button below instead.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-feedback-modal-title"
      className="fixed inset-0 z-[260] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060709]/80 backdrop-blur-md animate-in fade-in duration-150"
        onClick={handleResetAndClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-lg bg-[#111318] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161922]/80">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400"
              aria-hidden="true"
            >
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 id="beta-feedback-modal-title" className="text-sm font-bold text-white tracking-wide">
                Send Open Beta Feedback
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Sent privately to the Kairon founder &bull; v{CURRENT_APP_VERSION}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close feedback dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your note has been delivered directly to Patrick&apos;s private Kairon Beta Inbox. Every report helps shape Kairon ahead of our full release.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                  setRating(0);
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono font-bold text-slate-200 transition-colors"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-xs font-mono font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                What is this about?
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? cat.color
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon size={13} aria-hidden="true" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Quick Rating */}
            <div className="flex items-center justify-between gap-4 px-3.5 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.07]">
              <span className="text-xs text-slate-300 font-medium">How is Kairon feeling so far? (optional)</span>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Optional satisfaction rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} out of 5`}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        size={17}
                        className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Field */}
            <div className="space-y-1.5">
              <label htmlFor="beta-feedback-message" className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Your Feedback <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="beta-feedback-message"
                required
                rows={4}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what worked well in your live event, any bugs you noticed, or features you'd love added..."
                className="w-full rounded-2xl bg-[#090B0F] border border-white/[0.1] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none resize-y min-h-[104px]"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Context auto-attached: {sourceLabel} &bull; v{CURRENT_APP_VERSION}</span>
                <span>{message.length}/4000</span>
              </div>
            </div>

            {/* Optional Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="beta-feedback-name" className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Your Name (optional)
                </label>
                <input
                  id="beta-feedback-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Media Director"
                  className="w-full rounded-xl bg-[#090B0F] border border-white/[0.1] focus:border-sky-500 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="beta-feedback-email" className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Reply Email (optional)
                </label>
                <input
                  id="beta-feedback-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@organization.org"
                  className="w-full rounded-xl bg-[#090B0F] border border-white/[0.1] focus:border-sky-500 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Error Alert + Email Fallback */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openDownloadUrl(buildMailtoHref())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-mono text-[11px] font-bold transition-colors"
                >
                  <Mail size={12} />
                  <span>Send via Email ({OWNER_FEEDBACK_EMAIL})</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || message.trim().length < 3}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-sky-900/40 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
