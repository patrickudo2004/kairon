import React from 'react';
import { Building, ChevronDown, Check, Plus } from 'lucide-react';
import { Organization } from '../types';

interface WorkspaceSwitcherProps {
    organizations: Organization[];
    activeOrg: Organization | null;
    onSelect: (orgId: string) => void;
    onCreateNew: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
    organizations,
    activeOrg,
    onSelect,
    onCreateNew
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-sm"
            >
                <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Building size={14} />
                </div>
                <span className="truncate max-w-[120px]">
                    {activeOrg?.name || 'Select Workspace'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                            Your Workspaces
                        </p>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => {
                                    onSelect(org.id);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-xs"
                                        style={{ backgroundColor: org.brandColor || '#e11d48' }}
                                    >
                                        {org.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                            {org.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 line-clamp-1">
                                            {org.subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Workspace'}
                                        </p>
                                    </div>
                                </div>
                                {org.id === activeOrg?.id && (
                                    <Check size={16} className="text-rose-600 dark:text-rose-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <button
                            onClick={() => {
                                onCreateNew();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-md border-2 border-dashed border-indigo-200 dark:border-indigo-900 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <span className="text-sm font-semibold">New Workspace</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
