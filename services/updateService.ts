/**
 * Kairon Studio Update Service
 * Checks GitHub Releases API for new versions across Windows, macOS, and Linux.
 * Zero-friction, offline-resilient, non-blocking broadcast design.
 */

export const CURRENT_APP_VERSION = '1.0.7';

export interface GitHubReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseName: string;
  publishedAt: string;
  releaseUrl: string;
  downloadUrl?: string;
  assetName?: string;
  targetOS: 'windows' | 'mac' | 'linux' | 'web';
  error?: string;
  isRateLimited?: boolean;
}

/**
 * Cleanly compares two semver strings (e.g. 'v1.0.6' vs '1.0.5').
 * Returns 1 if vA > vB, -1 if vA < vB, 0 if equal.
 */
export function compareSemver(vA: string, vB: string): number {
  const clean = (v: string) =>
    (v || '')
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const [a1 = 0, a2 = 0, a3 = 0] = clean(vA);
  const [b1 = 0, b2 = 0, b3 = 0] = clean(vB);

  if (a1 !== b1) return a1 > b1 ? 1 : -1;
  if (a2 !== b2) return a2 > b2 ? 1 : -1;
  if (a3 !== b3) return a3 > b3 ? 1 : -1;
  return 0;
}

/**
 * Detect client platform for asset matching.
 */
export function detectPlatform(): 'windows' | 'mac' | 'linux' | 'web' {
  if (typeof window === 'undefined') return 'windows';

  // Check Electron bridge platform first
  const electronPlatform = (window as any).electronAPI?.platform || (window as any).electron?.platform;
  if (electronPlatform === 'win32') return 'windows';
  if (electronPlatform === 'darwin') return 'mac';
  if (electronPlatform === 'linux') return 'linux';

  // Fallback to userAgent
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('mac') || ua.includes('darwin')) return 'mac';
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('win')) return 'windows';

  return 'web';
}

/**
 * Matches appropriate binary asset from GitHub release assets for host OS.
 */
export function selectAssetForPlatform(
  assets: GitHubReleaseAsset[] = [],
  platform: 'windows' | 'mac' | 'linux' | 'web'
): { downloadUrl: string; assetName: string } | undefined {
  if (!assets || assets.length === 0) return undefined;

  if (platform === 'windows') {
    // Prefer Setup.exe (NSIS installer), fallback to any .exe
    const setupExe = assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.toLowerCase().endsWith('.exe'));
    if (setupExe) return { downloadUrl: setupExe.browser_download_url, assetName: setupExe.name };
    const anyExe = assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
    if (anyExe) return { downloadUrl: anyExe.browser_download_url, assetName: anyExe.name };
  } else if (platform === 'mac') {
    // Prefer .dmg, fallback to .zip
    const dmg = assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));
    if (dmg) return { downloadUrl: dmg.browser_download_url, assetName: dmg.name };
    const zip = assets.find((a) => a.name.toLowerCase().endsWith('.zip'));
    if (zip) return { downloadUrl: zip.browser_download_url, assetName: zip.name };
  } else if (platform === 'linux') {
    // Prefer .AppImage, fallback to .deb
    const appImage = assets.find((a) => a.name.toLowerCase().endsWith('.appimage'));
    if (appImage) return { downloadUrl: appImage.browser_download_url, assetName: appImage.name };
    const deb = assets.find((a) => a.name.toLowerCase().endsWith('.deb'));
    if (deb) return { downloadUrl: deb.browser_download_url, assetName: deb.name };
  }

  // Fallback to first available asset or undefined
  if (assets[0]) {
    return { downloadUrl: assets[0].browser_download_url, assetName: assets[0].name };
  }
  return undefined;
}

/**
 * Checks GitHub Releases API for Kairon Studio updates.
 * Throttles background checks unless `force` is true.
 */
