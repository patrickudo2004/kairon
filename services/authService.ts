import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Profile } from '../types';

// Simple session retrieval logic - now handles real IDs from Convex Auth
export const getSession = () => {
    // In Convex Auth, the session is managed by the provider, 
    // but some existing logic might still expect a user object.
    // For now, we'll return null to force components to use the useAuthActions hook
    // and useUserIdentity hook for real session data.
    return null;
};

// These will be replaced by useAuthActions in the components
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
        fullName: patch.fullName || "Kairon Developer",
        avatarUrl: patch.avatarUrl
    });
};

export const upsertProfile = async (userId: string, fullName: string, avatarUrl?: string): Promise<void> => {
    await convex.mutation(api.profiles.upsertProfile, { userId, fullName, avatarUrl });
};

export const signOut = async () => {
    throw new Error("Use useAuthActions() hook for signOut");
};
