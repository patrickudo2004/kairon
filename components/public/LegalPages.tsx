import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Cookie, Eye, Mail, ArrowLeft } from 'lucide-react';
import { PublicLayout } from './PublicLayout';

const EFFECTIVE_DATE = '24 November 2026';
const CONTACT_EMAIL = 'patrickudo2004@gmail.com';

const LegalShell: React.FC<{
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ badge, title, subtitle, icon, children }) => {
  useEffect(() => {
    document.title = `${title} — Kairon Studio`;
  }, [title]);

  return (
    <PublicLayout>
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      <div className="space-y-4 border-b border-white/[0.08] pb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-sky-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Kairon Studio</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-sky-300 uppercase tracking-wider ml-4">
          {icon}
          <span>{badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">{subtitle}</p>
        <p className="text-xs font-mono text-slate-400">
          Last updated: {EFFECTIVE_DATE} &bull; Contact:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>

      <div className="space-y-8 text-sm sm:text-[15px] text-slate-300 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-100 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_section]:rounded-2xl [&_section]:p-6 [&_section]:sm:p-8 [&_section]:bg-white/[0.025] [&_section]:border [&_section]:border-white/[0.08]">
        {children}
      </div>
    </article>
  </PublicLayout>
  );
};

export const PrivacyPolicyPage: React.FC = () => (
  <LegalShell
    badge="UK GDPR & EU GDPR"
    title="Privacy Policy"
    subtitle="How Kairon Studio collects, stores, protects, and deletes personal data across Web and Desktop apps."
    icon={<Shield size={13} aria-hidden="true" />}
  >
    <section>
      <h2>1. Data Controller &amp; Contact</h2>
      <p>
        Kairon Studio (&quot;Kairon&quot;, &quot;we&quot;, &quot;us&quot;) is operated during its free Open Beta by{' '}
        <strong>Patrick Udoh</strong> (United Kingdom). For any data protection questions, Subject Access Requests, or
        deletion requests, contact{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </section>

    <section>
      <h2>2. Data We Collect &amp; Why</h2>
      <p className="mb-3">
        We practice strict data minimization. Kairon supports two modes:
      </p>
      <ul>
        <li>
          <strong>100% Local / Offline Mode (Zero Cloud Collection):</strong> If you use Offline Booth Mode or Local
          Folder Workspaces (<code>.kairon</code> files on your own PC), your rundowns, speaker names, and scripts remain
          strictly on your device.
        </li>
        <li>
          <strong>Cloud Sync Account Data (Optional):</strong> When you sign in with Google OAuth or Email One-Time Code
          via Convex Auth, we store your email address, display name, optional profile avatar URL, workspace memberships,
          and the event rundowns/cues you explicitly save to a Cloud Workspace.
        </li>
        <li>
          <strong>Team Invitations:</strong> If a workspace administrator invites a teammate by email, that email is
          stored solely to match the invitation when the invitee chooses to accept it.
        </li>
      </ul>
      <p className="mt-3 text-xs font-mono text-emerald-300">
        We NEVER sell your personal data, NEVER run third-party advertising trackers, and NEVER use your event content to
        train AI models.
      </p>
    </section>

    <section>
      <h2>3. Lawful Bases Under UK GDPR</h2>
      <ul>
        <li>
          <strong>Performance of a Service / Request (Art. 6(1)(b)):</strong> Operating authentication, real-time display
          synchronization, and team collaboration that you actively request.
        </li>
        <li>
          <strong>Legitimate Interests (Art. 6(1)(f)):</strong> Protecting service security, preventing unauthorized access,
          and checking for optional desktop app security/bug-fix updates (which can be toggled off in Update settings).
        </li>
      </ul>
    </section>

    <section>
      <h2>4. Infrastructure Sub-Processors &amp; International Transfers</h2>
      <p className="mb-3">
        To deliver reliable real-time synchronization and hosting, Kairon relies on the following sub-processors,
        protected by UK International Data Transfer Addendum (IDTA) / Standard Contractual Clauses (SCCs) where data is
        processed outside the UK/EEA:
      </p>
      <ul>
        <li><strong>Convex Inc. (USA):</strong> Real-time cloud database, authentication, and workspace file storage (Cloud Workspaces only).</li>
        <li><strong>Vercel Inc. (Global Edge / USA):</strong> Web application hosting and static asset delivery.</li>
        <li><strong>Google LLC (USA):</strong> Optional Google Sign-In OAuth and web fonts delivery (<code>fonts.googleapis.com</code>).</li>
        <li><strong>Tailwind Labs / Cloudflare CDN (Global):</strong> Browser stylesheet runtime delivery (<code>cdn.tailwindcss.com</code>), receiving standard HTTP request headers/IP on page load without storing advertising cookies.</li>
        <li><strong>GitHub Inc. (USA):</strong> Optional desktop app release version check (<code>api.github.com</code>), which can be disabled in Kairon&apos;s Update modal.</li>
      </ul>
    </section>

    <section>
      <h2>5. Data Retention &amp; Shared Computer Safety</h2>
      <ul>
        <li>Cloud account &amp; workspace data is retained only while your account or workspace remains active.</li>
        <li>Temporary desktop pairing codes automatically expire after 10 minutes.</li>
        <li>
          Clicking <strong>Sign Out</strong> immediately wipes your authentication tokens, cached rundowns, and private
          teleprompter scripts from browser local storage to protect shared production booth computers.
        </li>
      </ul>
    </section>

    <section>
      <h2>6. Your UK GDPR Rights (Always Free)</h2>
      <p className="mb-3">You have the right to exercise the following rights free of charge at any time:</p>
      <ul>
        <li>
          <strong>Right of Access &amp; Data Portability (Arts. 15 &amp; 20):</strong> Download a complete, portable JSON
          copy of your account and workspace data directly from <em>Workspace Settings &rarr; Account &rarr; Download My Data (JSON)</em>.
        </li>
        <li>
          <strong>Right to Erasure (&quot;Right to be Forgotten&quot;, Art. 17):</strong> Permanently delete your account,
          profile, memberships, and solo-owned workspaces directly from <em>Workspace Settings &rarr; Account &rarr; Delete My Account</em>,
          or by emailing <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">{CONTACT_EMAIL}</a>.
        </li>
        <li>
          <strong>Right to Rectification &amp; Restriction (Arts. 16 &amp; 18):</strong> Edit your display name and
          workspace details anytime inside Settings.
        </li>
        <li>
          <strong>Right to Complain:</strong> You have the right to lodge a complaint with the UK Information
          Commissioner&apos;s Office (ICO) at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
            ico.org.uk
          </a>
          .
        </li>
      </ul>
    </section>
  </LegalShell>
);

export const TermsOfServicePage: React.FC = () => (
  <LegalShell
    badge="Open Beta Terms"
    title="Terms of Service"
    subtitle="Clear, plain-English terms governing use of Kairon Studio during its free Open Beta."
    icon={<FileText size={13} aria-hidden="true" />}
  >
    <section>
      <h2>1. Free Open Beta Status</h2>
      <p>
        Kairon Studio is currently provided <strong>free of charge in Open Beta</strong> for testing, evaluation, and
        community feedback across conferences, weddings, broadcast studios, ceremonies, and houses of worship. No payment
        is collected or required during Open Beta. If optional paid subscription tiers are introduced in the future,
        existing beta users will receive advance notice, will not be abruptly locked out of active live events, and may be
        offered a complimentary Founding Partner access period.
      </p>
    </section>

    <section>
      <h2>2. &quot;AS IS&quot; Disclaimer &amp; Live Event Responsibility</h2>
      <p className="mb-3">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KAIRON STUDIO IS PROVIDED ON AN <strong>&quot;AS IS&quot;</strong>{' '}
        AND <strong>&quot;AS AVAILABLE&quot;</strong> BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
        STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR UNINTERRUPTED
        AVAILABILITY.
      </p>
      <p>
        Live productions depend on venue power, local Wi-Fi, HDMI/wireless display adapters, third-party browsers, and
        operating systems outside our control. You agree to rehearse your setup before live events and maintain an
        independent backup timing plan for mission-critical broadcasts.
      </p>
    </section>

    <section>
      <h2>3. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law (and without excluding liability for fraud, death, or personal injury
        caused by negligence where prohibited under UK law), neither Kairon Studio nor its creator shall be liable for any
        indirect, incidental, special, consequential, or punitive damages—or any loss of revenue, venue overtime fees,
        broadcast interruption, or data loss—arising out of or related to your use of or inability to use Kairon Studio.
        Because Kairon is offered free during Open Beta, our aggregate liability is capped at £0 (zero pounds sterling) to
        the extent permitted by law.
      </p>
    </section>

    <section>
      <h2>4. Your Content &amp; Acceptable Use</h2>
      <ul>
        <li>
          <strong>You Own Your Content:</strong> You retain 100% ownership of all event rundowns, speaker scripts, logos,
          and stage cues you create in Kairon.
        </li>
        <li>
          <strong>Acceptable Use:</strong> You agree not to misuse Kairon to transmit unlawful, harassing, or malicious
          content, attempt unauthorized access to other workspaces, or disrupt Kairon&apos;s infrastructure.
        </li>
      </ul>
    </section>

    <section>
      <h2>5. Governing Law</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of England and Wales. Questions may be sent
        to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </section>
  </LegalShell>
);

export const CookieNoticePage: React.FC = () => (
  <LegalShell
    badge="UK PECR Transparent"
    title="Cookie &amp; Local Storage Notice"
    subtitle="Kairon sets zero advertising or analytics cookies. Here is every strictly necessary browser storage item we use."
    icon={<Cookie size={13} aria-hidden="true" />}
  >
    <section>
      <h2>1. Zero Ad or Tracking Cookies</h2>
      <p>
        Kairon Studio does <strong>not</strong> set third-party advertising cookies, social tracking pixels, or behavioral
        analytics cookies. Under Regulation 6 of the UK Privacy and Electronic Communications Regulations (PECR), we only
        use strictly necessary browser storage required to deliver the live timing and offline-failover functionality you
        explicitly request.
      </p>
    </section>

    <section>
      <h2>2. Strictly Necessary Local &amp; Session Storage</h2>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs font-mono border border-white/[0.1] rounded-xl overflow-hidden">
          <caption className="sr-only">Strictly necessary localStorage and sessionStorage keys used by Kairon Studio</caption>
          <thead className="bg-white/[0.06] text-white">
            <tr>
              <th scope="col" className="p-3">Storage Key / Prefix</th>
              <th scope="col" className="p-3">Purpose</th>
              <th scope="col" className="p-3">Cleared on Sign-Out?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08] text-slate-300">
            <tr>
              <td className="p-3 text-sky-300">__convexAuthJWT / RefreshToken</td>
              <td className="p-3 font-sans">Keeps you securely authenticated in Cloud Workspaces.</td>
              <td className="p-3 text-emerald-400">Yes — immediately</td>
            </tr>
            <tr>
              <td className="p-3 text-sky-300">kairon_offline_cache_* / kairon_program</td>
              <td className="p-3 font-sans">Enables zero-drop offline failover &amp; local multi-window stage display sync.</td>
              <td className="p-3 text-emerald-400">Yes — immediately</td>
            </tr>
            <tr>
              <td className="p-3 text-sky-300">kairon_active_org_id / kairon_booth_mode</td>
              <td className="p-3 font-sans">Remembers active workspace or local offline booth mode.</td>
              <td className="p-3 text-emerald-400">Yes — immediately</td>
            </tr>
            <tr>
              <td className="p-3 text-sky-300">theme / kairon_display_theme_*</td>
              <td className="p-3 font-sans">Stores your Dark/Light and Stage Contrast Theme preferences (Ambient Yellow / White).</td>
              <td className="p-3 text-slate-400">Device preference</td>
            </tr>
            <tr>
              <td className="p-3 text-sky-300">kairon_auto_check_updates</td>
              <td className="p-3 font-sans">Stores your preference for optional desktop version update checks.</td>
              <td className="p-3 text-slate-400">Device preference</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>3. Managing or Clearing Storage</h2>
      <p>
        Clicking <strong>Sign Out</strong> inside Kairon automatically wipes all session tokens and private rundown caches.
        You may also clear all site storage at any time via your browser&apos;s site settings.
      </p>
    </section>
  </LegalShell>
);

export const AccessibilityStatementPage: React.FC = () => (
  <LegalShell
    badge="WCAG 2.1 Level AA"
    title="Accessibility Statement"
    subtitle="Our commitment to inclusive, accessible live event production software for blind, low-vision, deaf, keyboard-only, and photosensitive users."
    icon={<Eye size={13} aria-hidden="true" />}
  >
    <section>
      <h2>1. Conformance Commitment</h2>
      <p>
        Kairon Studio is committed to making our website and live production studio accessible in line with the{' '}
        <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> and the{' '}
        <strong>UK Equality Act 2010</strong>. Accessibility is treated as an ongoing engineering priority—not an
        afterthought.
      </p>
    </section>

    <section>
      <h2>2. Accessibility Protections Built Into Kairon</h2>
      <ul>
        <li>
          <strong>Blind &amp; Screen-Reader Users:</strong> Semantic HTML landmarks (<code>&lt;header&gt;</code>,{' '}
          <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code>), &quot;Skip to main
          content&quot; links, programmatic form <code>&lt;label htmlFor&gt;</code> associations, descriptive{' '}
          <code>aria-label</code>s on icon buttons, <code>role=&quot;dialog&quot;</code> / <code>aria-modal=&quot;true&quot;</code>{' '}
          modal semantics, and polite <code>aria-live</code> status announcements for stage cues and alerts.
        </li>
        <li>
          <strong>Low-Vision &amp; Color-Blind Users:</strong> High-contrast dark glassmorphism surfaces engineered to
          meet WCAG AA (≥ 4.5:1 normal text contrast), specialized high-visibility Ambient Yellow &amp; Ambient White
          stage themes, and text/icon status labels paired alongside tally colors so status never relies on color alone.
        </li>
        <li>
          <strong>Deaf &amp; Hard-of-Hearing Users:</strong> Kairon is inherently visual-first—zero critical controls or
          stage cues depend on audio-only alarms. All promotional and walkthrough videos on this website provide{' '}
          <strong>closed captions (WebVTT)</strong> alongside full accessible text transcripts.
        </li>
        <li>
          <strong>Photosensitive Safety (WCAG 2.3.1):</strong> Stage emergency alerts are strictly capped below 1 Hz
          (well beneath the 3 flashes/second threshold) and automatically switch to a static, non-flashing alert banner
          whenever your device enables <code>prefers-reduced-motion: reduce</code>.
        </li>
        <li>
          <strong>Keyboard-Only Navigation:</strong> Visible high-contrast <code>:focus-visible</code> outlines across
          all interactive elements, <code>Escape</code> dismissal for dialogs, and keyboard-operable hold-to-confirm
          controls (<code>Enter</code> / <code>Space</code>).
        </li>
      </ul>
    </section>

    <section>
      <h2>3. Report an Accessibility Barrier</h2>
      <p>
        If you encounter any accessibility barrier anywhere on our website or inside Kairon Studio, or need documentation
        in an alternative format, please email us directly at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline inline-flex items-center gap-1">
          <Mail size={13} aria-hidden="true" />
          <span>{CONTACT_EMAIL}</span>
        </a>
        . We aim to acknowledge accessibility feedback within 3 working days and prioritize fixes promptly.
      </p>
    </section>
  </LegalShell>
);
