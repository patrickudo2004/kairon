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
    ArrowLeft,
    Trash2,
    AlertCircle,
    Link as LinkIcon,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPanelProps {
    organization: Organization;
    currentUserRole?: string;
    currentUser?: { id: string, email?: string } | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ organization, currentUserRole, currentUser }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'branding' | 'members'>('branding');

    // Branding State
    const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');
    const [brandColor, setBrandColor] = useState(organization.brandColor || '#4f46e5');

    // Invite Modal State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'operator'>('operator');
    const [inviteError, setInviteError] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        mutationFn: ({ logo, color }: { logo: string, color: string }) =>
            updateOrganizationBranding(organization.id, logo, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            alert('Branding updated successfully!');
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
            // data is the ID of the new member or invite
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
                                <Settings className="text-indigo-600" size={24} />
                                {organization.name}
                            </h1>
                            <p className="text-slate-500 text-sm">Managing collaboration and branding.</p>
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
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Team Collaboration</h2>
                                        <p className="text-slate-500 text-sm">Members below have access to manage or view this workspace.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/?inviteId=generic&orgId=${organization.id}`;
                                                navigator.clipboard.writeText(url);
                                                setCopiedId('generic');
                                                setTimeout(() => setCopiedId(null), 2000);
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative group"
                                            title="Copy Generic Workspace Link"
                                        >
                                            {copiedId === 'generic' ? <Check size={18} className="text-emerald-500" /> : <LinkIcon size={18} />}
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                                                Copy Workspace Link
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setIsInviteOpen(true)}
                                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                                        >
                                            <UserPlus size={18} /> Invite Teammate
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {members.map((member) => (
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
                                                            <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">Pending</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1 font-bold">
                                                        {member.role === 'admin' ? <Shield size={10} className="text-rose-500" /> : member.role === 'manager' ? <Users size={10} className="text-indigo-500" /> : <Mail size={10} className="text-slate-400" />}
                                                        {member.role === 'admin' ? 'Administrator' : member.role === 'manager' ? 'Manager' : 'Operator'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {member.isPending && (
                                                    <button
                                                        onClick={() => copyInviteLink(member.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors relative group"
                                                        title="Copy Personalized Invite Link"
                                                    >
                                                        {copiedId === member.id ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            Copy Unique Link
                                                        </span>
                                                    </button>
                                                )}

                                                {(() => {
                                                    const isMe = member.userId === currentUser?.id;
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
                                                                    className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-400 outline-none hover:text-indigo-500 cursor-pointer"
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
                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                                title={member.isPending ? "Cancel Invitation" : "Remove Member"}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                    {loadingMembers && <p className="text-center text-slate-400 py-8 animate-pulse font-medium">Updating team access...</p>}
                                    {members.length === 0 && !loadingMembers && (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                            <p className="text-slate-400 font-medium">No team members yet. Time to recruit!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Invite Modal */}
                                {isInviteOpen && (
                                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                                            <div className="p-8 pb-4">
                                                <div className="w-16 h-16 bg-indigo-600/10 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
                                                    <UserPlus size={32} />
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Invite Teammate</h3>
                                                <p className="text-slate-500 mt-2 font-medium">Add someone to **{organization.name}** by their email address.</p>
                                            </div>

                                            <div className="p-8 space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                        <input
                                                            type="email"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            autoFocus
                                                            placeholder="teammate@example.com"
                                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Access Role</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {(['operator', 'manager', 'admin'] as const)
                                                            .filter(r => currentUserRole === 'admin' || r !== 'admin')
                                                            .map((r) => (
                                                                <button
                                                                    key={r}
                                                                    onClick={() => setInviteRole(r)}
                                                                    className={`px-3 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${inviteRole === r
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-600/30'
                                                                        }`}
                                                                >
                                                                    {r}
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>

                                                {inviteError && (
                                                    <div className="bg-rose-500/10 text-rose-500 p-4 rounded-xl text-xs font-bold border border-rose-500/20 flex items-center gap-3">
                                                        <AlertCircle size={16} />
                                                        {inviteError}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-8 pt-2 flex flex-col gap-3">
                                                <button
                                                    disabled={!inviteEmail || inviteMutation.isPending}
                                                    onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                                                >
                                                    {inviteMutation.isPending ? 'Connecting...' : 'Add Teammate'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsInviteOpen(false);
                                                        setInviteError('');
                                                    }}
                                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
