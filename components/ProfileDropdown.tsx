import React, { useState, useRef, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, LogOut, Settings, Check, UserCircle } from 'lucide-react';
import { Profile } from '../types';
import { signOut, updateProfile } from '../services/authService';
import { Link } from 'react-router-dom';

interface ProfileDropdownProps {
    user: SupabaseUser;
    profile: Profile | null;
    onProfileUpdate: (newProfile: Profile) => void;
    isCollapsed?: boolean;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, profile, onProfileUpdate, isCollapsed = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(profile?.fullName || '');
    const [isSaving, setIsSaving] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            window.location.reload();
        } catch (err) {
            console.error("Failed to sign out:", err);
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsSaving(true);
        try {
            await updateProfile(user.id, { fullName: newName });
            onProfileUpdate({
                ...profile!,
                fullName: newName
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const initial = profile?.fullName?.charAt(0) || user?.email?.charAt(0) || '?';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group overflow-hidden ${isCollapsed ? 'w-12 h-12 justify-center p-0' : 'w-full p-2 pr-4 h-14'
                    }`}
            >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                    {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase">{initial}</span>
                    )}
                </div>
                {!isCollapsed && (
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {profile?.fullName || 'User Profile'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate tracking-tight">
                            {user?.email}
                        </p>
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                                {initial.toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {profile?.fullName || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                            >
                                <User size={18} className="text-slate-400 group-hover:text-indigo-500" />
                                <span>Edit Profile Name</span>
                            </button>
                        ) : (
                            <form onSubmit={handleUpdateName} className="px-4 py-3 animate-in fade-in duration-300">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        disabled={isSaving}
                                        type="submit"
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                                    </button>
                                </div>
                            </form>
                        )}

                        <Link
                            to="/admin"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                        >
                            <Settings size={18} className="text-slate-400 group-hover:text-amber-500" />
                            <span>Workspace Settings</span>
                        </Link>

                        <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors group font-semibold"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
