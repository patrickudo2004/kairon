import { Book, CheckCircle, Smartphone, Monitor, Layout, Play, Clock, Globe, Shield, Zap, Sparkles, Receipt, Wifi, Info, LayoutGrid } from 'lucide-react';

export const UserGuide: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32">
            {/* Header section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Book size={24} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-indigo-100">Official Documentation</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Kairon User Guide</h1>
                    <p className="text-lg md:text-xl text-indigo-100 max-w-2xl leading-relaxed">
                        The ultimate guide to mastering Kairon 2.0. From your first login to running mission-critical conferences with cloud-powered real-time sync.
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Quick Links / Table of Contents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: 'Identity & Workspaces', icon: Layout, target: '#getting-started' },
                    { title: 'Program Editor', icon: Sparkles, target: '#editor' },
                    { title: 'Production Displays', icon: Monitor, target: '#displays' },
                    { title: 'Running the Show', icon: Play, target: '#running' },
                    { title: 'The Cue System', icon: Zap, target: '#cue' },
                    { title: 'Public Portals', icon: Globe, target: '#public' },
                    { title: 'Offline & Local Sync', icon: Wifi, target: '#offline' },
                    { title: 'Command Center', icon: LayoutGrid, target: '#command-center' },
                    { title: 'Stage Teleprompter', icon: Book, target: '#teleprompter' },
                    { title: 'Autopilot Mode', icon: Zap, target: '#autopilot' },
                ].map((item, i) => (
                    <a
                        key={i}
                        href={item.target}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all group hover:shadow-lg"
                    >
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 transition-colors">
                            <item.icon size={20} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                    </a>
                ))}
            </div>

            {/* Content Sections */}
            <div className="space-y-16">

                {/* 1. Getting Started */}
                <section id="getting-started" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🚀 1. Identity & Workspaces
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Kairon is built around **Organizations**. This allows you to keep your personal schedules separate from your professional agency or church events.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <CheckCircle className="text-indigo-500 shrink-0" size={20} />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Login:</strong>
                                    <p className="text-sm text-slate-500">Use Google or a simple Magic Link to sign in. No passwords required.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <CheckCircle className="text-indigo-500 shrink-0" size={20} />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Workspaces:</strong>
                                    <p className="text-sm text-slate-500">Use the Workspace Switcher in the sidebar to jump between different organizations instantly.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 opacity-75">
                                <Sparkles className="text-amber-500 shrink-0" size={20} />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Branding (Pro):</strong>
                                    <p className="text-sm text-slate-500">Go to settings to upload your logo and set a custom accent color for all displays.</p>
                                </div>
                            </li>
                        </ul>
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
                                The Editor is where you build your run-of-show. Add slots, set durations, and categorize items like **Talks**, **Breaks**, or **Music**.
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500">
                                09:00 - Welcome Talk (20m)<br />
                                09:20 - Session 1 (45m)<br />
                                10:05 - Coffee Break (15m)
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between">
                            <div>
                                <Sparkles size={32} className="mb-4 text-violet-200" />
                                <h4 className="text-xl font-bold mb-2">AI Rebalancer</h4>
                                <p className="text-sm text-violet-100 leading-tight">Running late? Click the sparkles. Gemini will analyze your Convex data and suggest a strategy to get back on track.</p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-200">
                                <Receipt size={14} /> Pro Feature
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Production Displays */}
                <section id="displays" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            📺 3. Production Displays
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'TV Mode', icon: Monitor, path: '/tv', desc: 'High-contrast view for attendees and overflow rooms.' },
                            { title: 'Stage Display', icon: Smartphone, path: '/stage', desc: 'Minimalist view for speakers with a massive countdown.' },
                            { title: 'Pro View', icon: Layout, path: '/live', desc: 'Control center for technicians with full event history.' },
                        ].map((view, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-emerald-500">
                                    <view.icon size={24} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{view.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed mb-4">{view.desc}</p>
                                <code className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{view.path}</code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Running the Show */}
                <section id="running" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-rose-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🎮 4. Running the Show
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Workflow Modes</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">**Auto Mode**: Timer flows naturally between slots.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">**Manual Mode**: You control every transition with "Next".</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-8">
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Handling Overtime</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    If a speaker goes over their allotted time, the timer turns **Red** and starts counting up, showing exactly how many minutes the event is delayed.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. The Cue System */}
                <section id="cue" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-amber-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🛑 5. The Cue System
                        </h2>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                                    Sometimes things don't go as planned. Click **"Hold for Cue"** to pause everything instantly.
                                </p>
                                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                                    <li className="flex gap-2"><span>&bull;</span> Perfect for weddings (waiting for the bride)</li>
                                    <li className="flex gap-2"><span>&bull;</span> Essential for tech failures (fixing a projector)</li>
                                </ul>
                            </div>
                            <div className="w-full md:w-64 bg-amber-500 text-white p-6 rounded-2xl shadow-xl shadow-amber-500/30 text-center animate-pulse">
                                <h5 className="text-2xl font-black uppercase tracking-tighter">Waiting For Cue</h5>
                                <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-80">Standby Screen Active</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Public Portal */}
                <section id="public" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-blue-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🌐 6. Public Portal
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                            <h4 className="font-bold mb-4">Sharing is Simple</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Anyone with the public link can see your schedule on their mobile device or desktop without needing an account.
                            </p>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400">
                                <Globe size={18} />
                                <span className="text-xs font-mono font-bold">kairon.app/p/your-event</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <Shield size={32} className="text-blue-400 mb-4" />
                                <h4 className="font-bold mb-2">iFrame Embedding</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Copy our snippet and embed the live schedule directly onto your church or conference website.
                                </p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all"></div>
                        </div>
                    </div>
                </section>

                {/* 7. Offline & Local Sync Fallback */}
                <section id="offline" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            📴 7. Offline & Local Sync Fallback
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative">
                        <div className="space-y-6">
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Kairon features a built-in, completely transparent **Local Sync Router** designed for high-stress event venues where internet access is spotty or missing entirely.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                                    <h4 className="font-bold mb-2 flex items-center gap-2 text-indigo-500">
                                        <Wifi size={16} /> 1. Automatic Local Bridge
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        If the WAN connection cuts out mid-event, the operator tab automatically starts broadcasting state updates locally using browser-level `BroadcastChannel` technology.
                                    </p>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                                    <h4 className="font-bold mb-2 flex items-center gap-2 text-emerald-500">
                                        <CheckCircle size={16} /> 2. Seamless Screen Sync
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Any local screens (Stage Displays, TV Views, Teleprompters) open in neighboring tabs or screens automatically detect the offline state and listen to local broadcasts to continue running in perfect sync.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400/90 rounded-2xl text-xs leading-relaxed">
                                💡 **No setup required:** Disconnect your device's Wi-Fi, control the live event from the `/live` page, and notice how all other local monitor tabs keep updating in real time.
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8. Command Center */}
                <section id="command-center" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-violet-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            🎛️ 8. Multi-Track Command Center
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            For large summits and multi-venue productions, the **Command Center** provides a single screen to monitor and manage multiple active live rundown tracks side-by-side.
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                            <img src="/command_center_mockup.png" alt="Multi-Track Command Center Mockup" className="w-full h-auto object-cover max-h-[300px]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-500 mb-1">Grid Overview</h4>
                                <p className="text-xs text-slate-500">Monitor titles, speakers, elapsed percentages, and status alerts for all rooms concurrently.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-500 mb-1">Direct Telemetry</h4>
                                <p className="text-xs text-slate-500">Start, pause, skip forward, or nudge countdown timers directly from the aggregate view.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-500 mb-1">Active Launch</h4>
                                <p className="text-xs text-slate-500">Click the action icon on any card to instantly open the full control cockpit for that specific track.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. Stage Teleprompter */}
                <section id="teleprompter" className="scroll-mt-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-1 bg-purple-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            📖 9. Stage Teleprompter Mode
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The **Integrated Teleprompter** merges schedule countdowns with structured markdown reading outlines, providing a clean split-screen layout for speakers at the podium.
                        </p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                            <img src="/teleprompter_mockup.png" alt="Stage Teleprompter Mockup" className="w-full h-auto object-cover max-h-[300px]" />
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">How to Setup and Use Teleprompter Outlines:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="font-bold text-xs text-indigo-500 uppercase tracking-widest block mb-1">1. Fill Outlines</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        In the **Program Editor**, click the chevron dropdown on a slot. Type your sermon outline or speech notes into the **Public Details / Abstract** box. Supports `# Headings`, `- Bullets`, and `**bold**` markdown syntax.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="font-bold text-xs text-indigo-500 uppercase tracking-widest block mb-1">2. Preview Outlines</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Open `/prompter?id=...`. Select any slot from the dropdown to read and preview notes. Click **Sync to Live** to let it automatically snap back to the running countdown timer.
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
                            🤖 10. Autopilot Autopilot (Auto-Heal)
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            When events run overtime, organizers face stress re-calculating the rest of the rundown. **Autopilot Mode** automates this process cleanly and deterministically.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <Zap className="text-amber-500 shrink-0" size={20} />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Zero-Token Local Execution:</strong>
                                    <p className="text-xs text-slate-500 mt-1">Unlike standard AI suggestions, Autopilot runs entirely on local math. It consumes no server credits or API tokens, remaining fully free and responsive offline.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <CheckCircle className="text-indigo-500 shrink-0" size={20} />
                                <div>
                                    <strong className="text-slate-800 dark:text-slate-100">Smart Overrun Redistribution:</strong>
                                    <p className="text-xs text-slate-500 mt-1">If a segment overruns, Autopilot automatically redistributes the overflow minutes by shaving time proportionally from subsequent flexible segments, ensuring you finish exactly at your hard end-time.</p>
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
                            🎨 11. Pulpit Contrast Themes
                        </h2>
                    </div>
                    <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
                        <p className="text-slate-400 leading-relaxed mb-6">
                            To combat screen glare from intense stage spotlights, Kairon provides specialized, high-visibility themes for Pulpit displays.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-black border border-amber-500/30 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-amber-400">Ambient Yellow</h4>
                                    <p className="text-[10px] text-slate-500">Optimized for low-light stages with high spotlight contrast.</p>
                                </div>
                                <span className="h-4 w-4 rounded-full bg-amber-400"></span>
                            </div>
                            <div className="p-4 bg-black border border-slate-800 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white">Ambient White</h4>
                                    <p className="text-[10px] text-slate-500">Ultra-high visibility matte white outlines on true black background.</p>
                                </div>
                                <span className="h-4 w-4 rounded-full bg-white"></span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scenarios Section */}
                <section className="bg-slate-100 dark:bg-slate-800/30 rounded-[40px] p-8 md:p-12 border border-white dark:border-slate-800 shadow-inner">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Real World Scenarios</h2>
                        <p className="text-slate-500 dark:text-slate-500">How to handle the chaos like a pro.</p>
                    </div>
                    <div className="space-y-6">
                        {[
                            {
                                title: 'The High-Stress Tech Conference',
                                tag: 'AI Focus',
                                color: 'indigo',
                                desc: 'Speaker goes 5 minutes over. AV Manager clicks "Service Re-balancer". Gemini trims 1 minute from the next 5 transitions. Finish exactly on time.'
                            },
                            {
                                title: 'The Wedding Ceremony',
                                tag: 'Cue Focus',
                                color: 'amber',
                                desc: 'Flower Girl is missing. DJ toggles "Hold". The TV in the hall says "WAITING FOR CUE". Once found, DJ hits "Release" and everything continues perfectly.'
                            },
                            {
                                title: 'The Church Service',
                                tag: 'Offline Focus',
                                color: 'emerald',
                                desc: 'Internet cuts out mid-service. Kairon doesn\'t blink. The timer keeps ticking and the foyer screens continue to show the correct local schedule.'
                            }
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800">
                                <div className={`shrink-0 h-14 w-14 rounded-2xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-500 font-black text-xl border border-${s.color}-500/20`}>
                                    {i + 1}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{s.title}</h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-${s.color}-100 text-${s.color}-600 dark:bg-${s.color}-500/10 dark:text-${s.color}-400`}>{s.tag}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed italic pr-12">
                                        "{s.desc}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer / CTA */}
            <div className="pt-12 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Info size={16} />
                    <p className="text-sm text-slate-500">
                        For a detailed breakdown of Free vs. Pro features and the product roadmap, refer to the Features & Pricing document.
                    </p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700">Kairon v2.0 &bull; Built for Producers &bull; 2026</p>
            </div>
        </div>
    );
};
