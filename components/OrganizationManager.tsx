import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyOrganizations, createOrganization } from '../services/orgService';
import { Plus, Settings, Users, Building, ChevronRight, Loader } from 'lucide-react';

interface OrganizationManagerProps {
    onSelect: (orgId: string) => void;
    activeOrgId?: string;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({ onSelect, activeOrgId }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const queryClient = useQueryClient();

    const { data: organizations, isLoading } = useQuery({
        queryKey: ['my-organizations'],
        queryFn: getMyOrganizations
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => {
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            return createOrganization(name, slug);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
            setIsCreating(false);
            setNewOrgName('');
        }
    });

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
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                                {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Building className="text-slate-400" size={24} />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {org.name}
                                    {activeOrgId === org.id && (
                                        <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                                    )}
                                </h4>
                                <p className="text-xs text-slate-500">/{org.slug}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <Users size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <Settings size={18} />
                            </button>
                            <ChevronRight className="text-slate-300 ml-2" />
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
        </div>
    );
};
