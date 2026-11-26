import React, { useMemo, useState } from 'react';
import {
  Inbox,
  Bug,
  Lightbulb,
  Palette,
  Heart,
  HelpCircle,
  Star,
  Search,
  Trash2,
  Mail,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  Laptop,
  Globe,
  Monitor,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { isOwnerFeedbackEmail, OWNER_FEEDBACK_EMAIL } from './BetaFeedbackModal';

type StatusFilter = 'all' | 'new' | 'reviewed' | 'planned' | 'resolved';
type CategoryFilter = 'all' | 'bug' | 'feature' | 'ux' | 'praise' | 'other';
type SourceFilter = 'all' | 'website' | 'web_app' | 'desktop_app';

interface BetaFeedbackInboxProps {
  userEmail?: string | null;
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
  new: { label: 'New', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  reviewed: { label: 'Reviewed', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  planned: { label: 'Planned', badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
  bug: { label: 'Bug', icon: Bug, badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  feature: { label: 'Feature', icon: Lightbulb, badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  ux: { label: 'UI / UX', icon: Palette, badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  praise: { label: 'Praise', icon: Heart, badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  other: { label: 'Other', icon: HelpCircle, badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

const SOURCE_META: Record<string, { label: string; icon: React.ElementType }> = {
  website: { label: 'Website', icon: Globe },
  web_app: { label: 'Web App', icon: Monitor },
  desktop_app: { label: 'Desktop App', icon: Laptop },
};

export const BetaFeedbackInbox: React.FC<BetaFeedbackInboxProps> = ({ userEmail }) => {
  const isOwner = isOwnerFeedbackEmail(userEmail);
  const feedbackItems = useConvexQuery(api.feedback.listFeedback, isOwner ? {} : 'skip') as any[] | null | undefined;
  const updateFeedback = useConvexMutation(api.feedback.updateFeedback);
  const deleteFeedback = useConvexMutation(api.feedback.deleteFeedback);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const items = useMemo(() => (Array.isArray(feedbackItems) ? feedbackItems : []), [feedbackItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const newCount = items.filter((i) => i.status === 'new').length;
    const plannedCount = items.filter((i) => i.status === 'planned').length;
    const resolvedCount = items.filter((i) => i.status === 'resolved').length;
    const rated = items.filter((i) => typeof i.rating === 'number' && i.rating > 0);
    const avgRating =
      rated.length > 0
        ? (rated.reduce((sum, i) => sum + (i.rating || 0), 0) / rated.length).toFixed(1)
        : '—';
    return { total, newCount, plannedCount, resolvedCount, avgRating };
  }, [items]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (q) {
        const hay = `${item.message || ''} ${item.contactEmail || ''} ${item.contactName || ''} ${item.workspaceName || ''} ${item.ownerNotes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, sourceFilter, searchQuery]);

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] text-center space-y-3">
        <ShieldCheck size={36} className="mx-auto text-slate-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Private Owner Area</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This inbox is restricted to the Kairon Studio owner account.
        </p>
      </div>
    );
  }

  const handleStatusChange = async (id: any, status: 'new' | 'reviewed' | 'planned' | 'resolved') => {
    setSavingId(String(id));
    try {
      await updateFeedback({ id, status });
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (id: any) => {
    const note = draftNotes[String(id)] ?? '';
    setSavingId(String(id));
    try {
      await updateFeedback({ id, ownerNotes: note });
    } catch (err) {
      console.error('Failed to save owner notes:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: any) => {
    setSavingId(String(id));
    try {
      await deleteFeedback({ id });
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairon-beta-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#0B1628] border border-white/[0.1] text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck size={12} />
            <span>Private Owner Inbox &bull; {OWNER_FEEDBACK_EMAIL}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Inbox size={26} className="text-sky-400" />
            <span>Open Beta Feedback Inbox</span>
          </h1>
          <p className="text-xs text-slate-300">
            Real-time beta submissions from the Public Website, Web Studio, and Desktop App. Invisible to all other users.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          disabled={items.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 border border-white/[0.12] text-xs font-mono font-bold text-white transition-colors shrink-0"
        >
          <Download size={14} />
          <span>Export JSON ({items.length})</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Reports', val: stats.total, color: 'text-slate-900 dark:text-white' },
          { label: 'New / Unread', val: stats.newCount, color: 'text-sky-500' },
          { label: 'Planned', val: stats.plannedCount, color: 'text-violet-400' },
          { label: 'Resolved', val: stats.resolvedCount, color: 'text-emerald-500' },
          { label: 'Avg Rating', val: stats.avgRating === '—' ? '—' : `${stats.avgRating} ★`, color: 'text-amber-400' },
        ].map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-2xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8A93A4]">
              {card.label}
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${card.color}`}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, email, workspace, notes..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-slate-200"
          >
            <option value="all">Status: All</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="planned">Planned</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-slate-200"
          >
            <option value="all">Category: All</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Idea</option>
            <option value="ux">UI / UX</option>
            <option value="praise">Praise</option>
            <option value="other">Other</option>
          </select>

          <select
            aria-label="Filter by source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-slate-200"
          >
            <option value="all">Surface: All</option>
            <option value="website">Public Website</option>
            <option value="web_app">Web App</option>
            <option value="desktop_app">Desktop App</option>
          </select>
        </div>
      </div>

      {/* Feedback Cards */}
      {feedbackItems === undefined ? (
        <div className="py-16 text-center text-xs font-mono text-slate-400">Loading feedback inbox...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 rounded-3xl bg-white dark:bg-[#121418] border border-dashed border-slate-300 dark:border-[#22262E] text-center space-y-2">
          <Sparkles size={28} className="mx-auto text-sky-400 opacity-70" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {items.length === 0 ? 'No beta feedback submissions yet' : 'No submissions match your filters'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submissions sent from the Public Website, Web Studio, or Desktop App will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const idStr = String(item._id);
            const cat = CATEGORY_META[item.category] || CATEGORY_META.other;
            const CatIcon = cat.icon;
            const st = STATUS_META[item.status] || STATUS_META.new;
            const src = SOURCE_META[item.source] || SOURCE_META.web_app;
            const SrcIcon = src.icon;
            const noteVal = draftNotes[idStr] !== undefined ? draftNotes[idStr] : item.ownerNotes || '';
            const noteDirty = noteVal !== (item.ownerNotes || '');

            return (
              <article
                key={idStr}
                className="p-5 md:p-6 rounded-3xl bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] space-y-4 shadow-sm"
              >
                {/* Top Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold uppercase ${cat.badge}`}>
                      <CatIcon size={12} />
                      <span>{cat.label}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold uppercase ${st.badge}`}>
                      {item.status === 'resolved' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      <span>{st.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <SrcIcon size={11} />
                      <span>{src.label}</span>
                      <span>&bull; v{item.appVersion}</span>
                    </span>
                    {typeof item.rating === 'number' && item.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-bold">
                        {Array.from({ length: item.rating }).map((_, idx) => (
                          <Star key={idx} size={11} className="fill-amber-400" />
                        ))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <select
                      aria-label="Change feedback status"
                      disabled={savingId === idStr}
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value as any)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="new">Mark: New</option>
                      <option value="reviewed">Mark: Reviewed</option>
                      <option value="planned">Mark: Planned</option>
                      <option value="resolved">Mark: Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Feedback Message */}
                <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-[#090B0F] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
                  {item.message}
                </p>

                {/* Sender & Technical Context */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      From: <strong className="text-slate-800 dark:text-slate-200">{item.contactName || 'Anonymous Beta Tester'}</strong>
                    </span>
                    {item.contactEmail && (
                      <a
                        href={`mailto:${item.contactEmail}?subject=${encodeURIComponent('Re: Your Kairon Studio Beta Feedback')}`}
                        className="inline-flex items-center gap-1 text-sky-500 hover:underline"
                      >
                        <Mail size={12} />
                        <span>{item.contactEmail}</span>
                      </a>
                    )}
                    {item.workspaceName && <span>Workspace: {item.workspaceName}</span>}
                    {item.pageRoute && <span>Route: {item.pageRoute}</span>}
                    {item.platformInfo && <span>Env: {item.platformInfo}</span>}
                  </div>

                  {confirmDeleteId === idStr ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        disabled={savingId === idStr}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(idStr)}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete feedback entry"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {/* Private Owner Notes */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <input
                    type="text"
                    value={noteVal}
                    onChange={(e) => setDraftNotes((prev) => ({ ...prev, [idStr]: e.target.value }))}
                    placeholder="Private owner triage note (only visible to you)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#090B0F] border border-slate-200 dark:border-[#22262E] text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                  />
                  {noteDirty && (
                    <button
                      type="button"
                      disabled={savingId === idStr}
                      onClick={() => handleSaveNotes(item._id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-colors shrink-0"
                    >
                      <Save size={12} />
                      <span>Save Note</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
