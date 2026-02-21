import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization, OrganizationMember } from '../types';
import { getOrgMembers, updateOrganizationBranding } from '../services/orgService';
import {
    Settings,
    Users,
    Palette,
    Image as ImageIcon,
    Crown,
    Shield,
    UserPlus,
    Mail,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPanelProps {
    organization: Organization;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ organization }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'branding' | 'members'>('branding');

    // Branding State
    const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');
    const [brandColor, setBrandColor] = useState(organization.brandColor || '#4f46e5');

    // Members Query
    const { data: members = [], isLoading: loadingMembers } = useQuery<OrganizationMember[]>({
        queryKey: ['org-members', organization.id],
        queryFn: () => getOrgMembers(organization.id),
    });

    const brandingMutation = useMutation({
        mutationFn: ({ logo, color }: { logo: string, color: string }) =>
            updateOrganizationBranding(organization.id, logo, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            alert('Branding updated successfully!');
        }
    });

    const isPro = organization.subscriptionStatus === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Settings className="text-indigo-600" />
                                {organization.name} Settings
                            </h1>
                            <p className="text-slate-500 text-sm">Manage your workspace members and branding.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'branding'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Palette size={18} />
                            <span className="font-semibold">Branding</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'members'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Users size={18} />
                            <span className="font-semibold">Team Members</span>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === 'branding' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Visual Identity</h2>
                                        <p className="text-slate-500 text-sm">Custom logos and colors help reinforce your brand on all displays.</p>
                                    </div>
                                    {!isPro && (
                                        <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                            <Crown size={12} /> Pro Feature
                                        </div>
                                    )}
                                </div>

                                <div className={`space-y-8 ${!isPro ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <ImageIcon size={18} className="text-slate-400" />
                                            Workspace Logo
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden">
                                                {logoUrl ? <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" />}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="url"
                                                    value={logoUrl}
                                                    onChange={(e) => setLogoUrl(e.target.value)}
                                                    placeholder="https://your-domain.com/logo.png"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-2 italic">Supports PNG, SVG, or JPG. Recommended size 512x512px.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <Palette size={18} className="text-slate-400" />
                                            Accent Color
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={brandColor}
                                                onChange={(e) => setBrandColor(e.target.value)}
                                                className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={brandColor}
                                                    onChange={(e) => setBrandColor(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => brandingMutation.mutate({ logo: logoUrl, color: brandColor })}
                                            disabled={brandingMutation.isPending}
                                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
                                        >
                                            {brandingMutation.isPending ? 'Saving...' : 'Save Branding'}
                                        </button>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="mt-8 p-6 bg-indigo-600 rounded-2xl text-white">
                                        <h4 className="font-bold text-lg mb-2">Upgrade to Pro</h4>
                                        <p className="text-indigo-100 text-sm mb-4">
                                            Unlock custom branding, logos, and AI-powered scheduling for your entire organization.
                                        </p>
                                        <button className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                                            See Pro Plans
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Team Access</h2>
                                        <p className="text-slate-500 text-sm">Manage who has access to this workspace.</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">
                                        <UserPlus size={18} /> Invite Member
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Mail size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {member.userId === organization.createdBy ? 'Owner' : 'Team Member'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        {member.role === 'admin' ? <Shield size={10} className="text-rose-500" /> : <Users size={10} className="text-indigo-500" />}
                                                        {member.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300" />
                                        </div>
                                    ))}
                                    {loadingMembers && <p className="text-center text-slate-400 py-8">Loading members...</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
