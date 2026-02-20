import { supabase } from './supabaseClient';

export const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
};

export const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
    if (error) throw error;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return {
        id: data.id,
        fullName: data.full_name,
        avatarUrl: data.avatar_url
    };
};

export const updateProfile = async (userId: string, data: { fullName: string, avatarUrl?: string }) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: data.fullName,
            avatar_url: data.avatarUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;
};
