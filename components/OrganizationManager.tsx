import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization } from '../types';
import { getMyOrganizations, createOrganization, updateOrganizationBranding, deleteOrganization, generateUploadUrl } from '../services/orgService';
import { migratePrograms, deleteAllProgramsInOrg, getPrograms } from '../services/programService';
import { Plus, Settings, Building, ChevronRight, Loader, Check, Image as ImageIcon, Palette, Crown, X, AlertTriangle, ArrowRight, Trash2, Upload } from 'lucide-react';
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const isTestBypass = window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true';

            if (isTestBypass) {
                // Test mode: read as base64 data URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoUrl(reader.result as string);
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
            } else {
                // Real mode: Convex storage upload
                const uploadUrl = await generateUploadUrl();
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': file.type,
                    },
                    body: file,
                });
                
                if (!response.ok) throw new Error("Upload failed");
                const { storageId } = await response.json();
                setLogoUrl(storageId);
                setIsUploading(false);
            }
        } catch (err) {
            console.error("Logo upload failed:", err);
            alert("Failed to upload logo. Please try again.");
            setIsUploading(false);
        }
    };

    // Deletion State
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deletionSlug, setDeletionSlug] = useState('');
    const [deleteOption, setDeleteOption] = useState<'purge' | 'migrate'>('purge');
    const [targetOrgId, setTargetOrgId] = useState('');
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

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

    const deleteOrgMutation = useMutation({
        mutationFn: async (orgId: string) => {
            if (deleteOption === 'migrate') {
                if (!targetOrgId) throw new Error("Please select a target organization.");
                const programs = await getPrograms(orgId);
                const programIds = programs.map(p => p.id);
                if (programIds.length > 0) {
                    await migratePrograms(targetOrgId, programIds);
                }
            } else {
                await deleteAllProgramsInOrg(orgId);
            }
            return await deleteOrganization(orgId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            setIsDeleting(null);
            setIsSettingsOpen(null);
            setDeletionSlug('');
            setHoldProgress(0);
        },
        onError: (error) => {
            alert(error instanceof Error ? error.message : "Deletion failed");
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
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsCreating(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">New Organization</h3>
                                <p className="text-slate-500 text-sm">Create a workspace for your team.</p>
                            </div>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-transform hover:scale-110"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    placeholder="e.g. Grace Church Main"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={() => createMutation.mutate(newOrgName)}
                                disabled={createMutation.isPending || !newOrgName.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Creating Workspace...' : 'Create Organization'}
                            </button>
                        </div>
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
                                <X size={24} />
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
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <ImageIcon size={18} className="text-slate-400" />
                                        Workspace Logo
                                    </label>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                                            {logoUrl ? <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" />}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    <Upload size={12} />
                                                    {isUploading ? 'Uploading...' : 'Upload Image'}
                                                </button>
                                                <span className="text-[10px] text-slate-400 font-medium">or paste URL:</span>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleLogoUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <input
                                                type="url"
                                                value={logoUrl}
                                                onChange={(e) => setLogoUrl(e.target.value)}
                                                placeholder="https://your-domain.com/logo.png"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
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

                                {/* Danger Zone */}
                                <div className="mt-8 pt-6 border-t border-rose-500/10 dark:border-rose-500/20">
                                    <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                                    <button
                                        onClick={() => setIsDeleting(isSettingsOpen)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all group"
                                    >
                                        <Trash2 size={18} className="transition-transform group-hover:rotate-12" />
                                        Delete Organization
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isDeleting && (
                <div
                    className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => {
                        if (!deleteOrgMutation.isPending) {
                            setIsDeleting(null);
                            setDeletionSlug('');
                            setHoldProgress(0);
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Serious Action Required</h2>
                            <p className="text-slate-500 max-w-sm">
                                You are about to delete <span className="font-black text-slate-900 dark:text-white">"{organizations?.find(o => o.id === isDeleting)?.name}"</span>. This cannot be undone.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDeleteOption('purge')}
                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${deleteOption === 'purge'
                                        ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/10'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <Trash2 size={24} className={deleteOption === 'purge' ? 'text-rose-500' : 'text-slate-400'} />
                                    <div>
                                        <div className={`font-bold ${deleteOption === 'purge' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>Purge All</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-black">Wipe Events</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setDeleteOption('migrate')}
                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${deleteOption === 'migrate'
                                        ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <ArrowRight size={24} className={deleteOption === 'migrate' ? 'text-indigo-500' : 'text-slate-400'} />
                                    <div>
                                        <div className={`font-bold ${deleteOption === 'migrate' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>Migrate</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-black">Move Events</div>
                                    </div>
                                </button>
                            </div>

                            {deleteOption === 'migrate' && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Select Target Workspace</label>
                                    <select
                                        value={targetOrgId}
                                        onChange={(e) => setTargetOrgId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Choose target workspace --</option>
                                        {organizations?.filter(o => o.id !== isDeleting).map(o => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Type <span className="text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">{organizations?.find(o => o.id === isDeleting)?.slug}</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deletionSlug}
                                    onChange={(e) => setDeletionSlug(e.target.value)}
                                    placeholder="your-org-slug"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-rose-500 transition-colors text-center"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onMouseDown={() => {
                                        if (deletionSlug === organizations?.find(o => o.id === isDeleting)?.slug && !deleteOrgMutation.isPending) {
                                            setIsHolding(true);
                                            const start = Date.now();
                                            const interval = setInterval(() => {
                                                const elapsed = Date.now() - start;
                                                const progress = Math.min(100, (elapsed / 3000) * 100);
                                                setHoldProgress(progress);
                                                if (progress >= 100) {
                                                    clearInterval(interval);
                                                    setIsHolding(false);
                                                    deleteOrgMutation.mutate(isDeleting);
                                                }
                                            }, 20);
                                            (window as any)._holdInterval = interval;
                                        }
                                    }}
                                    onMouseUp={() => {
                                        setIsHolding(false);
                                        clearInterval((window as any)._holdInterval);
                                        if (holdProgress < 100) setHoldProgress(0);
                                    }}
                                    onMouseLeave={() => {
                                        setIsHolding(false);
                                        clearInterval((window as any)._holdInterval);
                                        if (holdProgress < 100) setHoldProgress(0);
                                    }}
                                    disabled={deletionSlug !== organizations?.find(o => o.id === isDeleting)?.slug || deleteOrgMutation.isPending}
                                    className={`relative w-full py-5 rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all active:scale-95 disabled:opacity-30 disabled:grayscale ${deletionSlug === organizations?.find(o => o.id === isDeleting)?.slug ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-rose-950/30 transition-all ease-linear"
                                        style={{ width: `${holdProgress}%` }}
                                    />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {deleteOrgMutation.isPending ? (
                                            <Loader className="animate-spin" size={20} />
                                        ) : holdProgress > 0 ? (
                                            `HOLDING... ${Math.floor(holdProgress)}%`
                                        ) : (
                                            <>HOLD TO DELETE WORKSPACE</>
                                        )}
                                    </span>
                                </button>
                                <p className="text-center text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
                                    Ownership will be verified.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
