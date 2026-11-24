import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { PublicLayout } from './PublicLayout';
import { UserGuide } from '../UserGuide';

export const PublicGuidePage: React.FC = () => {
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
              Watch our 65-second visual reel with captions, or scroll straight down into the full 14-section Operations Manual covering rundowns, multi-screen projection, wireless tablets, OBS/ATEM overlays, and offline sync.
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

          <div className="w-full lg:w-[440px] shrink-0 rounded-2xl overflow-hidden border border-white/[0.12] bg-black shadow-2xl">
            <video
              controls
              playsInline
              muted
              preload="metadata"
              poster="./media/kairon-showcase-poster.png"
              className="w-full aspect-video object-cover"
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
          </div>
        </div>
      </section>

      {/* Full Interactive 14-Section Operations Manual */}
      <UserGuide embeddedPublic />
    </PublicLayout>
  );
};
