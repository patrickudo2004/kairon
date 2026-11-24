import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  WifiOff,
  Zap,
  Bell,
  Layers,
  ShieldCheck,
  BookOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Subtitles,
  FileText,
  CheckCircle2,
  Laptop,
  Tv,
  Radio,
  Sparkles,
} from 'lucide-react';
import { PublicLayout } from './PublicLayout';
import { CURRENT_APP_VERSION } from '../../services/updateService';

type EventFormatId = 'conference' | 'wedding' | 'broadcast' | 'worship';

interface EventScenarioDemo {
  id: EventFormatId;
  label: string;
  eventTitle: string;
  slotTitle: string;
  speaker: string;
  countdown: string;
  status: string;
  cueText: string;
  upNext: string;
  slots: { name: string; duration: string; active?: boolean }[];
}

const EVENT_DEMOS: EventScenarioDemo[] = [
  {
    id: 'conference',
    label: 'Conferences & Summits',
    eventTitle: 'Global Product & AI Summit',
    slotTitle: 'Opening Keynote: Future Systems',
    speaker: 'Dr. Elena Vance — Main Stage',
    countdown: '14:28',
    status: 'ON AIR',
    cueText: 'Q&A MIC READY ON STAGE LEFT — 2 MINS TO TRANSITION',
    upNext: 'Fireside Panel: Scaling Live Infrastructure',
    slots: [
      { name: '09:00 Doors & Welcome Briefing', duration: '10m' },
      { name: '09:10 Opening Keynote: Future Systems', duration: '35m', active: true },
      { name: '09:45 Fireside Panel & Q&A', duration: '25m' },
      { name: '10:10 Networking Coffee Break', duration: '15m' },
    ],
  },
  {
    id: 'wedding',
    label: 'Weddings & Galas',
    eventTitle: 'Evening Wedding Reception & Gala',
    slotTitle: 'Bridal Party Grand Entrance & Toast',
    speaker: 'Master of Ceremonies & Band',
    countdown: '06:45',
    status: 'ON AIR',
    cueText: 'CATERING READY — HOLD FIRST COURSE 3 MINUTES',
    upNext: 'Best Man & Maid of Honour Speeches',
    slots: [
      { name: '17:00 Cocktail Reception', duration: '45m' },
      { name: '17:45 Grand Entrance & Toast', duration: '15m', active: true },
      { name: '18:00 Speeches & Tributes', duration: '25m' },
      { name: '18:25 First Dance & Dinner Service', duration: '40m' },
    ],
  },
  {
    id: 'broadcast',
    label: 'Broadcast & Studios',
    eventTitle: 'Live Multi-Cam Town Hall Broadcast',
    slotTitle: 'Segment B: Live Studio Interview',
    speaker: 'Host Desk • Cam 2 Tight',
    countdown: '03:12',
    status: 'ON AIR',
    cueText: 'HARD COMMERCIAL BREAK AT :00 — WRAP FINAL QUESTION',
    upNext: 'Lower-Third Sponsors & Closing Summary',
    slots: [
      { name: '19:00 Cold Open & Headlines', duration: '05m' },
      { name: '19:05 Segment B: Live Interview', duration: '18m', active: true },
      { name: '19:23 Sponsor Bump & Transition', duration: '02m' },
      { name: '19:25 Live Audience Q&A Feed', duration: '20m' },
    ],
  },
  {
    id: 'worship',
    label: 'Churches & Ministries',
    eventTitle: 'Sunday Morning Gathering',
    slotTitle: 'Main Message & Ministry Time',
    speaker: 'Lead Speaker — Main Auditorium',
    countdown: '18:50',
    status: 'ON AIR',
    cueText: 'KEYS PAD STANDING BY — 5 MINUTES TO CLOSING',
    upNext: 'Closing Blessing & Announcements',
    slots: [
      { name: '09:00 Opening Welcome & Prayer', duration: '08m' },
      { name: '09:08 Worship Set', duration: '22m' },
      { name: '09:30 Main Message & Ministry', duration: '40m', active: true },
      { name: '10:10 Closing Blessing & Dismissal', duration: '10m' },
    ],
  },
];

