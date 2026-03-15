import React from 'react';
import { Building, ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { Organization } from '../types';
import { useNavigate } from 'react-router-dom';

interface WorkspaceSwitcherProps {
    organizations: Organization[];
    activeOrg: Organization | null;
    onSelect: (orgId: string) => void;
    onCreateNew: () => void;
    isCollapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
    organizations,
    activeOrg,
    onSelect,
    onCreateNew,
    isCollapsed = false
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
                className={`flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-sm
                    ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'px-3 py-1.5 w-full'}
                `}
                title={isCollapsed ? (activeOrg?.name || 'Select Workspace') : ''}
            >
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Building size={16} />
                </div>
                {!isCollapsed && (
                    <>
                        <span className="truncate flex-1 text-left">
                            {activeOrg?.name || 'Select Workspace'}
                        </span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                            Your Workspaces
                        </p>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {organizations?.map((org) => (
                            <div
                                key={org.id}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div
                                    onClick={() => {
                                        onSelect(org.id);
                                        setIsOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-4 p-1 cursor-pointer"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/10"
                                        style={{ backgroundColor: org.brandColor || '#e11d48' }}
                                    >
                                        {org.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                            {org.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                            {org.subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Workspace'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(org.id);
                                            navigate('/admin');
                                            setIsOpen(false);
                                        }}
                                        className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        title="Workspace Settings"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    {org.id === activeOrg?.id && (
                                        <Check size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                    )}
                                </div>
                            </div>
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
