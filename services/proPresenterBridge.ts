export interface ProPresenterConfig {
  enabled: boolean;
  host: string;
  port: number;
  autoForwardStageMessages: boolean;
}

const STORAGE_KEY = 'kairon_propresenter_config_v1';

export function getProPresenterConfig(): ProPresenterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        enabled: false,
        host: '127.0.0.1',
        port: 1025,
        autoForwardStageMessages: true,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      enabled: false,
      host: '127.0.0.1',
      port: 1025,
      autoForwardStageMessages: true,
    };
  }
}

export function saveProPresenterConfig(config: ProPresenterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save ProPresenter config:', err);
  }
}

export async function testProPresenterConnection(
  host: string,
  port: number
): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`http://${host}:${port}/v1/version`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      version: data?.host_description || data?.name || 'ProPresenter 7 Connected',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'Connection timed out (check IP/Port & Network API enabled in ProPresenter)' : (err?.message || 'Unreachable'),
    };
  }
}

export async function sendProPresenterStageMessage(text: string): Promise<boolean> {
  const cfg = getProPresenterConfig();
  if (!cfg.enabled || !cfg.autoForwardStageMessages) return false;
  try {
    const res = await fetch(`http://${cfg.host}:${cfg.port}/v1/stage/message`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(text),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearProPresenterStageMessage(): Promise<boolean> {
  const cfg = getProPresenterConfig();
  if (!cfg.enabled || !cfg.autoForwardStageMessages) return false;
  try {
    const res = await fetch(`http://${cfg.host}:${cfg.port}/v1/stage/message`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