const SHOWCASE_TRANSCRIPT = [
  { time: '00:00 – 00:08', caption: 'Kairon Studio Live Control opens in obsidian dark mode with a live ticking countdown and mirrored Right Output Monitor Dock.' },
  { time: '00:08 – 00:17', caption: '3D screens flip across Conferences & Summits, Weddings & Galas (Ballroom TV Display), and Worship & Broadcast Stages—every clock counting down live in real time.' },
  { time: '00:17 – 00:25', caption: 'On an anti-glare Ambient Yellow Stage Confidence Tablet, the clock hits 02:00 and a silent stage cue slides in cleanly: "2 MINUTES REMAINING — PREPARE FOR Q&A".' },
  { time: '00:25 – 00:34', caption: 'On mobile, Crew Tactical HUD readiness badges confirm Sound, Lights, and Video in green before flipping in 3D to the Mobile Zen Focus Console ticking on the exact same second.' },
  { time: '00:34 – 00:41', caption: 'When a speaker runs past 00:00 into red Overtime, deterministic zero-token Autopilot engages locally to rebalance remaining slots and protect your hard end-time—even 100% offline with OBS & ATEM overlays.' },
  { time: '00:41 – 00:48', caption: 'Laptop, Stage Tablet, and Mobile Zen fan out together—all three counting down in exact millisecond lockstep. Kairon Studio: Free Open Beta on Web, Windows, macOS & Linux.' },
];

