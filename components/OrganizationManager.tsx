import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization } from '../types';
import { getMyOrganizations, createOrganization, updateOrganizationBranding } from '../services/orgService';
import { Plus, Settings, Building, ChevronRight, Loader, Check, Image as ImageIcon, Palette, Crown } from 'lucide-react';
import { createCheckoutSession } from '../services/stripeService';

interface OrganizationManagerProps {
    userId: string;
    onSelect: (orgId: string) => void;
    activeOrgId?: string;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({ userId, onSelect, activeOrgId }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [brandColor, setBrandColor] = useState('#4f46e5');
    const queryClient = useQueryClient();

    const { data: organizations, isLoading } = useQuery<Organization[]>({
        queryKey: ['my-organizations', userId],
        queryFn: () => getMyOrganizations(userId),
        enabled: !!userId,
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => {
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            return createOrganization(name, slug, userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            setIsCreating(false);
            setNewOrgName('');
        }
    });

    const brandingMutation = useMutation({
        mutationFn: ({ id, logo, color }: { id: string, logo: string, color: string }) => updateOrganizationBranding(id, logo, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            setIsSettingsOpen(null);
            setLogoUrl('');
            setBrandColor('#4f46e5');
        }
    });

    const handleUpgrade = async (orgId: string) => {
        try {
            const { url } = await createCheckoutSession(orgId, 'price_pro_monthly');
            window.location.href = url;
        } catch (error) {
            console.error("Upgrade failed:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Organizations</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your production teams and work spaces.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all"
                >
                    <Plus size={18} /> New Organization
                </button>
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create New Organization</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="Organization Name (e.g. Grace Church)"
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                        <button
                            onClick={() => createMutation.mutate(newOrgName)}
                            disabled={createMutation.isPending || !newOrgName.trim()}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2 text-slate-500 hover:text-slate-700 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {organizations?.map(org => (
                    <div
                        key={org.id}
                        onClick={() => onSelect(org.id)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${activeOrgId === org.id
                            ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeOrgId === org.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600'}`}>
                                {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain rounded-xl" />
                                ) : (
                                    <Building size={24} />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-bold transition-colors ${activeOrgId === org.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {org.name}
                                    </h3>
                                    {org.subscriptionStatus === 'pro' && (
                                        <Crown size={14} className="text-amber-500 fill-amber-500" />
                                    )}
                                </div>
                                <p className={`text-xs transition-colors ${activeOrgId === org.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    {org.subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Workspace'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeOrgId === org.id && <Check size={20} className="text-white" />}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSettingsOpen(org.id);
                                    setLogoUrl(org.logoUrl || '');
                                    setBrandColor(org.brandColor || '#4f46e5');
                                }}
                                className={`p-2 rounded-lg transition-colors ${activeOrgId === org.id ? 'text-white/70 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'}`}
                            >
                                <Settings size={18} />
                            </button>
                            <ChevronRight size={18} className={activeOrgId === org.id ? 'text-white/40' : 'text-slate-300'} />
                        </div>
                    </div>
                ))}

                {organizations?.length === 0 && !isCreating && (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                        <Building className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No organizations yet</h4>
                        <p className="text-slate-500 text-sm max-w-xs mb-6">Create an organization to start building and managing production teams.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
                        >
                            Get Started
                        </button>
                    </div>
                )}
            </div>

            {isSettingsOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsSettingsOpen(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Settings</h3>
                                <p className="text-slate-500 text-sm">Customize your organization identity</p>
                            </div>
                            <button onClick={() => setIsSettingsOpen(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-transform hover:scale-110">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        {organizations && organizations.find(o => o.id === isSettingsOpen)?.subscriptionStatus !== 'pro' ? (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <Crown className="text-indigo-600 dark:text-indigo-400" size={24} />
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Unlock Pro Features</h4>
                                </div>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                                    Custom branding, logos, and AI-powered scheduling are only available for Pro teams.
                                </p>
                                <button
                                    onClick={() => handleUpgrade(isSettingsOpen!)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                                >
                                    Upgrade Workspace
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <ImageIcon size={16} /> Logo URL
                                    </label>
                                    <input
                                        type="text"
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Palette size={16} /> Brand Color
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            value={brandColor}
                                            onChange={(e) => setBrandColor(e.target.value)}
                                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={brandColor}
                                            onChange={(e) => setBrandColor(e.target.value)}
                                            placeholder="#4f46e5"
                                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => brandingMutation.mutate({ id: isSettingsOpen!, logo: logoUrl, color: brandColor })}
                                        disabled={brandingMutation.isPending}
                                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {brandingMutation.isPending ? 'Saving...' : 'Save Branding Changes'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