export async function checkForUpdates(force = false): Promise<UpdateCheckResult> {
  const currentVersion = CURRENT_APP_VERSION;
  const platform = detectPlatform();

  const fallbackResult: UpdateCheckResult = {
    isUpdateAvailable: false,
    currentVersion,
    latestVersion: currentVersion,
    releaseNotes: '',
    releaseName: `v${currentVersion}`,
    publishedAt: '',
    releaseUrl: 'https://github.com/patrickudo2004/kairon/releases',
    targetOS: platform,
  };

  // Throttling for automatic background calls (4 hour cooldown)
  if (!force && typeof localStorage !== 'undefined') {
    const lastCheck = parseInt(localStorage.getItem('kairon_last_update_check_time') || '0', 10);
    const cached = localStorage.getItem('kairon_latest_release_cache');
    if (Date.now() - lastCheck < 4 * 60 * 60 * 1000 && cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed;
      } catch {}
    }
  }

  // 1. Electron Desktop Runtime: Delegate to IPC handler (bypasses browser CORS & API rate limits via Atom feed fallback)
  const electronAPI = typeof window !== 'undefined' ? ((window as any).electronAPI || (window as any).electron) : null;
  if (electronAPI && typeof electronAPI.checkForUpdates === 'function') {
    try {
      const resp = await electronAPI.checkForUpdates();
      if (resp?.success && resp.data) {
        const data = resp.data;
        const rawTag = data.tag_name || '';
        const cleanTag = rawTag.replace(/^v/i, '');
        const hasNewerVersion = compareSemver(cleanTag, currentVersion) > 0;
        const matchedAsset = selectAssetForPlatform(data.assets, platform);

        const result: UpdateCheckResult = {
          isUpdateAvailable: hasNewerVersion,
          currentVersion,
          latestVersion: cleanTag,
          releaseNotes: data.body || 'No release notes provided.',
          releaseName: data.name || data.tag_name,
          publishedAt: data.published_at || '',
          releaseUrl: data.html_url || 'https://github.com/patrickudo2004/kairon/releases',
          downloadUrl: matchedAsset?.downloadUrl || data.html_url,
          assetName: matchedAsset?.assetName,
          targetOS: platform,
        };

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('kairon_last_update_check_time', Date.now().toString());
          localStorage.setItem('kairon_latest_release_cache', JSON.stringify(result));
        }
        return result;
      }
    } catch (e) {
      console.warn('[Kairon Update Service] Electron IPC update check fallback:', e);
    }
  }

  // 2. Web Browser Runtime: Direct fetch from GitHub API with rate-limit resilience
  try {
    const GITHUB_REPO_URL = 'https://api.github.com/repos/patrickudo2004/kairon/releases/latest';

    const response = await fetch(GITHUB_REPO_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: force ? 'no-cache' : 'default',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return fallbackResult;
      }
      if (response.status === 403) {
        const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('kairon_latest_release_cache') : null;
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
        return {
          ...fallbackResult,
          isRateLimited: true,
          error: 'GitHub API rate limit reached (60/hour). Kairon is running normally.',
        };
      }
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data: GitHubRelease = await response.json();
    const rawTag = data.tag_name || '';
    const cleanTag = rawTag.replace(/^v/i, '');

    const hasNewerVersion = compareSemver(cleanTag, currentVersion) > 0;
    const matchedAsset = selectAssetForPlatform(data.assets, platform);

    const result: UpdateCheckResult = {
      isUpdateAvailable: hasNewerVersion,
      currentVersion,
      latestVersion: cleanTag,
      releaseNotes: data.body || 'No release notes provided.',
      releaseName: data.name || data.tag_name,
      publishedAt: data.published_at || '',
      releaseUrl: data.html_url || 'https://github.com/patrickudo2004/kairon/releases',
      downloadUrl: matchedAsset?.downloadUrl || data.html_url,
      assetName: matchedAsset?.assetName,
      targetOS: platform,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kairon_last_update_check_time', Date.now().toString());
      localStorage.setItem('kairon_latest_release_cache', JSON.stringify(result));
    }

    return result;
  } catch (err: any) {
    console.warn('[Kairon Update Service] Update check failed or offline:', err.message);
    return {
      ...fallbackResult,
      error: err.message || 'Network unavailable',
    };
  }
}

/**
 * Opens download URL in external browser or via Electron shell.
 */
export function openDownloadUrl(url: string) {
  if (!url) return;
  if (typeof window !== 'undefined') {
    const electronAPI = (window as any).electronAPI || (window as any).electron;
    if (electronAPI && typeof electronAPI.openExternalUrl === 'function') {
      electronAPI.openExternalUrl(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
