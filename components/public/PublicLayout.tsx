import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, BookOpen, Download, Mail, Radio } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../../services/updateService';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navigateToSection = (sectionId: string) => {
    setMobileOpen(false);
    if (location.pathname === '/' || location.pathname === '/welcome') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/');
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <div className="dark min-h-screen bg-[#060709] text-[#E6E9F0] font-sans selection:bg-sky-500/30 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* WCAG 2.4.1 Skip to main content */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Ambient Broadcast Studio Backdrop Illumination */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[980px] h-[440px] rounded-full bg-sky-500/[0.08] blur-[140px]" />
        <div className="absolute top-[38%] -left-40 w-[520px] h-[520px] rounded-full bg-indigo-500/[0.05] blur-[140px]" />
        <div className="absolute bottom-[-160px] right-[-120px] w-[620px] h-[420px] rounded-full bg-emerald-500/[0.05] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Sticky Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060709]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="Kairon Studio Home"
          >
            <img
              src="./kairon-logo.png"
              alt=""
              aria-hidden="true"
              className="w-9 h-9 rounded-xl border border-white/[0.12] bg-white/[0.03] object-contain shadow-lg shadow-sky-500/10"
            />
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-extrabold text-base tracking-[0.14em] text-white uppercase">
                KAIRON
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-tally" aria-hidden="true" />
                Open Beta
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary website navigation" className="hidden md:flex items-center gap-1 text-xs font-mono uppercase tracking-wider">
            <button
              type="button"
              onClick={() => navigateToSection('features')}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors uppercase"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('showcase')}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors uppercase"
            >
              Showcase
            </button>
            <Link
              to="/guide"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/guide')
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              User Guide
            </Link>
            <button
              type="button"
              onClick={() => navigateToSection('downloads')}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors uppercase"
            >
              Desktop App
            </button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-200 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-sky-900/40 border border-sky-400/30 transition-all"
            >
              <span>Launch Studio</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 hover:text-white"
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <nav
            aria-label="Mobile website navigation"
            className="md:hidden border-t border-white/[0.08] bg-[#090B0F]/95 backdrop-blur-2xl px-4 py-4 space-y-2 font-mono text-xs uppercase tracking-wider"
          >
            <button
              type="button"
              onClick={() => navigateToSection('features')}
              className="w-full text-left block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/[0.06] uppercase"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('showcase')}
              className="w-full text-left block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/[0.06] uppercase"
            >
              Showcase Video
            </button>
            <Link
              to="/guide"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/[0.06]"
            >
              User Guide
            </Link>
            <button
              type="button"
              onClick={() => navigateToSection('downloads')}
              className="w-full text-left block px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/[0.06] uppercase"
            >
              Desktop App
            </button>
            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-3 rounded-xl bg-[#0369A1] text-white font-bold"
              >
                Launch Web Studio (Free Beta)
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 relative z-10">
        {children}
      </main>

      {/* Comprehensive Legal & Accessibility Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#050608]/90 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/[0.08]">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="./kairon-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="w-8 h-8 rounded-lg border border-white/[0.12] object-contain"
                />
                <span className="font-mono font-extrabold text-sm tracking-[0.14em] text-white uppercase">
                  KAIRON STUDIO
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Precision live stage timer, silent cue engine, and multi-screen broadcast rundown studio built for conferences, weddings, broadcast studios, ceremonies, and houses of worship.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                <Radio size={12} className="text-emerald-400" aria-hidden="true" />
                <span>v{CURRENT_APP_VERSION} &bull; Open Beta</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">Product</h2>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Overview</Link>
                </li>
                <li>
                  <Link to="/guide" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                    <BookOpen size={13} aria-hidden="true" />
                    <span>Interactive User Guide</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('downloads')}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download size={13} aria-hidden="true" />
                    <span>Desktop Downloads</span>
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">Launch Web Studio</Link>
                </li>
              </ul>
            </div>

            {/* Legal & Compliance */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">Legal &amp; Compliance</h2>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy (UK GDPR)</Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">Terms of Service (Open Beta)</Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition-colors">Cookie &amp; Storage Notice</Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} aria-hidden="true" />
                    <span>Accessibility (WCAG 2.1 AA)</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Beta Feedback */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-4">Open Beta &amp; Support</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
                Testing Kairon at your venue or event? Send feedback, feature requests, or data/accessibility inquiries directly:
              </p>
              <a
                href="mailto:patrickudo2004@gmail.com"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-mono text-sky-300 transition-colors"
              >
                <Mail size={14} aria-hidden="true" />
                <span>patrickudo2004@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8] font-mono">
            <p>&copy; {new Date().getFullYear()} Kairon Studio. Currently in Free Open Beta.</p>
            <p className="text-center sm:text-right">
              Zero ad cookies &bull; Offline-first architecture &bull; WCAG 2.1 AA focused
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
