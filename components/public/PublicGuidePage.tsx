import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Play, Pause, Volume2, VolumeX, Subtitles } from 'lucide-react';
import { PublicLayout } from './PublicLayout';
import { UserGuide } from '../UserGuide';

export const PublicGuidePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);

  const togglePlay = () => {
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

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const toggleCaptions = () => {
    const v = videoRef.current;
    const next = !captionsEnabled;
    if (v?.textTracks && v.textTracks.length > 0) {
      v.textTracks[0].mode = next ? 'showing' : 'hidden';
    }
    setCaptionsEnabled(next);
  };

  return (
    <PublicLayout>
      {/* Quick Visual Video Overview Header inside Guide */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-10">
        <div className="rounded-3xl kairon-glass-elevated p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs font-mono font-bold uppercase tracking-wider">
              <PlayCircle size={14} aria-hidden="true" />
              <span>Visual Quick-Start Walkthrough</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              See How Kairon Sets Up Across Stage, Booth &amp; Mobile
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Watch our 48-second live-ticking showcase reel with unobstructed captions, or scroll straight down into the full 14-section Operations Manual covering rundowns, multi-screen projection, wireless tablets, OBS/ATEM overlays, and offline sync.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Launch Web Studio</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <a
                href="#getting-started"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Jump to Section 1</span>
              </a>
            </div>
          </div>

          <div className="w-full lg:w-[460px] shrink-0 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#050608] shadow-2xl">
            <div className="relative aspect-video bg-[#050608]">
              <video
                ref={videoRef}
                playsInline
                muted={isMuted}
                loop
                preload="metadata"
                poster="./media/kairon-showcase-poster.png"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (v.textTracks && v.textTracks.length > 0) {
                    v.textTracks[0].mode = captionsEnabled ? 'showing' : 'hidden';
                  }
                }}
                className="w-full h-full object-cover cursor-pointer"
                aria-label="Kairon Studio visual setup walkthrough video with English captions"
              >
                <source src="./media/kairon-showcase-draft.mp4" type="video/mp4" />
                <track
                  kind="captions"
                  src="./media/kairon-showcase-draft.vtt"
                  srcLang="en"
                  label="English Captions"
                  default
                />
              </video>
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label="Play walkthrough video"
                  className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/25 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-[#0369A1]/90 border border-sky-300/50 flex items-center justify-center shadow-lg">
                    <Play size={22} className="text-white ml-0.5" fill="currentColor" aria-hidden="true" />
                  </div>
                </button>
              )}
            </div>
            {/* Non-Overlapping Control Strip Below Frame */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#090B0F] border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause walkthrough video' : 'Play walkthrough video'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0369A1] hover:bg-[#0284C7] text-white text-[11px] font-mono font-bold"
                >
                  {isPlaying ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute walkthrough audio' : 'Mute walkthrough audio'}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-[11px] font-mono"
                >
                  {isMuted ? <VolumeX size={12} aria-hidden="true" /> : <Volume2 size={12} aria-hidden="true" />}
                  <span>{isMuted ? 'Unmute' : 'Audio'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={toggleCaptions}
                aria-pressed={captionsEnabled}
                aria-label={captionsEnabled ? 'Hide closed captions' : 'Show closed captions'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border ${
                  captionsEnabled
                    ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                    : 'bg-white/[0.06] border-transparent text-slate-300'
                }`}
              >
                <Subtitles size={12} aria-hidden="true" />
                <span>CC</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Full Interactive 14-Section Operations Manual */}
      <UserGuide embeddedPublic />
    </PublicLayout>
  );
};
