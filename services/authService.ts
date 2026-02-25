import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Profile } from '../types';

// Simple local session management for Dev Mode
const LOCAL_STORAGE_KEY = 'kairon_dev_user';

export const getSession = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const signInWithGoogle = async () => {
    // Simulate Google Login for Dev
    const mockUser = { id: 'dev-user-123', email: 'dev@kairon.ai' };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
    window.location.reload();
};

export const signInWithMagicLink = async (email: string) => {
    // Simulate Magic Link for Dev
    const mockUser = { id: 'dev-user-123', email };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
    // In a real app we'd wait for the email link, here we just sim it
    setTimeout(() => window.location.reload(), 1500);
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
    if (!userId) return null;
    const data = await convex.query(api.profiles.getProfile, { userId });
    if (!data) {
        // Auto-create profile in dev mode if it doesn't exist
        await convex.mutation(api.profiles.upsertProfile, {
            userId,
            fullName: "Kairon Developer"
        });
        return { id: userId, fullName: "Kairon Developer" };
    }
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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
};
