import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Book,
  CheckCircle,
  Smartphone,
  Monitor,
  Layout,
  Play,
  Globe,
  Shield,
  Zap,
  Sparkles,
  Receipt,
  Wifi,
  Info,
  LayoutGrid,
  MonitorPlay,
  Laptop,
  Bell,
  Tv,
  Keyboard,
  AppWindow,
  BarChart3,
  MessageSquarePlus,
  ExternalLink,
  ArrowUpRight,
  Layers,
  Clock,
  Radio,
} from 'lucide-react';
import { CURRENT_APP_VERSION, openDownloadUrl } from '../services/updateService';

interface UserGuideProps {
  embeddedPublic?: boolean;
  onOpenFeedback?: () => void;
}

const GuideScreenshot: React.FC<{
  src: string;
  alt: string;
  caption: string;
  badge?: string;
  eager?: boolean;
}> = ({ src, alt, caption, badge, eager = false }) => (
  <figure className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.1] bg-[#07090D] shadow-xl">
    <div className="flex items-center justify-between px-4 py-2 bg-[#0D1017] border-b border-white/[0.07] text-[10px] font-mono text-slate-400">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="w-2 h-2 rounded-full bg-rose-500/80" />
        <span className="w-2 h-2 rounded-full bg-amber-400/80" />
        <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
      </div>
      {badge && (
        <span className="uppercase tracking-widest text-sky-300 font-bold">{badge}</span>
      )}
    </div>
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      className="w-full h-auto block bg-[#07090D]"
    />
    <figcaption className="px-4 py-2.5 bg-[#0B0E14] border-t border-white/[0.07] text-xs text-slate-300 leading-relaxed">
      {caption}
    </figcaption>
  </figure>
);

