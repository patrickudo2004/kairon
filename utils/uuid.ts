/**
 * Generates an RFC 4122 v4 UUID safely across both Secure Contexts (HTTPS / localhost)
 * and non-HTTPS local LAN HTTP contexts (e.g., mobile/tablet devices connecting to
 * http://192.168.x.x on church/venue Wi-Fi where `crypto.randomUUID` is unavailable).
 */
export function generateUUID(): string {
  try {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    // Fallback below
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Polyfills `crypto.randomUUID` on non-HTTPS LAN origins so third-party libraries
 * also stay crash-free on mobile/tablet browsers over local Wi-Fi.
 */
export function ensureCryptoRandomUUID(): void {
  try {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID !== 'function') {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: generateUUID,
        configurable: true,
        writable: true,
      });
    }
  } catch {
    // Ignore read-only Crypto host objects; direct callers use generateUUID()
  }
}
