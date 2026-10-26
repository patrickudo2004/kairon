import { Program } from '../types';

export const PRODUCTION_WEB_ORIGIN = 'https://kairon-murex.vercel.app';

/**
 * Returns the canonical public web origin for shareable links, QR codes, embeds, and invites.
 * Prioritizes explicitly configured environment variables (VITE_SITE_URL / VITE_PUBLIC_URL),
 * falls back to the current browser origin (when on a public domain),
 * and resolves to the canonical production web URL (https://kairon-murex.vercel.app)
 * in Electron desktop mode (file://) or localhost so attendees scanning QR codes on mobile devices can reach the live portal.
 */
export const getCanonicalWebOrigin = (): string => {
  if (typeof window === 'undefined') return PRODUCTION_WEB_ORIGIN;
  const configuredSiteUrl =
    (import.meta as any).env?.VITE_SITE_URL ||
    (import.meta as any).env?.VITE_PUBLIC_URL;
  if (configuredSiteUrl) {
    return String(configuredSiteUrl).replace(/\/+$/, '');
  }

  const origin = window.location.origin;
  if (
    origin &&
    origin !== 'null' &&
    !origin.startsWith('file:') &&
    !origin.includes('localhost') &&
    !origin.includes('127.0.0.1')
  ) {
    return origin;
  }

  // Inside Electron Desktop App (file://) or local dev, use production cloud web origin for QR codes
  return PRODUCTION_WEB_ORIGIN;
};

/**
 * Extracts a deterministic, consistent public identifier for a program
 * across draft creation, Convex auto-save, Editor, PDF export, and Monitors.
 */
export const getPublicPortalIdentifier = (
  program?: (Partial<Program> & { _id?: string; uuid?: string }) | null
): string => {
  if (!program) return '';
  const raw = program.slug || program.uuid || program.id || program._id || '';
  return String(raw).replace(/^local-/, '');
};

/**
 * Returns the relative path for the Public Attendee Portal (/p/<identifier>).
 */
export const getPublicPortalPath = (
  program?: (Partial<Program> & { _id?: string; uuid?: string }) | null
): string => {
  const identifier = getPublicPortalIdentifier(program);
  return identifier ? `/p/${identifier}` : '/public';
};

/**
 * Returns the full canonical URL for the Public Attendee Portal
 * (used identically by PrintableSchedule PDF QR, ProgramEditor, MonitorDashboard, and EmbedSnippet).
 */
export const getPublicPortalUrl = (
  program?: (Partial<Program> & { _id?: string; uuid?: string }) | null
): string => {
  const base = getCanonicalWebOrigin();
  const path = getPublicPortalPath(program);
  return `${base}${path}`;
};

/**
 * Converts any internal display/monitor path (e.g. /stage?id=..., /p/...)
 * into a full shareable URL for QR codes and clipboard links.
 */
export const getShareableDisplayUrl = (path: string): string => {
  const base = getCanonicalWebOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

/**
 * Builds a canonical workspace invite link that works even when copied from the Desktop App.
 */
export const getWorkspaceInviteUrl = (params: { inviteId: string; orgId?: string }): string => {
  const base = getCanonicalWebOrigin();
  const search = new URLSearchParams();
  search.set('inviteId', params.inviteId);
  if (params.orgId) {
    search.set('orgId', params.orgId);
  }
  return `${base}/?${search.toString()}`;
};

/**
 * Resolves an internal display or studio route (e.g. "/stage?programId=123", "/crew?id=123")
 * so that iframes and popout windows work seamlessly in BOTH Web (BrowserRouter) and
 * Electron Desktop / file:// (HashRouter).
 */
export const resolveInternalAppUrl = (pathWithQuery: string): string => {
  const clean = pathWithQuery.replace(/^\/+/, '');
  if (typeof window === 'undefined') return `/${clean}`;

  const isElectronOrFile = Boolean(
    window.location.protocol === 'file:' ||
    (window as any).electron?.isElectron ||
    (window as any).electronAPI?.isElectron
  );

  if (isElectronOrFile) {
    const base = window.location.href.split('#')[0].split('?')[0];
    return `${base}#/${clean}`;
  }

  return `/${clean}`;
};

/**
 * Universally extracts query parameters across BrowserRouter (?a=1),
 * HashRouter (#/route?a=1), and mixed Electron window URLs.
 */
export const getUniversalSearchParams = (routerParams?: URLSearchParams): URLSearchParams => {
  const merged = new URLSearchParams();

  if (typeof window !== 'undefined') {
    if (window.location.search) {
      const winSearch = new URLSearchParams(window.location.search);
      winSearch.forEach((v, k) => merged.set(k, v));
    }
    if (window.location.hash && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
      const hashSearch = new URLSearchParams(hashQuery);
      hashSearch.forEach((v, k) => merged.set(k, v));
    }
  }

  if (routerParams) {
    routerParams.forEach((v, k) => merged.set(k, v));
  }

  return merged;
};

/**
 * Extracts a public program slug from "/p/:slug" or "/p/:slug/crew" across pathname and hash.
 */
export const extractPathSlug = (pathname?: string, hash?: string): string => {
  const candidates = [
    pathname || '',
    hash ? hash.replace(/^#/, '') : '',
    typeof window !== 'undefined' ? window.location.pathname : '',
    typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '',
  ];
  for (const candidate of candidates) {
    const match = candidate.match(/\/p\/([^/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return '';
};

/**
 * Synchronously primes localStorage offline cache for a program so same-origin
 * iframe previews (Output Monitor, MonitorDashboard thumbnails) have instant frame-0 data.
 */
export const primeProgramPreviewCache = (program?: Program | null): void => {
  if (typeof window === 'undefined' || !program || !program.id) return;
  try {
    const serialized = JSON.stringify(program);
    const cleanId = program.id.replace(/^local-/, '');
    localStorage.setItem(`kairon_offline_cache_${program.id}`, serialized);
    if (cleanId) {
      localStorage.setItem(`kairon_offline_cache_${cleanId}`, serialized);
    }
    localStorage.setItem(`kairon_offline_cache_${program.id}_prompter`, serialized);
    if (program.slug) {
      localStorage.setItem(`kairon_offline_cache_${program.slug.replace(/^local-/, '')}`, serialized);
    }
  } catch {
    // Ignore storage quota errors
  }
};
