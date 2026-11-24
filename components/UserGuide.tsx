import React from 'react';
import { Book, CheckCircle, Smartphone, Monitor, Layout, Play, Clock, Globe, Shield, Zap, Sparkles, Receipt, Wifi, Info, LayoutGrid, MonitorPlay, Laptop, Bell, Tv } from 'lucide-react';

export const UserGuide: React.FC<{ embeddedPublic?: boolean }> = ({ embeddedPublic = false }) => {
    return (
        <div className={`max-w-5xl mx-auto ${embeddedPublic ? 'px-4 md:px-6 py-8' : 'p-4 md:p-8'} space-y-12 pb-24`}>
            {/* Header section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#0A192F] border border-white/[0.1] p-8 md:p-12 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-sky-500/15 border border-sky-400/30 backdrop-blur-md rounded-xl text-sky-400" aria-hidden="true">
                            <Book size={24} />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-300">Official Operations Manual</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">Kairon User Guide</h1>
                    <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                        The complete operational guide for conference directors, event producers, wedding coordinators, broadcast engineers, and ministry media teams running live shows with Kairon.
                    </p>
                </div>
                <div aria-hidden="true" className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Quick Links / Table of Contents */}
            <nav aria-label="User Guide Table of Contents" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                    { title: 'Identity, Workspaces & Roles', icon: Layout, target: '#getting-started' },
                    { title: 'Program Editor', icon: Sparkles, target: '#editor' },
                    { title: 'Displays & Multi-Screen', icon: MonitorPlay, target: '#displays' },
                    { title: 'Running the Show', icon: Play, target: '#running' },
                    { title: 'Stage Cue Dispatcher', icon: Bell, target: '#cue' },
                    { title: 'Public Portals', icon: Globe, target: '#public' },
                    { title: 'Offline & Local Sync', icon: Wifi, target: '#offline' },
                    { title: 'Command Center', icon: LayoutGrid, target: '#command-center' },
                    { title: 'Stage Teleprompter', icon: Book, target: '#teleprompter' },
                    { title: 'Autopilot Mode', icon: Zap, target: '#autopilot' },
                    { title: 'Stage Contrast Themes', icon: Tv, target: '#pulpit-themes' },
                    { title: 'Desktop Application', icon: Laptop, target: '#desktop' },
                    { title: 'Studio v2.0 & .kairon Files', icon: Receipt, target: '#studio-v2' },
                    { title: 'Broadcast Integrations (OBS/PP7)', icon: Sparkles, target: '#broadcast-integrations' },
                ].map((item, i) => (
                    <a
                        key={i}
                        href={item.target}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-[#121418] border border-slate-200 dark:border-white/[0.08] rounded-2xl hover:border-sky-500 transition-all group hover:shadow-lg"
                    >
                        <div className="p-2 bg-slate-50 dark:bg-white/[0.04] rounded-lg group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-colors" aria-hidden="true">
                            <item.icon size={20} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.title}</span>
                    </a>
                ))}
            </nav>

            {/* Content Sections */}
            <div className="space-y-16">

                {/* 1. Getting Started */}
                <section id="getting-started" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🚀 1. Identity, Workspaces & Roles
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Dual-Engine Workspace Architecture</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                Kairon supports two complementary workspace models so you can run live broadcasts without being tethered to the cloud:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs uppercase">
                                        <Laptop size={16} />
                                        <span>Local Workspace (This PC)</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Stores events directly in a folder on your computer as human-readable <code className="text-[#0EA5E9] font-bold">.kairon</code> files. 100% offline, zero cloud tokens, completely private. You are <strong>always an Administrator</strong> on your local PC.
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs uppercase">
                                        <Globe size={16} />
                                        <span>Cloud Workspaces (Convex)</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Hosted on Convex for multi-user collaboration across devices, real-time stage sync, team member invites, and public attendee QR access for audience mobile devices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Role-Based Access Control */}
                        <div>
                            <div className="flex items-center justify-between mb-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">Industry-standard live broadcast permissions hierarchy</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mb-6">
                                In live broadcasts and event production, roles prevent on-air mistakes. A user’s identity is global, but their role is <strong>strictly workspace-scoped</strong>. You can be an Administrator for your own production company or venue, an Operator at a summit, or a Guest Speaker at a partner event.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Admin */}
                                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Administrator</h4>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Full Authority</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Head of Production, Technical Directors, and Event Leads. Complete control over workspace branding, team member roles, workspace governance, rundown creation, live timers, and hardware matrix outputs.
                                    </p>
                                    <div className="text-[11px] font-mono text-slate-500 space-y-1 pt-2 border-t border-rose-500/10">
                                        <div>✅ Workspace & Team Management (Invites & Roles)</div>
                                        <div>✅ Full Program Editing, Turnaround & Deletion</div>
                                        <div>✅ Master Live Control & Autopilot Overrides</div>
                                        <div>✅ Multi-Screen Hardware Routing (Screens 2 & 3)</div>
                                    </div>
                                </div>

                                {/* Manager */}
                                <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manager</h4>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">Show Caller</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Event Coordinators, Stage Managers, and Associate Directors. Full authority to construct rundowns and run the live broadcast, without access to destructive workspace deletion or admin danger zone settings.
                                    </p>
                                    <div className="text-[11px] font-mono text-slate-500 space-y-1 pt-2 border-t border-sky-500/10">
                                        <div>✅ Create, Edit, Reorder & Duplicate Events</div>
                                        <div>✅ Master Live Timer Controls & Cue Dispatcher</div>
                                        <div>✅ Invite Operators & Speakers to Workspace</div>
                                        <div>❌ Cannot delete Workspace or alter Admin Danger Zone</div>
                                    </div>
                                </div>

                                {/* Operator */}
                                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Operator</h4>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Technical Crew</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Sound, Lighting, Video, Camera, and Prompter Crew. Operates live timing and acknowledges cues in the Tactical Crew HUD. Rundown structural editing is locked to prevent accidental mistakes.
                                    </p>
                                    <div className="text-[11px] font-mono text-slate-500 space-y-1 pt-2 border-t border-emerald-500/10">
                                        <div>✅ Live Timer Start/Pause & Nudge Controls</div>
                                        <div>✅ Crew HUD Cue Acknowledgements (Sound/Video/Lights)</div>
                                        <div>✅ View TV, Prompter, and Monitor Displays</div>
                                        <div>❌ Locked / Read-Only in Program Editor</div>
                                    </div>
                                </div>

                                {/* Speaker */}
                                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Speaker / Presenter</h4>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Stage Talent</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Keynote Speakers, Hosts, MCs, Panelists, and Ministers. Distraction-free stage and prompter views. All technical controls and crew communications are hidden.
                                    </p>
                                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1 pt-2 border-t border-amber-500/10">
                                        <div>Full-screen Stage Display (Yellow / White / Dark)</div>
                                        <div>Auto-scrolling Teleprompter &amp; Personal Notes</div>
                                        <div>Receive Silent Booth Prompt Cues</div>
                                        <div>Technical Controls &amp; Master Timer Hidden</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Summary Table */}
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
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-400">
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Start, Pause & Nudge Live Timer</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-rose-500">❌ No</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Create, Edit & Delete Rundowns</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-rose-500">❌ Read-Only</td>
                                            <td className="p-3 text-rose-500">❌ Read-Only</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Send Stage Cues & Emergency Strobe</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-rose-500">❌ No</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Crew Tactical HUD & Acknowledgements</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-rose-500">❌ Hidden</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Multi-Screen Matrix (Screens 2 & 3)</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-emerald-500">✅ Yes</td>
                                            <td className="p-3 text-rose-500">❌ No</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Invite & Manage Team Members</td>
                                            <td className="p-3 text-emerald-500">✅ All Roles</td>
                                            <td className="p-3 text-sky-500">✅ Operators/Speakers</td>
                                            <td className="p-3 text-rose-500">❌ No</td>
                                            <td className="p-3 text-rose-500">❌ No</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">Workspace Branding & Governance</td>
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

                {/* 2. Program Editor */}
                <section id="editor" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-violet-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            📅 2. The Program Editor
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                The Editor is where you build your run-of-show. Add slots, set durations, and categorize items like <strong className="text-slate-900 dark:text-white">Keynotes</strong>, <strong className="text-slate-900 dark:text-white">Breaks</strong>, <strong className="text-slate-900 dark:text-white">Music</strong>, or <strong className="text-slate-900 dark:text-white">Ceremonies</strong>.
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500">
                                09:00 - Welcome Talk (20m)<br />
                                09:20 - Session 1 (45m)<br />
                                10:05 - Coffee Break (15m)
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#0B2239] to-[#0F172A] border border-sky-500/20 rounded-3xl p-6 text-white flex flex-col justify-between">
                            <div>
                                <Zap size={32} className="mb-4 text-amber-300" aria-hidden="true" />
                                <h3 className="text-xl font-bold mb-2">Smart Importer &amp; Autopilot</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">1-click import from plain text or choose optional templates (Conference Summit, Wedding, Product Launch, Awards Gala, Live Worship, or Blank). Plus zero-token local Autopilot that protects hard event end-times.</p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-300">
                                <CheckCircle size={14} aria-hidden="true" /> 100% Offline &amp; Free in Beta
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Production Displays */}
                <section id="displays" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            📺 3. Production Displays &amp; Multi-Screen Matrix
                        </h2>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Stage & Pulpit Display', icon: Smartphone, path: '/stage', desc: 'Minimalist high-visibility countdown with tally borders and live cue overlays for speakers.' },
                                { title: 'TV / Overflow Screen', icon: Monitor, path: '/tv', desc: 'Split-view with left-hand schedule rundown and right-hand on-air broadcast clock.' },
                                { title: 'Crew Tactical HUD', icon: Layout, path: '/crew', desc: 'Technical booth overview with sound/video readiness toggles and stage feedback.' },
                            ].map((view, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-emerald-500">
                                        <view.icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{view.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{view.desc}</p>
                                    <code className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{view.path}</code>
                                </div>
                            ))}
                        </div>

                        {/* Multi-Screen Matrix */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-3xl p-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <MonitorPlay className="text-emerald-600 dark:text-emerald-400" size={24} aria-hidden="true" />
                                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">Hardware Multi-Screen Matrix Routing</h3>
                            </div>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                Kairon automatically detects all connected physical monitors — whether connected via HDMI, DisplayPort, USB-C, USB tablets, or Wireless (AirPlay/Miracast/GlideX). No HDMI assumption, no guesswork.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Target Screen 2 (Stage / Podium)</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Click <strong>Project to Screen 2</strong> on the Stage Display card to instantly project a fullscreen borderless timer directly onto the speaker&apos;s stage or pulpit monitor — no window dragging required.
                                    </p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Target Screen 3 (Overflow TV)</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Click <strong>Project to Screen 3</strong> on the TV card to simultaneously route the overflow rundown display to a lobby, green room, or secondary venue screen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Running the Show */}
                <section id="running" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-rose-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            4. Running the Show
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Workflow Modes</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400"><strong className="text-slate-900 dark:text-white">Auto Mode:</strong> Timer flows naturally between slots.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-sky-500" aria-hidden="true"></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400"><strong className="text-slate-900 dark:text-white">Manual Mode:</strong> You control every transition with &quot;Next&quot;.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-8">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Handling Overtime</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    If a speaker goes over their allotted time, the timer turns <strong className="text-rose-500">Red</strong> and starts counting up, showing exactly how many minutes the event is delayed.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Stage Cue Dispatcher */}
                <section id="cue" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-amber-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            5. Stage Cue Dispatcher &amp; Emergency Alert
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-8 space-y-6">
                            <p className="text-slate-700 dark:text-amber-200/90 leading-relaxed">
                                The <strong>Stage Cue Console</strong> allows booth operators to communicate silently and instantly with speakers on stage — without interrupting the live program.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" aria-hidden="true"></span>
                                        Standard Banner Mode
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Displays a high-contrast prompt banner on the stage screen. Ideal for polite reminders such as <em>&quot;WRAP UP IN 1 MINUTE&quot;</em>, <em>&quot;ADJUST MIC CLOSER&quot;</em>, or <em>&quot;NEXT SPEAKER READY&quot;</em>.
                                    </p>
                                </div>
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/30 space-y-3">
                                    <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                                        <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" aria-hidden="true"></span>
                                        Emergency Hard-Stop Alert (WCAG Safe)
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Displays a full-screen red alert with a slow, WCAG 2.3.1 photosensitivity-safe pulse (automatically static when <code>prefers-reduced-motion</code> is enabled). Use for urgent hard stops such as <em>&quot;TIME EXPIRED — WRAP UP NOW&quot;</em>.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-amber-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                <p><strong>Operator Hold:</strong> Cues remain pinned on the stage display until the operator clicks <strong>Clear Stage Overlay</strong>, ensuring the speaker never misses the message.</p>
                                <p><strong>Standby State:</strong> Click <strong>Hold for Cue</strong> to pause timers and show a clean <em>&quot;Waiting For Cue&quot;</em> standby screen — ideal for unexpected transitions or tech pauses mid-event.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Public Portal */}
                <section id="public" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-blue-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            6. Public Portal
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                            <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Sharing is Simple</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Anyone with the public link or QR code can view your live schedule on their phone or laptop without creating an account.
                            </p>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-700 dark:text-blue-400">
                                <Globe size={18} aria-hidden="true" />
                                <span className="text-xs font-mono font-bold">kairon-murex.vercel.app/p/your-event</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group border border-white/[0.08]">
                            <div className="relative z-10">
                                <Shield size={32} className="text-sky-400 mb-4" aria-hidden="true" />
                                <h3 className="font-bold mb-2">iFrame Embedding</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Copy our snippet and embed the live schedule directly onto your conference, wedding, or venue website.
                                </p>
                            </div>
                            <div aria-hidden="true" className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all"></div>
                        </div>
                    </div>
                </section>

                {/* 7. Offline & Local Sync Fallback */}
                <section id="offline" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            7. Offline &amp; Local Sync Fallback
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative">
                        <div className="space-y-6">
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Kairon features a built-in, completely transparent <strong className="text-slate-900 dark:text-white">Local Sync Router</strong> designed for live event venues where internet access is spotty or unavailable.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                        <Wifi size={16} aria-hidden="true" /> 1. Automatic Local Bridge
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        If the internet connection cuts out mid-event, the operator console automatically broadcasts state updates locally using browser-level <code>BroadcastChannel</code> and desktop IPC.
                                    </p>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle size={16} aria-hidden="true" /> 2. Seamless Screen Sync
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Any local screens (Stage Displays, TV Views, Teleprompters) open in neighboring windows or monitors automatically detect the offline state and stay in perfect sync.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl text-xs leading-relaxed">
                                <strong>No setup required:</strong> Disconnect your device&apos;s Wi-Fi, control the live event from the <code>/live</code> page, and all local monitor screens keep updating in real time.
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8. Command Center */}
                <section id="command-center" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-violet-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            8. Multi-Track Command Center
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            For large summits and multi-venue productions, the <strong className="text-slate-900 dark:text-white">Command Center</strong> provides a single screen to monitor and manage multiple active live rundown tracks side-by-side.
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                            <img src="./command_center_mockup.png" alt="Kairon Multi-Track Command Center showing parallel conference rooms and live timers" className="w-full h-auto object-cover max-h-[300px]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">Grid Overview</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Monitor titles, speakers, elapsed percentages, and status alerts for all rooms concurrently.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">Direct Telemetry</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Start, pause, skip forward, or nudge countdown timers directly from the aggregate view.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">Active Launch</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Click any track card to jump straight into the full control cockpit for that room.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. Stage Teleprompter */}
                <section id="teleprompter" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-purple-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            9. Stage Teleprompter Mode
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The <strong className="text-slate-900 dark:text-white">Integrated Teleprompter</strong> merges schedule countdowns with structured Markdown scripts, providing a clean split-screen layout for speakers at the podium or lectern.
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                            <img src="./teleprompter_mockup.png" alt="Kairon Stage Teleprompter showing auto-scrolling script alongside live countdown" className="w-full h-auto object-cover max-h-[300px]" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">How to Set Up Teleprompter Scripts</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-widest block mb-1">1. Add Speaker Scripts</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        In the <strong>Program Editor</strong> or Right Studio Dock <strong>Inspector</strong>, enter your keynote notes or talking points into the <strong>Stage Teleprompter Script</strong> field. Supports <code># Headings</code>, <code>- Bullets</code>, and <code>**bold**</code> syntax.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-widest block mb-1">2. Launch &amp; Sync</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Open <code>/prompter?id=...</code> from Monitors &amp; Displays. Select any slot to preview, or keep <strong>Sync to Live</strong> enabled so the script automatically tracks the running countdown.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 10. Autopilot Mode */}
                <section id="autopilot" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-amber-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            10. Autopilot Mode (Auto-Heal)
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            When events run overtime, organizers face stress recalculating the rest of the rundown. <strong className="text-slate-900 dark:text-white">Autopilot Mode</strong> automates this process cleanly and deterministically.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <Zap className="text-amber-500 shrink-0" size={20} aria-hidden="true" />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Zero-Token Local Execution:</strong>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Autopilot runs entirely on local deterministic math. It requires zero cloud tokens and stays instant even when completely offline.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <CheckCircle className="text-sky-500 shrink-0" size={20} aria-hidden="true" />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Smart Overrun Redistribution:</strong>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">If a segment overruns, Autopilot proportionally trims subsequent flexible segments while protecting headline keynotes/messages so you finish exactly at your hard end-time.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 11. Contrast Themes */}
                <section id="pulpit-themes" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-teal-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            11. Stage Contrast Themes
                        </h2>
                    </div>
                    <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
                        <p className="text-slate-300 leading-relaxed mb-6">
                            To combat screen glare from intense stage spotlights, Kairon provides specialized high-visibility themes for Stage and Podium confidence monitors.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-black border border-amber-500/30 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-amber-400">Ambient Yellow</h3>
                                    <p className="text-xs text-slate-400">Optimized for low-light stages with intense spotlight wash.</p>
                                </div>
                                <span className="h-4 w-4 rounded-full bg-amber-400" aria-hidden="true"></span>
                            </div>
                            <div className="p-4 bg-black border border-slate-800 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">Ambient White</h3>
                                    <p className="text-xs text-slate-400">Ultra-high visibility matte white typography on true black.</p>
                                </div>
                                <span className="h-4 w-4 rounded-full bg-white" aria-hidden="true"></span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 12. Native Desktop Application */}
                <section id="desktop" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            12. Native Desktop Application
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Kairon is available as a standalone desktop app for <strong>Windows, macOS, and Linux</strong>, engineered for reliable operation in live production booths and AV racks.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <Laptop className="text-sky-500" size={22} aria-hidden="true" />
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Multi-OS Support</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Windows .exe installer, macOS .dmg, and Linux .AppImage — install once on any booth machine.</p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <MonitorPlay className="text-emerald-500" size={22} aria-hidden="true" />
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Native Multi-Screen Routing</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Detects all connected monitors at the OS level — push Stage or TV views to any screen in one click.</p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <Monitor className="text-amber-500" size={22} aria-hidden="true" />
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Display Sleep Lock</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Automatically prevents the display from sleeping during live events without changing OS power settings.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl text-sm text-blue-900 dark:text-blue-200">
                            <strong>How to get it:</strong> Download the latest Windows, macOS, or Linux desktop build directly from the <a href="https://github.com/patrickudo2004/kairon/releases" target="_blank" rel="noopener noreferrer" className="underline font-bold">Kairon Desktop Releases page</a>.
                        </div>
                    </div>
                </section>

                {/* 13. Studio v2.0 Shell & Portable .kairon Files */}
                <section id="studio-v2" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-sky-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            13. Studio v2.0 Shell &amp; Portable .kairon Files
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Kairon Studio introduces the <strong>Obsidian Broadcast 4-Row / 3-Zone Architecture</strong> — modeled after broadcast control surfaces so operators never have to hunt across tabs during a live show.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <h3 className="font-bold text-sm text-sky-600 dark:text-sky-400">Right Studio Dock &amp; Live 16:9 Preview</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Keep a real-time 16:9 confidence preview of your Stage, TV, Teleprompter, or Broadcast Key output open alongside your rundown, paired with the context-aware <strong>Slot Inspector</strong> and instant <strong>Stage Cue Dispatcher</strong>.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Portable .kairon Show Files</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Use <strong>File &rarr; Save As .kairon File (Ctrl+S)</strong> or <strong>Open .kairon File (Ctrl+O)</strong> to save and transfer complete production schedules (including scripts, booth cues, and branding) via USB drive or AirDrop — 100% offline.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 14. Broadcast Ecosystem Integrations */}
                <section id="broadcast-integrations" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-purple-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            14. Broadcast Ecosystem (OBS, vMix, ATEM &amp; ProPresenter 7)
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Kairon integrates natively with your existing broadcast video switcher and presentation rig:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <h3 className="font-bold text-sm text-purple-600 dark:text-purple-400">/overlay Alpha &amp; Chroma Key Feed</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Add <code>/overlay?id=YOUR_ID&amp;bg=transparent&amp;layout=lower-third</code> as an <strong>OBS Browser Source</strong> or <strong>vMix Web Browser Input</strong> (1920&times;1080), or switch to <code>bg=green</code> / <code>bg=magenta</code> for hardware Upstream Chroma Keying on a <strong>Blackmagic ATEM</strong>.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <h3 className="font-bold text-sm text-sky-600 dark:text-sky-400">ProPresenter 7 Network API Bridge</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Open <strong>Integrations &rarr; ProPresenter 7 Network Bridge</strong> to link Kairon directly to ProPresenter 7 over your booth LAN. Stage Cues fired in Kairon automatically mirror onto ProPresenter&apos;s stage display.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scenarios Section */}
                <section className="bg-slate-100 dark:bg-slate-800/30 rounded-[40px] p-8 md:p-12 border border-white dark:border-slate-800 shadow-inner">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Real World Scenarios</h2>
                        <p className="text-slate-600 dark:text-slate-400">How production teams handle live chaos smoothly.</p>
                    </div>
                    <div className="space-y-6">
                        {[
                            {
                                title: 'The High-Stress Tech Conference',
                                tag: 'Autopilot Focus',
                                badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                                pillClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
                                desc: 'Keynote speaker goes 5 minutes over. AV Producer enables Autopilot. Kairon deterministically trims 1 minute from the next 5 flexible segments so the summit finishes right on time.'
                            },
                            {
                                title: 'The Wedding & Gala Reception',
                                tag: 'Cue Focus',
                                badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
                                desc: 'Bridal party is delayed before grand entrance. Coordinator toggles Hold for Cue. Stage and foyer screens show WAITING FOR CUE. Once ready, hit Resume and the evening flows seamlessly.'
                            },
                            {
                                title: 'The Live Broadcast or Worship Service',
                                tag: 'Offline Focus',
                                badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                pillClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
                                desc: 'Venue internet cuts out mid-program. Kairon never blinks. The wall-clock timer keeps ticking and wireless stage tablets stay synchronized locally until internet reconnects.'
                            }
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800">
                                <div className={`shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl border ${s.badgeClass}`}>
                                    {i + 1}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{s.title}</h3>
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${s.pillClass}`}>{s.tag}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic pr-4 md:pr-12">
                                        &quot;{s.desc}&quot;
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer / CTA */}
            <div className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                    <Info size={16} aria-hidden="true" />
                    <p className="text-sm">
                        Need help or want to share Open Beta feedback? Contact{' '}
                        <a href="mailto:patrickudo2004@gmail.com" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">patrickudo2004@gmail.com</a>.
                    </p>
                </div>
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Kairon Studio &bull; Built for Live Event &amp; Broadcast Teams &bull; 2026</p>
            </div>
        </div>
    );
};
