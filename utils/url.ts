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
