import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Profile } from '../types';

export const getSession = () => {
    return null;
};

export const signInWithGoogle = async () => {
    throw new Error("Use useAuthActions() hook for signInWithGoogle");
};

export const signInWithMagicLink = async (email: string) => {
    throw new Error("Use useAuthActions() hook for signInWithMagicLink");
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
    if (!userId) return null;
    const data = await convex.query(api.profiles.getProfile, { userId });
    if (!data) return null;

    return {
        id: data.userId,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl
    };
};

export const updateProfile = async (userId: string, patch: { fullName?: string, avatarUrl?: string }): Promise<void> => {
    await convex.mutation(api.profiles.upsertProfile, {
        userId,
        fullName: patch.fullName || "Kairon Operator",
        avatarUrl: patch.avatarUrl
    });
};

export const upsertProfile = async (userId: string, fullName: string, avatarUrl?: string): Promise<void> => {
    await convex.mutation(api.profiles.upsertProfile, { userId, fullName, avatarUrl });
};

/**
 * Thoroughly clears all local session tokens, private cached rundowns, prompter scripts,
 * and workspace metadata on sign-out so shared booth computers leave zero data residue
 * (UK GDPR Art. 5(1)(f) & Art. 32).
 */
export const clearLocalUserSessionData = (): void => {
    if (typeof window === 'undefined') return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const isAuthKey =
                k.includes('__convexAuthJWT') ||
                k.includes('__convexAuthRefreshToken') ||
                k.includes('__convexAuthOAuthVerifier');
            const isPrivateSessionCache =
                k === 'kairon_booth_mode' ||
                k === 'testBypass' ||
                k === 'kairon_active_org_id' ||
                k === 'kairon_program' ||
                k === 'kairon_offline_programs' ||
                k === 'kairon_master_live_session' ||
                k === 'kairon_offline_ledger_v1' ||
                k === 'kairon_entitlement_cache_v1' ||
                k === 'kairon_local_folder_path' ||
                k === 'kairon_local_folder_name' ||
                k === 'kairon_elapsed_seconds' ||
                k === 'programs' ||
                k === 'test_programs' ||
                k === 'test_org_branding' ||
                k === 'test_acknowledgements' ||
                k.startsWith('kairon_offline_cache_') ||
                k.startsWith('prompt_');

            if (isAuthKey || isPrivateSessionCache) {
                keysToRemove.push(k);
            }
        }
        for (const k of keysToRemove) {
            localStorage.removeItem(k);
        }

        sessionStorage.removeItem('pendingInviteId');
        sessionStorage.removeItem('pendingOrgId');
        sessionStorage.removeItem('kairon_desktop_pairing_code');
        sessionStorage.removeItem('testBypass');

        window.dispatchEvent(new Event('kairon_booth_mode_changed'));
    } catch (e) {
        console.warn("Error during local sign-out cleanup:", e);
    }
};

export const signOut = async (): Promise<void> => {
    clearLocalUserSessionData();
};

/**
 * UK GDPR Art. 15 / 20 — Free self-service data export (works in Cloud & Offline Booth Mode).
 */
export const exportMyAccountData = async (isLocalMode = false): Promise<Record<string, any>> => {
    if (isLocalMode) {
        const localPrograms = (() => {
            try {
                return JSON.parse(localStorage.getItem('kairon_offline_programs') || '[]');
            } catch {
                return [];
            }
        })();
        return {
            exportedAt: new Date().toISOString(),
            mode: 'local-offline',
            programs: localPrograms,
        };
    }
    return await convex.query(api.profiles.exportMyData, {});
};

/**
 * UK GDPR Art. 17 — Self-service account erasure.
 */
export const deleteMyAccount = async (): Promise<{ deleted: boolean }> => {
    const res = await convex.mutation(api.profiles.deleteMyAccount, {});
    clearLocalUserSessionData();
    return res;
};