export const UserGuide: React.FC<UserGuideProps> = ({
  embeddedPublic = false,
  onOpenFeedback,
}) => {
  const navigate = useNavigate();

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const tocItems = [
    { num: '01', title: 'Identity, Workspaces & Roles', icon: Layout, id: 'getting-started' },
    { num: '02', title: 'Program Editor & Smart Importer', icon: Sparkles, id: 'editor' },
    { num: '03', title: 'Displays & Multi-Screen Matrix', icon: MonitorPlay, id: 'displays' },
    { num: '04', title: 'Running the Show (Auto, Manual & End)', icon: Play, id: 'running' },
    { num: '05', title: 'Stage Cue Dispatcher & Alerts', icon: Bell, id: 'cue' },
    { num: '06', title: 'Public Attendee Portals', icon: Globe, id: 'public-portals' },
    { num: '07', title: 'Offline & Local Sync Failover', icon: Wifi, id: 'offline' },
    { num: '08', title: 'Multi-Track Command Center', icon: LayoutGrid, id: 'command-center' },
    { num: '09', title: 'Stage Teleprompter Mode', icon: Book, id: 'teleprompter' },
    { num: '10', title: 'Autopilot Mode & Overtime', icon: Zap, id: 'autopilot' },
    { num: '11', title: 'Stage Contrast Themes', icon: Tv, id: 'pulpit-themes' },
    { num: '12', title: 'Native Desktop Application', icon: Laptop, id: 'desktop' },
    { num: '13', title: 'Studio Shell, Flight Bridge & .kairon', icon: Receipt, id: 'studio-shell' },
    { num: '14', title: 'Broadcast Integrations (OBS/ATEM/PP7)', icon: Layers, id: 'broadcast-integrations' },
  ];

  const InAppJumpBtn: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    if (embeddedPublic) return null;
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs font-mono font-bold transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <ArrowUpRight size={13} aria-hidden="true" />
      </button>
    );
  };

  return (
    <div className={`max-w-5xl mx-auto ${embeddedPublic ? 'px-4 md:px-6 py-8' : 'p-4 md:p-8'} space-y-12 pb-24`}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#0A192F] border border-white/[0.1] p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2 bg-sky-500/15 border border-sky-400/30 backdrop-blur-md rounded-xl text-sky-400" aria-hidden="true">
              <Book size={22} />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-300">
              Official Operations Manual &bull; v{CURRENT_APP_VERSION}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Kairon User Guide</h1>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
            The complete visual operations manual for conference directors, worship media teams, event producers, wedding coordinators, and broadcast engineers running live shows with Kairon.
          </p>
        </div>
        <div aria-hidden="true" className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* Interactive Table of Contents — Uses smooth scrollIntoView (100% safe on Web, Public Site & Desktop HashRouter) */}
      <nav aria-label="User Guide Table of Contents" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tocItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => scrollToSection(e, item.id)}
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#121418] border border-slate-200 dark:border-white/[0.08] rounded-2xl hover:border-sky-500 transition-all group hover:shadow-lg cursor-pointer"
          >
            <div className="p-2 bg-slate-50 dark:bg-white/[0.04] rounded-lg text-slate-500 dark:text-slate-300 group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-colors shrink-0" aria-hidden="true">
              <item.icon size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">SECTION {item.num}</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block truncate">{item.title}</span>
            </div>
          </a>
        ))}
      </nav>

      {/* Content Sections */}
      <div className="space-y-16">
        {/* 1. Identity, Workspaces & Roles */}
        <section id="getting-started" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-indigo-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                1. Identity, Workspaces &amp; Roles
              </h2>
            </div>
            <InAppJumpBtn to="/admin" label="Open Workspace Settings" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Three Ways to Run Kairon</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                Whether you are running a multi-building cloud broadcast or an air-gapped booth laptop with zero Wi-Fi, pick the workspace engine that fits your venue:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs uppercase">
                    <Globe size={15} aria-hidden="true" />
                    <span>Cloud Workspace</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Real-time Convex sync across operator laptops, stage tablets, mobile phones, Crew HUDs, and public attendee QR links — with full team invites and role permissions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs uppercase">
                    <Laptop size={15} aria-hidden="true" />
                    <span>Local Folder (This PC)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Stores rundowns directly in a folder on your computer as human-readable <code className="text-sky-500 font-bold">.kairon</code> files. 100% offline, private, and portable over USB or AirDrop.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold font-mono text-xs uppercase">
                    <Wifi size={15} aria-hidden="true" />
                    <span>Offline Guest Booth</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Launch Kairon in 1 click with zero sign-up or internet connection. Perfect for testing, rehearsal runs, or emergency offline backup booths.
                  </p>
                </div>
              </div>
            </div>

            {/* Role-Based Access Control */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Workspace-scoped permissions prevent accidental on-air edits
                </p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-6">
                Your Kairon login is global, but your role is <strong>strictly scoped per workspace</strong>. You can serve as an Administrator for your venue, an Operator at a guest conference, or a Speaker at another event.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin */}
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" aria-hidden="true" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Administrator</h4>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Full Authority</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Head of Production, Technical Directors, and Event Leads. Full control over workspace branding, team roles, rundown editing, live timing, and hardware matrix routing.
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-rose-500/15">
                    <div>✅ Workspace &amp; Team Management (Invites &amp; Roles)</div>
                    <div>✅ Full Program Editing, Turnaround &amp; Deletion</div>
                    <div>✅ Master Live Control, End Event &amp; Autopilot</div>
                    <div>✅ Multi-Screen Hardware Routing (Screens 2 &amp; 3)</div>
                  </div>
                </div>

                {/* Manager */}
                <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" aria-hidden="true" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manager</h4>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Show Caller</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Event Coordinators, Stage Managers, and Associate Directors. Full authority to build rundowns and call live shows without access to destructive workspace deletion.
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-sky-500/15">
                    <div>✅ Create, Edit, Reorder &amp; Duplicate Events</div>
                    <div>✅ Master Live Timer Controls &amp; Cue Dispatcher</div>
                    <div>✅ Invite Operators &amp; Speakers to Workspace</div>
                    <div>❌ Cannot delete Workspace or alter Admin Danger Zone</div>
                  </div>
                </div>

                {/* Operator */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Operator</h4>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Technical Crew</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sound, Lighting, Video, Camera, and Prompter Crew. Runs live transport controls and acknowledges department cues while structural rundown editing stays safely locked.
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-emerald-500/15">
                    <div>✅ Live Timer Start/Pause, Next/Prev &amp; Nudge</div>
                    <div>✅ Crew HUD Readiness ACKs (Sound / Lights / Video)</div>
                    <div>✅ Launch Stage, TV, Prompter &amp; Overlay Feeds</div>
                    <div>❌ Read-Only in Program Editor</div>
                  </div>
                </div>

                {/* Speaker */}
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Speaker / Presenter</h4>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Stage Talent</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Keynote Speakers, Hosts, MCs, Panelists, and Ministers. Distraction-free confidence timer and teleprompter views with all booth controls hidden.
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-amber-500/15">
                    <div>✅ Full-Screen Stage Display (Yellow / White / Dark)</div>
                    <div>✅ Auto-Scrolling Teleprompter &amp; Personal Notes</div>
                    <div>✅ Receives Silent Stage Cue Banners</div>
                    <div>❌ Technical Controls &amp; Rundown Editing Hidden</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Summary Matrix */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                Permissions Summary Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <caption className="sr-only">Kairon role-based permissions summary across Admin, Manager, Operator, and Speaker roles</caption>
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th scope="col" className="p-3">Feature / Capability</th>
                      <th scope="col" className="p-3 text-rose-500">Admin</th>
                      <th scope="col" className="p-3 text-sky-400">Manager</th>
                      <th scope="col" className="p-3 text-emerald-400">Operator</th>
                      <th scope="col" className="p-3 text-amber-400">Speaker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Start, Pause, Nudge &amp; Hold-to-End Live Timer</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Create, Edit &amp; Delete Rundowns</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ Read-Only</td>
                      <td className="p-3 text-rose-500">❌ Read-Only</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Send Stage Cues &amp; Emergency Alert</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Crew Tactical HUD &amp; Readiness ACKs</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ Hidden</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Multi-Screen Hardware Routing (Screens 2 &amp; 3)</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Invite &amp; Manage Team Members</td>
                      <td className="p-3 text-emerald-500">✅ All Roles</td>
                      <td className="p-3 text-sky-400">✅ Ops / Speakers</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Workspace Branding &amp; Governance</td>
                      <td className="p-3 text-emerald-500">✅ Yes</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                      <td className="p-3 text-rose-500">❌ No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Program Editor & Smart Importer */}
        <section id="editor" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-violet-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                2. The Program Editor &amp; Smart Importer
              </h2>
            </div>
            <InAppJumpBtn to="/editor" label="Open Program Editor" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              Build an entire run-of-show in under two minutes. Set your event title, start time, and target hard end-time — Kairon automatically calculates projected finish times and updates every connected screen as you type.
            </p>

            <GuideScreenshot
              src="./guide/guide-editor.webp"
              alt="Kairon Program Editor showing quick production templates, live event metadata, public attendee portal link, and the Right Studio Dock Slot Inspector with crew production cues and teleprompter script"
              caption="Program Editor with 1-click production templates, projected end-time telemetry, Public Attendee Portal toggle, and the Right Studio Dock Slot Inspector."
              badge="LIVE EDITOR • RIGHT SLOT INSPECTOR"
              eager
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">1-Click Templates</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Load Sunday Service, Midweek Service, Conference Summit, Wedding, Product Launch, or Awards Gala rundowns instantly — or start blank.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400">Smart Importer</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Paste an existing order of service straight from WhatsApp, Word, email, or CSV. Kairon parses titles, speakers, and durations into timed slots automatically.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Crew Cues &amp; Drag-Reorder</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Drag slots to reorder safely — even while live. Attach private Sound/Lights/Video <strong>Production Cues</strong> and Markdown <strong>Teleprompter Scripts</strong> per slot.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">Fast Turnaround</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Running recurring weekly services? Click <strong>Turnaround Service</strong> to archive last week&apos;s timing record and clone a clean copy for next week in one click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Displays & Multi-Screen Matrix */}
        <section id="displays" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-emerald-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                3. Production Displays &amp; Multi-Screen Matrix
              </h2>
            </div>
            <InAppJumpBtn to="/monitors" label="Open Monitors & Displays" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              Open <strong>Sidebar &rarr; Monitors &amp; Displays</strong> to preview, launch, and remotely theme all <strong>six synchronized output feeds</strong> from one hub — each with its own shareable URL, scannable QR code for wireless iPads/phones, and 1-click fullscreen projection.
            </p>

            <GuideScreenshot
              src="./guide/guide-displays.webp"
              alt="Kairon Monitors and Displays hub showing Display Hardware Topology, live ticking thumbnails for Stage Display, TV Overflow Screen, Integrated Teleprompter, Crew Tactical HUD, and the Stage Cue Dispatcher panel"
              caption="Monitors & Displays Hub showing live ticking feed previews, per-display QR codes & theme toggles, Hardware Multi-Screen Topology, and the Stage Cue Dispatcher."
              badge="6 SYNCHRONIZED OUTPUT FEEDS"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Stage & Pulpit Display', icon: Monitor, tag: 'Monitors → Stage', desc: 'Ultra-legible countdown timer with tally borders, Up Next banner, spotlight themes, and live silent cue overlays.' },
                { title: 'TV / Overflow Screen', icon: Tv, tag: 'Monitors → TV', desc: 'Split-screen lobby/green-room broadcast view with full rundown on the left and live clock on the right.' },
                { title: 'Integrated Teleprompter', icon: Book, tag: 'Monitors → Prompter', desc: 'Split-screen countdown paired with auto-scrolling Markdown speaker scripts synced to the live clock.' },
                { title: 'Crew Tactical HUD', icon: Radio, tag: 'Monitors → Crew HUD', desc: 'Booth view for Sound, Lighting, and Video operators with private production cues, 1-tap readiness ACKs, and crew chat.' },
                { title: 'Public Attendee Portal', icon: Globe, tag: 'Monitors → Public', desc: 'Zero-login mobile schedule for guests and congregation members via shareable link or printed QR code.' },
                { title: 'OBS / vMix / ATEM Overlay', icon: Layers, tag: 'Monitors → Overlay', desc: '1080p Lower-Third, Corner Bug, or Bottom Strip with transparent Alpha, Chroma Green, Magenta, or Luma key.' },
              ].map((view) => (
                <div key={view.title} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500" aria-hidden="true">
                      <view.icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      {view.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{view.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{view.desc}</p>
                </div>
              ))}
            </div>

            {/* Hardware Matrix Callout */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <MonitorPlay className="text-emerald-600 dark:text-emerald-400" size={20} aria-hidden="true" />
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Hardware Multi-Screen Matrix Routing</h3>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Kairon auto-detects connected monitors via HDMI, DisplayPort, USB-C, USB tablets, or Wireless (AirPlay/Miracast). Click <strong>Screen 2</strong> (Stage/Pulpit) or <strong>Screen 3</strong> (Overflow TV) directly from the Right Studio Dock or Monitors Hub to project borderless fullscreen windows without dragging windows across screens.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Running the Show */}
        <section id="running" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-rose-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                4. Running the Show (Auto, Manual &amp; Hold-to-End)
              </h2>
            </div>
            <InAppJumpBtn to="/live" label="Open Live Control" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              <strong>Live Control</strong> is your master timing cockpit. Every Start, Pause, Next/Previous skip, <code className="font-mono">+1m / -1m</code> nudge, Hold-for-Cue, and End Event action synchronizes in real time across the Top Transport Bar, Right Output Monitor Dock, and all six connected screens.
            </p>

            <GuideScreenshot
              src="./guide/guide-live-control.webp"
              alt="Kairon Live Control surface counting down 29:42 on Keynote Message with Top Transport Bar, Nudge controls, Hold Cue, Autopilot, Protected End Event button, and mirrored Right Output Monitor"
              caption="Live Control cockpit actively counting down with Top-Bar Quick Transport, Crew S/L/V readiness tally, Protected Hold-to-End button, and live 16:9 Stage Output preview."
              badge="LIVE CONTROL COCKPIT"
            />

            {/* AUTO vs MANUAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Zap size={16} aria-hidden="true" />
                  <span>Auto-Advance Mode (AUTO)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Hands-free continuous flow. The moment a segment reaches <code className="font-mono font-bold">00:00</code>, Kairon automatically transitions every stage monitor, TV screen, and teleprompter into the next rundown slot. Ideal for tightly timed conferences and broadcasts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  <Play size={16} aria-hidden="true" />
                  <span>Manual Advance Mode (MAN)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Operator-led transitions. When a speaker passes <code className="font-mono font-bold">00:00</code>, Kairon never cuts them off prematurely — the clock turns <strong className="text-rose-500">Red</strong>, counts into Overtime (<code className="font-mono">-00:01</code>), and pulses the amber <strong>Next</strong> button until you advance on cue.
                </p>
              </div>
            </div>

            {/* Hold-to-End, Nudges, Zen & Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-rose-500">Protected 1.2s Hold-to-End</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Prevents accidental service cutoffs mid-show. A quick tap flashes <strong>&quot;Hold 1.2s&quot;</strong>; holding continuously for 1.2 seconds cleanly concludes the event and updates Live Control, Top Bar, and all 6 monitors to <strong>SESSION CONCLUDED</strong> simultaneously.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <Smartphone size={14} aria-hidden="true" />
                  <span>Zen Focus &amp; Mobile Control</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Press <strong>Zen (Z)</strong> in the top bar for a clutter-free full-screen control deck on laptops or phones — oversized Play/Pause, Next, <code className="font-mono">+1m/-1m</code> Nudge, and Hold controls built for single-thumb pocket operation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <BarChart3 size={14} aria-hidden="true" />
                  <span>Post-Event Analytics Report</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Click <strong>Report</strong> in the top bar after any event to inspect planned vs. actual duration per segment, overtime variance breakdowns, and printable PDF/CSV debrief exports.
                </p>
              </div>
            </div>

            {/* Compact Broadcast Hotkeys Strip */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D1017] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                <Keyboard size={14} className="text-sky-400" aria-hidden="true" />
                <span>Essential Broadcast Keyboard Shortcuts (Press ? anytime)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px] font-mono">
                {[
                  ['Space', 'Start / Pause'],
                  ['N / P', 'Next / Prev Slot'],
                  ['+ / -', 'Nudge ±1 Min'],
                  ['H', 'Hold for Cue'],
                  ['A / M', 'Autopilot / Mode'],
                  ['Z', 'Zen Focus Deck'],
                  ['Ctrl+K', 'Command Palette'],
                  ['Ctrl+S', 'Save .kairon'],
                  ['Shift+B', 'Recall Flight Bridge'],
                  ['Ctrl+\\', 'Toggle Right Dock'],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                    <kbd className="font-bold text-sky-600 dark:text-sky-300">{key}</kbd>
                    <span className="text-slate-600 dark:text-slate-300 truncate">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Stage Cue Dispatcher & Emergency Alert */}
        <section id="cue" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-amber-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              5. Stage Cue Dispatcher &amp; Emergency Alert
            </h2>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/35 rounded-3xl p-6 md:p-8 space-y-6">
            <p className="text-sm text-slate-700 dark:text-amber-100/90 leading-relaxed">
              The <strong>Stage Cue Console</strong> (available both in <strong>Monitors &amp; Displays</strong> and in the collapsible <strong>Right Studio Dock</strong>) lets booth operators communicate silently and instantly with speakers on stage without breaking the live moment.
            </p>

            <GuideScreenshot
              src="./guide/guide-stage-cues.webp"
              alt="Kairon Stage Display showing live 29:41 countdown with a glowing emerald silent Stage Cue banner reading WRAP UP IN 2 MINUTES — CHOIR STANDING BY"
              caption="Silent Standard Banner delivered directly over the Stage Confidence Monitor without interrupting the audience."
              badge="SILENT STAGE CUE OVERLAY"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
                  Standard Banner Mode
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Renders a high-contrast prompt banner over the stage monitor. Use 1-click quick cues or custom notes such as <em>&quot;WRAP UP IN 2 MINUTES&quot;</em>, <em>&quot;ADJUST MIC CLOSER&quot;</em>, or <em>&quot;CHOIR STANDING BY&quot;</em>.
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" aria-hidden="true" />
                  Emergency Hard-Stop Alert (WCAG Safe)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Displays a full-screen red alert with a gentle, WCAG 2.3.1 photosensitivity-safe pulse (automatically static when <code>prefers-reduced-motion</code> is enabled) for hard stops like <em>&quot;TIME EXPIRED — WRAP UP NOW&quot;</em>.
                </p>
              </div>
            </div>

            <div className="p-5 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-amber-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Cue Auto-Dismiss Timer (15s / 30s / 60s / Sticky):</strong> In the Monitors &amp; Displays Cue Dispatcher, choose whether cues automatically clear after <strong>15s</strong>, <strong>30s</strong> (default), or <strong>60s</strong> — or select <strong>Sticky</strong> to pin the banner until you click <strong>Clear Stage Overlay</strong>.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Hold for Cue (Standby Freeze):</strong> Click <strong>Hold Cue (H)</strong> anytime to pause the countdown and display a calm <em>&quot;WAITING FOR CUE&quot;</em> standby banner across stage and foyer monitors during unexpected transitions or delays.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Public Attendee Portals (Safe ID #public-portals so standalone /public never collides) */}
        <section id="public-portals" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-blue-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              6. Public Attendee Portals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Zero-Login Mobile Sharing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Toggle <strong>Public Enabled</strong> inside the Program Editor to generate a live read-only web link and scannable QR code. Attendees follow the live order of service on their phone with zero account required — while private crew notes and booth cues stay 100% hidden.
              </p>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300">
                <Globe size={16} aria-hidden="true" />
                <span className="text-xs font-mono font-bold truncate">https://kairon-murex.vercel.app/p/your-event-slug</span>
              </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-white/[0.08] space-y-4">
              <div className="relative z-10 space-y-3">
                <Shield size={28} className="text-sky-400" aria-hidden="true" />
                <h3 className="font-bold text-lg">Website iFrame Embedding</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Append <code>?embed=true</code> to your public portal URL to embed a clean, live-updating schedule directly inside your conference, wedding, or church website.
                </p>
              </div>
              <div aria-hidden="true" className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </section>

        {/* 7. Offline & Local Sync Failover */}
        <section id="offline" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-indigo-600 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              7. Offline &amp; Local Sync Failover
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Kairon uses a wall-clock-anchored <strong>Local Sync Router</strong> engineered for live venues where Wi-Fi drops without warning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <Wifi size={15} aria-hidden="true" /> 1. Zero-Drop Local Bridge
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  If venue internet cuts out mid-service, Kairon automatically relays timer ticks, slot changes, and stage cues locally via <code>BroadcastChannel</code>, direct iframe <code>postMessage</code>, and Electron Desktop IPC.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={15} aria-hidden="true" /> 2. Automatic Cloud Reconnect
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  All edits and timing mutations queue in Kairon&apos;s Offline Ledger (shown in the bottom status bar) and reconcile seamlessly once connectivity returns.
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 rounded-2xl text-xs leading-relaxed">
              <strong>Live Booth Golden Rule:</strong> If internet drops mid-event, <strong>do not refresh the browser</strong>. Kairon keeps every local monitor ticking in exact lockstep offline and auto-reconnects silently when Wi-Fi returns.
            </div>
          </div>
        </section>

        {/* 8. Multi-Track Command Center */}
        <section id="command-center" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-violet-600 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                8. Multi-Track Command Center
              </h2>
            </div>
            <InAppJumpBtn to="/command" label="Open Command Center" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Running parallel conference tracks, youth/main auditorium services, or a broadcast pre-show studio simultaneously? The <strong className="text-slate-900 dark:text-white">Multi-Track Command Center</strong> monitors and controls every active live session side-by-side on a single screen.
            </p>

            <GuideScreenshot
              src="./guide/guide-command-center.webp"
              alt="Kairon Multi-Track Command Center displaying three live concurrent tracks ticking side-by-side: Sunday Celebration Service at 29:34, Youth Track at 07:47, and Overflow Studio in red Overtime at -02:40"
              caption="Multi-Track Command Center running 3 concurrent rooms live — including instant red Overtime alerts and per-track Play/Pause, Skip, and ±1m Nudge controls."
              badge="3 CONCURRENT LIVE TRACKS"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">Parallel Telemetry</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">Track active segment titles, speakers, elapsed progress bars, upcoming items, and red Overtime warnings across every room at once.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">Direct Track Control</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">Pause, skip forward/back, or nudge any room by <code className="font-mono">-1m / +1m</code> directly from its Command Center card without switching tabs.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">1-Click Cockpit Jump</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">Click the launch icon on any track card (or switch via <strong>Live Channels</strong> in the sidebar) to take full control of that room.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Stage Teleprompter Mode */}
        <section id="teleprompter" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-purple-600 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              9. Stage Teleprompter Mode
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The <strong className="text-slate-900 dark:text-white">Integrated Teleprompter</strong> combines your live countdown clock on the left with a clean, large-format Markdown script on the right — automatically scrolling in pace with the active countdown timer.
            </p>

            <GuideScreenshot
              src="./guide/guide-teleprompter.webp"
              alt="Kairon Stage Teleprompter displaying active 29:34 countdown and Up Next card on the left with structured Markdown speaker script and Sync to Timer auto-scroll controls on the right"
              caption="Active Stage Teleprompter with live countdown on the left, Sync-to-Timer auto-scrolling script on the right, and Up Next preview."
              badge="LIVE TELEPROMPTER • SYNC TO TIMER"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-1.5">
                <span className="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-widest block">Step 1 — Write Markdown Scripts</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Select any slot in the <strong>Program Editor</strong> or Right Studio Dock <strong>Slot Inspector</strong> and type into <strong>Stage Teleprompter Script</strong>. Supports <code># Headings</code>, <code>## Subheadings</code>, <code>- Bullet lists</code>, and <code>**bold emphasis**</code>.
                </p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-1.5">
                <span className="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-widest block">Step 2 — Launch &amp; Sync to Timer</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Launch <strong>Integrated Teleprompter</strong> from <strong>Monitors &amp; Displays</strong> (or scan its QR code on a podium iPad). Leave <strong>Sync to Timer</strong> enabled so the script scrolls smoothly from start to finish alongside the remaining clock, or click <strong>Pause Scroll</strong> anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Autopilot Mode & Overtime */}
        <section id="autopilot" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-amber-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              10. Autopilot Mode (Deterministic Auto-Heal)
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When a segment runs over into red Overtime, <strong className="text-slate-900 dark:text-white">Autopilot Mode</strong> automatically rebalances upcoming slots using local deterministic math so your event still finishes right at its hard end-time.
            </p>

            <GuideScreenshot
              src="./guide/guide-autopilot-overtime.webp"
              alt="Kairon Live Control in red Overtime at -02:45 with Manual Advance and Autopilot Active enabled, pulsing amber Next button, and mirrored red Overtime stage output preview"
              caption="Red Overtime (-02:45) in Manual Mode with Autopilot ARMED — ready to automatically absorb the overrun from flexible upcoming buffers as soon as you advance."
              badge="OVERTIME RECOVERY • AUTOPILOT ARMED"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex gap-3.5">
                <Zap className="text-amber-500 shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Zero-Token 100% Offline Math</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Runs entirely inside your browser or desktop app — zero cloud AI tokens, zero latency, and guaranteed reliable even with Wi-Fi unplugged.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex gap-3.5">
                <CheckCircle className="text-sky-500 shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Protected Keynote &amp; Worship Floors</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Autopilot trims flexible buffers first (Breaks, Transitions, Announcements, Offerings) while enforcing minimum duration floors on core Keynotes, Sermons, and Worship sets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Stage Contrast Themes */}
        <section id="pulpit-themes" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-teal-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              11. Stage Contrast Themes (Spotlight Glare Protection)
            </h2>
          </div>

          <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 space-y-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              Intense overhead LED spotlights wash out ordinary laptops and tablets. Switch any Stage Display or Teleprompter remotely from <strong>Monitors &amp; Displays</strong> (or via the theme button on the display itself) between Dark, Light, <strong>Ambient Yellow</strong>, and <strong>Ambient White</strong>.
            </p>

            <GuideScreenshot
              src="./guide/guide-stage-themes.webp"
              alt="Side-by-side comparison of Kairon Stage Display in Ambient Yellow high-visibility amber typography on true black and Ambient White matte white typography on true black"
              caption="Real Stage Confidence Monitor captures: Ambient Yellow (left) for harsh overhead spotlight wash, and Ambient White (right) for long-throw auditorium distance."
              badge="AMBIENT YELLOW & AMBIENT WHITE"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black border border-amber-500/35 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-amber-400 text-sm">Ambient Yellow</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Warm high-contrast amber digits on pitch black — eliminates screen bloom in dark sanctuaries and theatrical stages.</p>
                </div>
                <span className="h-4 w-4 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
              </div>
              <div className="p-4 bg-black border border-white/20 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Ambient White</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Razor-sharp matte white typography on true black for maximum legibility across 30+ metre confidence monitor throws.</p>
                </div>
                <span className="h-4 w-4 rounded-full bg-white shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* 12. Native Desktop Application */}
        <section id="desktop" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-blue-600 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              12. Native Desktop Application
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Install Kairon Studio natively on <strong>Windows, macOS, and Linux</strong> for mission-critical AV racks, production laptops, and air-gapped booths.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <Laptop className="text-sky-500" size={20} aria-hidden="true" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cross-Platform Installers</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Windows <code>.exe</code> (Installer &amp; Portable), macOS <code>.dmg</code> (Apple Silicon &amp; Intel), and Linux <code>.AppImage</code> / <code>.deb</code>.</p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <MonitorPlay className="text-emerald-500" size={20} aria-hidden="true" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">OS-Level Screen Matrix</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Zero browser popup blockers or screen-permission prompts — project borderless fullscreen windows onto Screen 2 &amp; Screen 3 in 1 click.</p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <Clock className="text-amber-500" size={20} aria-hidden="true" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Display Sleep Lock &amp; Auto-Archive</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Engages OS <code>powerSaveBlocker</code> so displays never dim mid-service, and auto-archives local <code>.kairon</code> backups to Documents.</p>
              </div>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                <strong>Download Kairon Desktop (v{CURRENT_APP_VERSION}):</strong> Grab the latest signed Windows, macOS, or Linux release directly from GitHub Releases.
              </div>
              <a
                href="https://github.com/patrickudo2004/kairon/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const isElectron = Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);
                  if (isElectron) {
                    e.preventDefault();
                    openDownloadUrl('https://github.com/patrickudo2004/kairon/releases/latest');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider shrink-0 transition-colors"
              >
                <span>Open Releases Page</span>
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* 13. Studio Shell, Flight Bridge & Portable .kairon Files */}
        <section id="studio-shell" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-sky-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              13. Studio Shell, Flight Bridge &amp; Portable .kairon Files
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Kairon&apos;s Obsidian Broadcast shell keeps live confidence previews, floating PiP transport controls, Crew Tactical HUD readiness, and offline <code>.kairon</code> files right at your fingertips — even while another presentation app is in focus.
            </p>

            <GuideScreenshot
              src="./guide/guide-flight-bridge-crew.webp"
              alt="Side-by-side view of Kairon Flight Bridge floating always-on-top Picture-in-Picture controller on the left and the Crew Tactical HUD showing active Sound, Lights, and Video production cue on the right"
              caption="Flight Bridge always-on-top PiP controller (left) floats smoothly over ProPresenter, EasyWorship, PowerPoint, or OBS — paired with Crew Tactical HUD (right) for Sound/Lights/Video readiness."
              badge="FLIGHT BRIDGE PIP + CREW TACTICAL HUD"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-sky-600 dark:text-sky-400">
                  <AppWindow size={16} aria-hidden="true" />
                  <span>Flight Bridge (Always-On-Top)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Click the <strong>Flight Bridge</strong> icon in the top bar to float a compact transport HUD over ProPresenter, EasyWorship, or OBS. Press <strong>Shift+B</strong> (or right-click) to snap it safely back to Screen 1 — our built-in AV Shield prevents it from drifting onto a live projection screen.
                </p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-purple-600 dark:text-purple-400">Right Studio Dock &amp; 16:9 Preview</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Toggle with <strong>Ctrl+\</strong> to keep a live 16:9 preview of Stage, TV, Teleprompter, or OBS Key open alongside your rundown, paired with the <strong>Slot Inspector</strong> and <strong>Stage Cues</strong> panel.
                </p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Portable .kairon Show Files</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Use <strong>File &rarr; Save .kairon File (Ctrl+S)</strong> or <strong>Open (Ctrl+O)</strong> to export and transfer complete production schedules (including scripts, cues, and branding) via USB drive or AirDrop — 100% offline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 14. Broadcast Ecosystem Integrations */}
        <section id="broadcast-integrations" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-1.5 bg-purple-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              14. Broadcast Ecosystem (OBS, vMix, ATEM &amp; ProPresenter 7)
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Open <strong>Integrations</strong> in the top menu bar (or click the Layers icon in the studio header) to generate 1-click browser source URLs and LAN stage bridges for your existing switcher and presentation stack:
            </p>

            <GuideScreenshot
              src="./guide/guide-broadcast-integrations.webp"
              alt="Kairon Broadcast Hardware and Software Bridges dialog showing OBS/vMix/ATEM Overlay layout picker, Alpha/Chroma/Magenta/Luma key mode buttons, stage cue safety toggle, and ProPresenter 7 and Stream Deck tabs"
              caption="Broadcast Hardware & Software Bridges modal: pick Lower-Third, Corner Bug, or Bottom Strip with Alpha, Chroma Green, Magenta, or Luma keying, plus ProPresenter 7 LAN Bridge."
              badge="OBS • vMix • BLACKMAGIC ATEM • PROPRESENTER 7"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-purple-600 dark:text-purple-400">OBS Studio, vMix &amp; Blackmagic ATEM</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Paste the generated 1920&times;1080 <code>/overlay</code> URL as an <strong>OBS Browser Source</strong> or <strong>vMix Web Input</strong> using transparent Alpha, or select <strong>Chroma Green</strong>, <strong>Magenta</strong>, or <strong>Luma</strong> for hardware Upstream Keying on a Blackmagic ATEM. Keep <em>Overlay Stage Cues</em> <strong>OFF</strong> so private booth prompts stay hidden from livestream viewers.
                </p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-sky-600 dark:text-sky-400">ProPresenter 7 LAN Bridge &amp; Stream Deck</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Open the <strong>ProPresenter 7 Bridge</strong> tab to connect Kairon to ProPresenter 7 over your booth LAN — every Stage Cue fired in Kairon automatically mirrors onto ProPresenter&apos;s stage display. Use the <strong>Stream Deck &amp; NDI</strong> tab for hardware button hotkey profiles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Scenarios */}
        <section className="bg-slate-100 dark:bg-slate-800/30 rounded-[36px] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Real-World Playbooks</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">How live teams stay calm when schedules shift on air.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                title: 'The Multi-Session Church Service',
                tag: 'Manual + Cues',
                badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                pillClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                desc: 'Run the service in Manual Mode so worship or sermon moments are never cut off at 00:00. Send a discreet 2-minute Stage Cue banner, float Flight Bridge over EasyWorship/ProPresenter, and press Next once the speaker concludes.'
              },
              {
                title: 'The Tightly Timed Tech Conference',
                tag: 'Auto + Autopilot',
                badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                pillClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
                desc: 'A keynote runs 5 minutes over. With Autopilot armed, Kairon deterministically shaves small buffers off upcoming transitions and Q&A blocks so the summit finishes right on its hard end-time — zero cloud tokens needed.'
              },
              {
                title: 'The Wedding, Gala & Venue Wi-Fi Drop',
                tag: 'Hold + Offline',
                badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
                desc: 'Bridal entrance is delayed and hotel Wi-Fi drops. Toggle Hold for Cue (H) so screens display WAITING FOR CUE cleanly. Never refresh — local sync keeps every connected monitor ticking smoothly until Wi-Fi returns.'
              }
            ].map((s, i) => (
              <div key={s.title} className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-7 flex flex-col md:flex-row gap-5 border border-slate-200/80 dark:border-slate-800">
                <div className={`shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg border ${s.badgeClass}`}>
                  {i + 1}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{s.title}</h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${s.pillClass}`}>{s.tag}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer / Open Beta Feedback CTA */}
      <div className="pt-10 border-t border-slate-200 dark:border-slate-800 text-center space-y-5">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Info size={16} aria-hidden="true" />
            <p className="text-sm">
              Have a question, bug report, or feature suggestion during Open Beta?
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-900/30 transition-all cursor-pointer"
              >
                <MessageSquarePlus size={14} aria-hidden="true" />
                <span>Send Open Beta Feedback</span>
              </button>
            )}
            <a
              href="mailto:patrickudo2004@gmail.com"
              onClick={(e) => {
                const isElectron = Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);
                if (isElectron) {
                  e.preventDefault();
                  openDownloadUrl('mailto:patrickudo2004@gmail.com');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-sky-600 dark:text-sky-300 font-mono text-xs font-semibold transition-colors"
            >
              <span>patrickudo2004@gmail.com</span>
            </a>
          </div>
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Kairon Studio v{CURRENT_APP_VERSION} &bull; Built for Live Event &amp; Broadcast Teams &bull; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
