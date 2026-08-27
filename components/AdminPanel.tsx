import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization, OrganizationMember } from '../types';
import { getOrgMembers, updateOrganizationBranding, generateUploadUrl } from '../services/orgService';
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
    ArrowLeft,
    Trash2,
    AlertCircle,
    Link as LinkIcon,
    Check,
    AlertTriangle,
    ArrowRight,
    Loader,
    Upload,
    Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteOrganization } from '../services/orgService';
import { migratePrograms, deleteAllProgramsInOrg, getPrograms } from '../services/programService';

interface AdminPanelProps {
    organization: Organization;
    currentUserRole?: string;
    currentUser?: { id: string, email?: string } | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ organization, currentUserRole, currentUser }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'branding' | 'members' | 'danger'>('branding');

    // Branding State
    const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');
    const [previewUrl, setPreviewUrl] = useState(organization.logoUrl || '');
    const [orgName, setOrgName] = useState(organization.name || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Instantly display the local image file in preview box
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        try {
            setIsUploading(true);
            const isTestBypass = window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true';

            if (isTestBypass) {
                // Test mode: read as base64 data URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoUrl(reader.result as string);
                    setPreviewUrl(reader.result as string);
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
    const [brandColor, setBrandColor] = useState(organization.brandColor || '#4f46e5');

    // Invite Modal State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'operator'>('operator');
    const [inviteError, setInviteError] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Deletion State
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletionSlug, setDeletionSlug] = useState('');
    const [deleteOption, setDeleteOption] = useState<'purge' | 'migrate'>('purge');
    const [targetOrgId, setTargetOrgId] = useState('');
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

    const copyInviteLink = (inviteId: string) => {
        const url = `${window.location.origin}/?inviteId=${inviteId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(inviteId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Members Query (Now returning detailed info)
    const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery<any[]>({
        queryKey: ['org-members', organization.id],
        queryFn: () => getOrgMembers(organization.id),
    });

    const brandingMutation = useMutation({
        mutationFn: ({ logo, color, name }: { logo: string, color: string, name: string }) =>
            updateOrganizationBranding(organization.id, logo, color, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            alert('Workspace settings updated successfully!');
        }
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string, role: 'admin' | 'manager' | 'operator' }) =>
            import('../services/orgService').then(s => s.inviteMember(organization.id, data.email, data.role)),
        onSuccess: (data: any) => {
            setIsInviteOpen(false);
            setInviteEmail('');
            setInviteError('');
            refetchMembers();
            alert('Invitation sent successfully!');
        },
        onError: (err: any) => {
            setInviteError(err.message || 'Failed to add member');
        }
    });

    const removeMutation = useMutation({
        mutationFn: (memberId: string) =>
            import('../services/orgService').then(s => s.removeMember(memberId)),
        onSuccess: () => {
            refetchMembers();
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to remove member');
        }
    });

    const roleMutation = useMutation({
        mutationFn: (data: { memberId: string, role: string }) =>
            import('../services/orgService').then(s => s.updateMemberRole(data.memberId, data.role)),
        onSuccess: () => {
            refetchMembers();
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to update role');
        }
    });

    const cancelInviteMutation = useMutation({
        mutationFn: (inviteId: string) =>
            import('../services/orgService').then(s => s.cancelInvite(inviteId)),
        onSuccess: () => {
            refetchMembers();
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to cancel invitation');
        }
    });

    const deleteOrgMutation = useMutation({
        mutationFn: async () => {
            if (deleteOption === 'migrate') {
                if (!targetOrgId) throw new Error("Please select a target organization.");
                const programs = await getPrograms(organization.id);
                const programIds = programs.map(p => p.id);
                if (programIds.length > 0) {
                    await migratePrograms(targetOrgId, programIds);
                }
            } else {
                await deleteAllProgramsInOrg(organization.id);
            }
            return await deleteOrganization(organization.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });

            // Find another organization to redirect to
            const otherOrg = allOrgs.find(o => o.id !== organization.id);
            if (otherOrg) {
                // Navigate to home and let the switcher pick the new active org
                window.location.href = '/';
            } else {
                navigate('/');
            }
        },
        onError: (error) => {
            alert(error instanceof Error ? error.message : "Deletion failed");
        }
    });

    const isPro = organization.subscriptionStatus === 'pro';

    // Get candidate organizations for migration and deletion logic
    const { data: allOrgs = [] } = useQuery<Organization[]>({
        queryKey: ['my-organizations', currentUser?.id],
        queryFn: () => import('../services/orgService').then(s => s.getMyOrganizations(currentUser!.id)),
        enabled: !!currentUser?.id && activeTab === 'danger'
    });

    const isOnlyOrg = allOrgs.length <= 1;

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
                                <Settings className="text-[#0EA5E9]" size={24} />
                                {organization.name}
                            </h1>
                            <p className="text-slate-500 dark:text-[#8A93A4] text-sm">Managing collaboration and branding.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1 space-y-2 font-mono">
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'branding'
                                ? 'bg-[#0EA5E9] text-white shadow-md'
                                : 'text-slate-500 dark:text-[#8A93A4] hover:bg-slate-200 dark:hover:bg-[#181B22]'
                                }`}
                        >
                            <Palette size={18} />
                            <span className="font-semibold text-xs uppercase tracking-wider">Branding</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'members'
                                ? 'bg-[#0EA5E9] text-white shadow-md'
                                : 'text-slate-500 dark:text-[#8A93A4] hover:bg-slate-200 dark:hover:bg-[#181B22]'
                                }`}
                        >
                            <Users size={18} />
                            <span className="font-semibold text-xs uppercase tracking-wider">Team Members</span>
                        </button>
                        {currentUserRole === 'admin' && (
                            <button
                                onClick={() => setActiveTab('danger')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'danger'
                                    ? 'bg-[#EF4444] text-white shadow-md'
                                    : 'text-[#EF4444] hover:bg-[#EF4444]/10'
                                    }`}
                            >
                                <AlertTriangle size={18} />
                                <span className="font-semibold text-xs uppercase tracking-wider">Danger Zone</span>
                            </button>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === 'branding' && (
                            <div className="bg-white dark:bg-[#121418] rounded-2xl p-8 border border-slate-200 dark:border-[#22262E] shadow-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Visual Identity</h2>
                                        <p className="text-slate-500 dark:text-[#8A93A4] text-sm">Custom logos and colors help reinforce your brand on all displays.</p>
                                    </div>
                                    {!isPro && (
                                        <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider font-mono">
                                            <Crown size={12} /> Pro Feature
                                        </div>
                                    )}
                                </div>

                                <div className={`space-y-8 ${!isPro ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <Building className="text-slate-400" size={18} />
                                            Workspace Name
                                        </label>
                                        <input
                                            type="text"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            placeholder="Workspace Name"
                                            className="w-full bg-slate-50 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <ImageIcon size={18} className="text-slate-400" />
                                            Workspace Logo
                                        </label>
                                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-[#181B22] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#22262E] overflow-hidden shrink-0">
                                                {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" />}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3 font-mono">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        <Upload size={14} />
                                                        {isUploading ? 'Uploading...' : 'Upload Image'}
                                                    </button>
                                                    <span className="text-xs text-slate-400 font-medium">or paste URL below:</span>
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
                                                    onChange={(e) => {
                                                        setLogoUrl(e.target.value);
                                                        setPreviewUrl(e.target.value);
                                                    }}
                                                    placeholder="https://your-domain.com/logo.png"
                                                    className="w-full bg-slate-50 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
                                                />
                                                <p className="text-[10px] text-slate-400 italic">Supports PNG, SVG, or JPG. Recommended size 512x512px.</p>
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
                                                    className="w-full bg-slate-50 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-xl px-4 py-3 font-mono uppercase focus:ring-2 focus:ring-[#0EA5E9] outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-[#22262E]">
                                        <button
                                            onClick={() => brandingMutation.mutate({ logo: logoUrl, color: brandColor, name: orgName })}
                                            disabled={brandingMutation.isPending}
                                            className="bg-slate-900 dark:bg-[#0EA5E9] text-white px-8 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                                        >
                                            {brandingMutation.isPending ? 'Saving...' : 'Save Workspace Settings'}
                                        </button>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="mt-8 p-6 bg-[#181B22] border border-[#22262E] rounded-2xl text-white">
                                        <h4 className="font-bold text-lg mb-2 font-mono">Upgrade to Pro</h4>
                                        <p className="text-[#8A93A4] text-sm mb-4">
                                            Unlock custom branding, logos, and AI-powered scheduling for your entire organization.
                                        </p>
                                        <button className="bg-[#0EA5E9] text-white px-6 py-2 rounded-xl font-bold font-mono text-xs uppercase tracking-wider hover:bg-[#0284C7] transition-colors">
                                            See Pro Plans
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="bg-white dark:bg-[#121418] rounded-2xl p-8 border border-slate-200 dark:border-[#22262E] shadow-sm relative">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Team Collaboration</h2>
                                        <p className="text-slate-500 dark:text-[#8A93A4] text-sm">Members below have access to manage or view this workspace.</p>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/?inviteId=generic&orgId=${organization.id}`;
                                                navigator.clipboard.writeText(url);
                                                setCopiedId('generic');
                                                setTimeout(() => setCopiedId(null), 2000);
                                            }}
                                            className="p-2 text-slate-400 hover:text-[#0EA5E9] transition-colors relative group"
                                            title="Copy Generic Workspace Link"
                                        >
                                            {copiedId === 'generic' ? <Check size={18} className="text-emerald-500" /> : <LinkIcon size={18} />}
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                                                Copy Workspace Link
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setIsInviteOpen(true)}
                                            className="flex items-center gap-2 px-6 py-2 bg-[#0EA5E9] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#0284C7] transition-colors shadow-md"
                                        >
                                            <UserPlus size={16} /> Invite Teammate
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {members.map((member) => {
                                        const isMe = member.userId === currentUser?.id;

                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-start md:items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="text-slate-400" size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                                                {member.name}
                                                            </p>
                                                            {member.userId === organization.createdBy && (
                                                                <span className="bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20">Owner</span>
                                                            )}
                                                            {member.isPending && (
                                                                 <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[#F59E0B]/30 animate-pulse">Pending</span>
                                                             )}
                                                         </div>
                                                         <p className="text-xs text-slate-500 dark:text-[#8A93A4] font-medium font-mono">
                                                             {member.email} {isMe && <span className="text-[#0EA5E9] font-bold ml-1 tracking-tight text-[10px] uppercase">(You)</span>}
                                                         </p>
                                                         <p className="text-[10px] text-slate-400 dark:text-[#8A93A4] uppercase tracking-widest flex items-center gap-1 mt-1 font-mono font-bold">
                                                             {member.role === 'admin' ? <Shield size={10} className="text-[#EF4444]" /> : member.role === 'manager' ? <Users size={10} className="text-[#0EA5E9]" /> : <Mail size={10} className="text-slate-400" />}
                                                             {member.role === 'admin' ? 'Administrator' : member.role === 'manager' ? 'Manager' : 'Operator'}
                                                         </p>
                                                     </div>
                                                 </div>

                                                 <div className="flex items-center gap-2">
                                                     {member.isPending && (
                                                         <button
                                                             onClick={() => copyInviteLink(member.id)}
                                                             className="p-2 text-slate-400 hover:text-[#0EA5E9] transition-colors relative group"
                                                             title="Copy Personalized Invite Link"
                                                         >
                                                             {copiedId === member.id ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                                                             <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                                                                Copy Unique Link
                                                             </span>
                                                         </button>
                                                     )}

                                                     {(() => {
                                                         const canManageMember =
                                                             (currentUserRole === 'admin' && (!isMe || members.filter(m => m.role === 'admin' && !m.isPending).length > 1)) ||
                                                             (currentUserRole === 'manager' && member.role !== 'admin' && !isMe);

                                                         if (!canManageMember) return null;

                                                         return (
                                                             <>
                                                                 {!member.isPending && member.userId !== organization.createdBy && (
                                                                     <select
                                                                         value={member.role}
                                                                         onChange={(e) => roleMutation.mutate({ memberId: member.id, role: e.target.value })}
                                                                         className="bg-transparent text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#8A93A4] outline-none hover:text-[#0EA5E9] cursor-pointer"
                                                                     >
                                                                         {currentUserRole === 'admin' && <option value="admin">Admin</option>}
                                                                         <option value="manager">Manager</option>
                                                                         <option value="operator">Operator</option>
                                                                     </select>
                                                                 )}

                                                                 <button
                                                                     onClick={() => {
                                                                         if (member.isPending) {
                                                                             if (confirm(`Cancel invitation for ${member.email}?`)) {
                                                                                 cancelInviteMutation.mutate(member.id);
                                                                             }
                                                                         } else {
                                                                             if (confirm(`Remove ${member.name} from this organization?`)) {
                                                                                 removeMutation.mutate(member.id);
                                                                             }
                                                                         }
                                                                     }}
                                                                     className="p-2 text-slate-300 dark:text-[#6A7382] hover:text-[#EF4444] transition-colors"
                                                                     title={member.isPending ? "Cancel Invitation" : "Remove Member"}
                                                                 >
                                                                     <Trash2 size={16} />
                                                                 </button>
                                                             </>
                                                         );
                                                     })()}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                     {loadingMembers && <p className="text-center text-slate-400 py-8 animate-pulse font-mono text-xs">Updating team access...</p>}
                                     {members.length === 0 && !loadingMembers && (
                                         <div className="text-center py-12 bg-slate-50 dark:bg-[#181B22] rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#22262E]">
                                             <p className="text-slate-400 font-mono text-xs">No team members yet. Time to recruit!</p>
                                         </div>
                                     )}
                                 </div>

                                 {/* Invite Modal */}
                                 {isInviteOpen && (
                                     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
                                         <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                                             <div className="p-6 pb-2">
                                                 <div className="w-12 h-12 bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20 rounded-xl flex items-center justify-center mb-4">
                                                     <UserPlus size={24} />
                                                 </div>
                                                 <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Invite Teammate</h3>
                                                 <p className="text-slate-500 dark:text-[#8A93A4] mt-1 text-xs">Add someone to <strong className="text-slate-900 dark:text-white">{organization.name}</strong> by email.</p>
                                             </div>

                                             <div className="p-6 space-y-4">
                                                 <div>
                                                     <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                                                     <div className="relative">
                                                         <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                         <input
                                                             type="email"
                                                             value={inviteEmail}
                                                             onChange={(e) => setInviteEmail(e.target.value)}
                                                             autoFocus
                                                             placeholder="teammate@example.com"
                                                             className="w-full bg-slate-50 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0EA5E9] text-slate-900 dark:text-white text-xs font-mono"
                                                         />
                                                     </div>
                                                 </div>

                                                 <div>
                                                     <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Access Role</label>
                                                     <div className="grid grid-cols-3 gap-2 font-mono">
                                                         {(['operator', 'manager', 'admin'] as const)
                                                             .filter(r => currentUserRole === 'admin' || r !== 'admin')
                                                             .map((r) => (
                                                                 <button
                                                                     key={r}
                                                                     onClick={() => setInviteRole(r)}
                                                                     className={`px-2.5 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${inviteRole === r
                                                                         ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-sm'
                                                                         : 'bg-transparent border-slate-200 dark:border-[#22262E] text-slate-400 hover:border-[#0EA5E9]/50'
                                                                         }`}
                                                                 >
                                                                     {r}
                                                                 </button>
                                                             ))}
                                                     </div>
                                                 </div>

                                                 {inviteError && (
                                                     <div className="bg-rose-500/10 text-rose-500 p-3 rounded-lg text-xs font-bold border border-rose-500/20 flex items-center gap-2">
                                                         <AlertCircle size={14} />
                                                         {inviteError}
                                                     </div>
                                                 )}
                                             </div>

                                             <div className="p-6 pt-2 flex flex-col gap-2 font-mono">
                                                 <button
                                                     onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                                                     disabled={inviteMutation.isPending || !inviteEmail}
                                                     className="w-full py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                                                 >
                                                     {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                                                 </button>
                                                 <button
                                                     onClick={() => setIsInviteOpen(false)}
                                                     className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider"
                                                 >
                                                     Cancel
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                )}
                            </div>
                        )}
                        {(activeTab === 'danger' && currentUserRole === 'admin') && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <AlertTriangle size={120} className="text-rose-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Danger Zone</h2>
                                        <p className="text-slate-500 text-sm italic">Critical workspace management actions. **Use with extreme caution.**</p>
                                    </div>

                                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 mb-8">
                                        <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                                            <AlertTriangle size={18} /> Delete Workspace
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                            Permanently delete this organization, all its data, and member associations. This action is irreversible.
                                        </p>
                                        <button
                                            onClick={() => setIsDeleting(true)}
                                            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={18} /> Delete Organization
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-1">Transfer Ownership</h5>
                                            <p className="text-[10px] text-slate-500">Coming soon in Kairon Pro.</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-1">Export Data</h5>
                                            <p className="text-[10px] text-slate-500">Coming soon in Kairon Pro.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deletion Overlay */}
            {isDeleting && (
                <div
                    className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => {
                        if (!deleteOrgMutation.isPending) {
                            setIsDeleting(false);
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
                                You are about to delete <span className="font-black text-slate-900 dark:text-white">"{organization.name}"</span>. This cannot be undone.
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
                                        ? 'bg-[#0EA5E9]/10 border-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/10'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <ArrowRight size={24} className={deleteOption === 'migrate' ? 'text-[#0EA5E9]' : 'text-slate-400'} />
                                    <div>
                                        <div className={`font-bold ${deleteOption === 'migrate' ? 'text-[#0EA5E9]' : 'text-slate-600 dark:text-slate-300'}`}>Migrate</div>
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
                                        {allOrgs?.filter(o => o.id !== organization.id).map(o => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Type <span className="text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">{organization.slug}</span> to confirm
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
                                        if (deletionSlug === organization.slug && !deleteOrgMutation.isPending) {
                                            setIsHolding(true);
                                            const start = Date.now();
                                            const interval = setInterval(() => {
                                                const elapsed = Date.now() - start;
                                                const progress = Math.min(100, (elapsed / 3000) * 100);
                                                setHoldProgress(progress);
                                                if (progress >= 100) {
                                                    clearInterval(interval);
                                                    setIsHolding(false);
                                                    deleteOrgMutation.mutate();
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
                                    disabled={deletionSlug !== organization.slug || deleteOrgMutation.isPending || isOnlyOrg}
                                    className={`relative w-full py-5 rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all active:scale-95 disabled:opacity-30 disabled:grayscale ${deletionSlug === organization.slug && !isOnlyOrg ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-rose-950/30 transition-all ease-linear"
                                        style={{ width: `${holdProgress}%` }}
                                    />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {isOnlyOrg ? (
                                            <>CANNOT DELETE LAST WORKSPACE</>
                                        ) : deleteOrgMutation.isPending ? (
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