export const LandingPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<EventFormatId>('conference');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(48);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const scenario = EVENT_DEMOS.find((d) => d.id === activeScenario) || EVENT_DEMOS[0];

  const formatVideoTime = (sec: number) => {
    const safe = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    const next = parseFloat(e.target.value);
    if (v && !Number.isNaN(next)) {
      v.currentTime = next;
      setVideoTime(next);
    }
  };

  const handleTogglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleToggleCaptions = () => {
    const v = videoRef.current;
    if (!v || !v.textTracks || v.textTracks.length === 0) {
      setCaptionsEnabled((prev) => !prev);
      return;
    }
    const next = !captionsEnabled;
    v.textTracks[0].mode = next ? 'showing' : 'hidden';
    setCaptionsEnabled(next);
  };

  const handleLaunchOfflineDemo = () => {
    try {
      localStorage.setItem('kairon_booth_mode', 'true');
      window.dispatchEvent(new Event('kairon_booth_mode_changed'));
    } catch {}
    const isElectronOrFile = Boolean((window as any).electron?.isElectron || window.location.protocol === 'file:');
    if (isElectronOrFile) {
      window.location.hash = '#/';
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  const detectedOS = (() => {
    if (typeof navigator === 'undefined') return 'windows';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('linux')) return 'linux';
    return 'windows';
  })();

  return (
    <PublicLayout>
      {/* =========================================================
          HERO SECTION — BLACKMAGIC DARK GLASSMORPHISM
         ========================================================= */}
      <section className="relative pt-14 pb-20 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full kairon-glass text-xs font-mono text-sky-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-tally" aria-hidden="true" />
              <span className="font-bold uppercase tracking-wider">Open Beta v{CURRENT_APP_VERSION}</span>
              <span className="hidden sm:inline text-white/25" aria-hidden="true">|</span>
              <span className="text-slate-300">Free Founding Access &bull; Web, Windows, macOS &amp; Linux</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.05]">
              Precision Timekeeping for{' '}
              <span className="bg-gradient-to-r from-sky-300 via-white to-emerald-300 bg-clip-text text-transparent">
                Every Live Stage.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#A1AABB] max-w-2xl mx-auto leading-relaxed">
              Synchronized countdowns, silent stage cues, deterministic offline Autopilot, and wireless multi-screen displays for <strong className="text-white font-semibold">conferences, weddings, broadcast studios, ceremonies, and worship gatherings</strong>.
            </p>

            {/* Primary CTA Row */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xl shadow-sky-950/60 border border-sky-400/35 transition-all"
              >
                <span>Launch Web Studio — Free</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="#downloads"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl kairon-glass hover:bg-white/[0.08] text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
              >
                <Download size={16} aria-hidden="true" />
                <span>Download Desktop App</span>
              </a>
              <button
                type="button"
                onClick={handleLaunchOfflineDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white border border-white/[0.08] font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <WifiOff size={15} aria-hidden="true" />
                <span>Try Offline Mode</span>
              </button>
            </div>
          </div>

          {/* =========================================================
              SHOWCASE REEL — 3D BEZEL GLASSMORPHISM VIDEO PLAYER
             ========================================================= */}
          <div id="showcase" className="mt-14 sm:mt-16 max-w-5xl mx-auto scroll-mt-24">
            <div className="rounded-[28px] p-2 sm:p-3 kairon-glass-elevated shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
              {/* Top Hardware Bezel Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] text-[11px] font-mono text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" aria-hidden="true" />
                  <span className="ml-2 text-slate-300 font-semibold tracking-wider uppercase">
                    KAIRON STUDIO // INTERACTIVE PRODUCT REEL
                  </span>
                </div>
                <span className="hidden sm:inline text-sky-300 uppercase tracking-widest">1080P HD &bull; CAPTIONS INCLUDED</span>
              </div>

              {/* Video Frame — 100% Unobstructed (Controls docked cleanly below frame so subtitles are never hidden!) */}
              <div className="relative aspect-video bg-[#050608] overflow-hidden group">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover cursor-pointer"
                  playsInline
                  muted={isMuted}
                  loop
                  preload="metadata"
                  poster="./media/kairon-showcase-poster.png"
                  onClick={handleTogglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && Number.isFinite(v.duration)) setVideoDuration(v.duration);
                    if (v.textTracks && v.textTracks.length > 0) {
                      v.textTracks[0].mode = captionsEnabled ? 'showing' : 'hidden';
                    }
                  }}
                  onTimeUpdate={(e) => setVideoTime(e.currentTarget.currentTime)}
                  aria-label="Kairon Studio product walkthrough video showing live-ticking multi-device stage timers, silent cues, Autopilot rebalancing, and mobile controls"
                >
                  <source src="./media/kairon-showcase-draft.mp4" type="video/mp4" />
                  <track
                    kind="captions"
                    src="./media/kairon-showcase-draft.vtt"
                    srcLang="en"
                    label="English Captions"
                    default
                  />
                  Your browser does not support HTML5 video. Read the full walkthrough transcript below.
                </video>

                {/* Center Play Overlay when paused */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    aria-label="Play Kairon Studio product walkthrough video"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 hover:bg-black/25 transition-colors cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#0369A1]/90 hover:bg-[#0284C7] border border-sky-300/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(14,165,233,0.45)] transition-transform hover:scale-105">
                      <Play size={30} className="text-white ml-1" fill="currentColor" aria-hidden="true" />
                    </div>
                    <span className="mt-4 px-4 py-1.5 rounded-full bg-black/75 border border-white/15 text-xs font-mono font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      Watch 48-Second Live Showcase
                    </span>
                  </button>
                )}
              </div>

              {/* Dedicated Non-Overlapping Hardware Control Dock (Below Video Frame) */}
              <div className="flex flex-col gap-2.5 px-4 py-3 bg-[#090B0F]/95 border-t border-white/[0.08] rounded-b-[20px]">
                {/* Scrubbable Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-300 tabular-nums w-9 shrink-0">
                    {formatVideoTime(videoTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 48}
                    step={0.1}
                    value={Math.min(videoTime, videoDuration || 48)}
                    onChange={handleSeek}
                    aria-label="Seek showcase video timeline"
                    className="flex-1 h-1.5 accent-sky-400 bg-white/[0.12] rounded-full cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums w-9 text-right shrink-0">
                    {formatVideoTime(videoDuration)}
                  </span>
                </div>

                {/* Transport & Accessibility Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      aria-label={isPlaying ? 'Pause showcase video' : 'Play showcase video'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-mono font-bold transition-colors"
                    >
                      {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      aria-label={isMuted ? 'Unmute ambient music and sound effects' : 'Mute audio'}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 text-xs font-mono transition-colors"
                    >
                      {isMuted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
                      <span>{isMuted ? 'Unmute Audio' : 'Audio On'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleCaptions}
                      aria-pressed={captionsEnabled}
                      aria-label={captionsEnabled ? 'Hide closed captions' : 'Show closed captions'}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                        captionsEnabled
                          ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                          : 'bg-white/[0.06] border-transparent text-slate-300 hover:bg-white/[0.14]'
                      }`}
                    >
                      <Subtitles size={14} aria-hidden="true" />
                      <span>CC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTranscript((prev) => !prev)}
                      aria-expanded={showTranscript}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-slate-200 text-xs font-mono transition-colors"
                    >
                      <FileText size={14} aria-hidden="true" />
                      <span>{showTranscript ? 'Hide Transcript' : 'Transcript'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* WCAG Accessible Transcript Accordion (Deaf & Hard-of-Hearing Support) */}
            {showTranscript && (
              <div className="mt-4 rounded-2xl kairon-glass p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                    Showcase Video Transcript (Accessible Text Alternative)
                  </h2>
                  <span className="text-xs font-mono text-[#94A3B8]">Ambient Instrumental — No Spoken Narration</span>
                </div>
                <ol className="space-y-3 text-sm text-slate-300">
                  {SHOWCASE_TRANSCRIPT.map((row) => (
                    <li key={row.time} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                      <span className="font-mono text-xs text-sky-300 shrink-0">{row.time}</span>
                      <span className="leading-relaxed">{row.caption}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          UNIVERSAL EVENT SIMULATOR (CONFERENCES, WEDDINGS, BROADCAST, WORSHIP)
         ========================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-10 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
              Built for Every Live Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              One Studio Engine. Every Kind of Stage.
            </h2>
            <p className="text-base text-[#94A3B8] leading-relaxed">
              Switch between formats below to preview how Kairon keeps presenters, AV crews, and schedules synchronized across any live production.
            </p>
          </div>

          {/* Interactive Scenario Selector */}
          <div role="tablist" aria-label="Select live event format preview" className="flex flex-wrap gap-2.5 mb-8">
            {EVENT_DEMOS.map((item) => {
              const selected = item.id === activeScenario;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveScenario(item.id)}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all border ${
                    selected
                      ? 'bg-[#0369A1] border-sky-400/50 text-white shadow-lg shadow-sky-900/40'
                      : 'kairon-glass text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Frosted Glass Live Console Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Stage Confidence Display Preview */}
            <div className="lg:col-span-7 rounded-3xl kairon-glass-elevated p-6 sm:p-8 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] truncate">
                    {scenario.eventTitle}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-bold text-white truncate mt-0.5">
                    {scenario.slotTitle}
                  </h3>
                  <p className="text-xs font-mono text-sky-300 truncate">{scenario.speaker}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 font-mono text-xs font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-tally" aria-hidden="true" />
                  {scenario.status}
                </span>
              </div>

              <div className="py-8 text-center">
                <div className="font-mono font-black text-6xl sm:text-8xl tracking-tight text-amber-300 tabular-nums drop-shadow-[0_0_40px_rgba(251,191,36,0.2)]">
                  {scenario.countdown}
                </div>
                <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 font-mono text-xs font-bold uppercase tracking-wide">
                  <Bell size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{scenario.cueText}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#94A3B8]">
                <span>UP NEXT: <strong className="text-white">{scenario.upNext}</strong></span>
                <span className="text-emerald-300">AUTOPILOT: ARMED</span>
              </div>
            </div>

            {/* Right: Run-of-Show & Multi-Device Telemetry */}
            <div className="lg:col-span-5 rounded-3xl kairon-glass p-6 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
                    Synchronized Rundown Queue
                  </h3>
                  <span className="text-[11px] font-mono text-sky-300">REAL-TIME SYNC</span>
                </div>
                <ul className="space-y-2.5">
                  {scenario.slots.map((slot) => (
                    <li
                      key={slot.name}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
                        slot.active
                          ? 'bg-sky-500/15 border-sky-400/40 text-white font-bold'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-300'
                      }`}
                    >
                      <span className="truncate">{slot.name}</span>
                      <span className={slot.active ? 'text-amber-300 shrink-0' : 'text-[#94A3B8] shrink-0'}>
                        {slot.duration}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.08] text-center font-mono">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <Monitor size={16} className="mx-auto text-sky-400 mb-1.5" aria-hidden="true" />
                  <div className="text-[10px] text-white font-bold">STAGE</div>
                  <div className="text-[10px] text-emerald-400">LOCKED</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <Tablet size={16} className="mx-auto text-amber-400 mb-1.5" aria-hidden="true" />
                  <div className="text-[10px] text-white font-bold">WIRELESS</div>
                  <div className="text-[10px] text-emerald-400">SYNCED</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <Smartphone size={16} className="mx-auto text-emerald-400 mb-1.5" aria-hidden="true" />
                  <div className="text-[10px] text-white font-bold">CREW HUD</div>
                  <div className="text-[10px] text-emerald-400">3/3 ACK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CORE CAPABILITIES BENTO GRID
         ========================================================= */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Broadcast-Grade Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Designed for High-Pressure Live Rooms.
            </h2>
            <p className="text-base text-[#94A3B8]">
              Every feature in Kairon was shaped inside real live productions — where Wi-Fi drops, schedules slip, and spotlights wash out ordinary screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                accent: 'text-amber-400 bg-amber-500/10 border-amber-400/25',
                title: 'Deterministic Offline Autopilot',
                desc: 'When a speaker runs over, Autopilot mathematically rebalances flexible upcoming segments to protect your hard end-time — zero cloud tokens, 100% local.',
              },
              {
                icon: Bell,
                accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/25',
                title: 'Silent Stage Cues & Hold-for-Cue',
                desc: 'Send discreet stage banners or WCAG-safe hard-stop alerts straight to the podium monitor, or freeze playback with WAITING FOR CUE during unexpected delays.',
              },
              {
                icon: WifiOff,
                accent: 'text-sky-400 bg-sky-500/10 border-sky-400/25',
                title: 'Zero-Drop Offline Failover',
                desc: 'Internet drops mid-event? Never refresh. Kairon seamlessly switches to local wall-clock sync and BroadcastChannel / desktop IPC, auto-reconnecting when WAN returns.',
              },
              {
                icon: Tv,
                accent: 'text-violet-400 bg-violet-500/10 border-violet-400/25',
                title: 'Multi-Screen Matrix & Spotlight Themes',
                desc: 'Auto-detect HDMI, DisplayPort, USB-C, and wireless tablets. Switch stage monitors between Dark, Ambient Yellow, and Ambient White to beat intense stage glare.',
              },
              {
                icon: Layers,
                accent: 'text-rose-400 bg-rose-500/10 border-rose-400/25',
                title: 'OBS, vMix, ATEM & ProPresenter 7',
                desc: 'Output 1080p transparent alpha or chroma-key overlays (/overlay) directly into your video switcher, and mirror stage cues over LAN to ProPresenter 7.',
              },
              {
                icon: Radio,
                accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-400/25',
                title: 'Crew Tactical HUD & Teleprompter',
                desc: 'Give Sound, Lighting, and Video teams dedicated readiness ACKs and private crew chat, while presenters read auto-scrolling Markdown scripts synced to the clock.',
              },
            ].map((feat) => (
              <article key={feat.title} className="rounded-3xl kairon-glass p-7 space-y-4 hover:border-white/[0.18] transition-colors">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${feat.accent}`} aria-hidden="true">
                  <feat.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{feat.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          DESKTOP DOWNLOADS MATRIX
         ========================================================= */}
      <section id="downloads" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[32px] kairon-glass-elevated p-8 sm:p-12 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
                  Native Booth Application
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Install Kairon Studio on Any Production Machine.
                </h2>
                <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                  Includes OS-level display sleep lock, native multi-monitor routing without browser permission prompts, and portable <code className="text-sky-300 font-mono">.kairon</code> offline workspace folders.
                </p>
              </div>
              <a
                href="https://github.com/patrickudo2004/kairon/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shrink-0"
              >
                <span>All GitHub Releases</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  os: 'windows',
                  name: 'Windows',
                  format: 'Windows 10 / 11 (.exe Installer)',
                  href: 'https://github.com/patrickudo2004/kairon/releases/latest',
                },
                {
                  os: 'mac',
                  name: 'macOS',
                  format: 'Apple Silicon & Intel (.dmg)',
                  href: 'https://github.com/patrickudo2004/kairon/releases/latest',
                },
                {
                  os: 'linux',
                  name: 'Linux',
                  format: 'Universal Desktop (.AppImage)',
                  href: 'https://github.com/patrickudo2004/kairon/releases/latest',
                },
              ].map((platform) => {
                const isRecommended = platform.os === detectedOS;
                return (
                  <div
                    key={platform.os}
                    className={`rounded-2xl p-6 border flex flex-col justify-between gap-6 ${
                      isRecommended
                        ? 'bg-sky-500/[0.08] border-sky-400/40'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Laptop size={22} className="text-sky-400" aria-hidden="true" />
                        {isRecommended && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[10px] font-mono font-bold uppercase">
                            Your OS
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                      <p className="text-xs font-mono text-[#94A3B8]">{platform.format}</p>
                    </div>
                    <a
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                        isRecommended
                          ? 'bg-[#0369A1] hover:bg-[#0284C7] text-white'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1]'
                      }`}
                    >
                      <Download size={14} aria-hidden="true" />
                      <span>Download for {platform.name}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OPEN BETA & FOUNDING PARTNER PROMISE + USER GUIDE CTA
         ========================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl kairon-glass p-8 sm:p-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-mono font-bold uppercase">
              <Sparkles size={13} aria-hidden="true" />
              <span>Open Beta Guarantee</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              100% Free During Open Beta. Zero Surprise Cutoffs.
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              We are perfecting Kairon alongside real event teams, production booths, and houses of worship. Every feature is unlocked free during Open Beta. When paid plans launch in the future, existing beta teams will receive advance notice, will never be locked out mid-event, and will receive a <strong className="text-white">Founding Partner Reward</strong> (1 year complimentary Pro access).
            </p>
            <ul className="space-y-2 text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
                <span>No credit card required during beta</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
                <span>UK GDPR compliant — free JSON data export &amp; self-service account deletion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
                <span>WCAG 2.1 AA accessibility &amp; photosensitivity-safe alerts</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl kairon-glass p-8 sm:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs font-mono font-bold uppercase">
                <BookOpen size={13} aria-hidden="true" />
                <span>Documentation &amp; Setup</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Ready in Under 3 Minutes.
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Explore the complete 14-section Kairon Operations Manual — covering multi-screen HDMI/wireless tablet routing, OBS &amp; Blackmagic ATEM key overlays, offline failover, and role-based access control.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/guide"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#060709] hover:bg-slate-200 font-mono text-xs font-extrabold uppercase tracking-wider transition-all"
              >
                <BookOpen size={15} aria-hidden="true" />
                <span>Open Interactive User Guide</span>
              </Link>
              <Link
                to="/accessibility"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Accessibility &amp; Legal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
