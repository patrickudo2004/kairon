import React, { useState } from 'react';
import { Building, ChevronDown, Check, Plus, Settings, Folder, FolderOpen, Cloud, HardDrive, Laptop } from 'lucide-react';
import { Organization } from '../types';
import { useNavigate } from 'react-router-dom';
import { chooseLocalFolder, getActiveLocalFolder, toLocalFolderOrg, LocalFolderWorkspace } from '../services/localFolderService';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isChoosingFolder, setIsChoosingFolder] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const activeLocalFolder = getActiveLocalFolder();
    const localFolderOrg: LocalFolderWorkspace | null = activeLocalFolder
        ? toLocalFolderOrg(activeLocalFolder.folderPath, activeLocalFolder.folderName)
        : null;

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePickFolder = async () => {
        try {
            setIsChoosingFolder(true);
            const res = await chooseLocalFolder();
            if (res.success && res.org) {
                onSelect(res.org.id);
                setIsOpen(false);
            }
        } catch (err) {
            console.error('Failed to choose folder:', err);
        } finally {
            setIsChoosingFolder(false);
        }
    };

    const isCurrentLocal = Boolean(activeOrg?.isLocalFolder || activeOrg?.id?.startsWith('local-folder-'));
    const cloudOrgs = organizations.filter(o => !o.isLocalFolder && !o.id.startsWith('local-'));

    return (
        <div className="relative font-sans" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#181B22] transition-colors text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#22262E] font-medium text-sm
                    ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'px-3 py-1.5 w-full'}
                `}
                title={isCollapsed ? (activeOrg?.name || 'Select Workspace') : ''}
            >
                <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                    isCurrentLocal 
                        ? 'bg-[#0EA5E9]/15 text-[#0EA5E9]' 
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                }`}>
                    {isCurrentLocal ? <Folder size={15} /> : <Building size={15} />}
                </div>
                {!isCollapsed && (
                    <>
                        <div className="truncate flex-1 text-left">
                            <p className="truncate text-xs font-bold leading-tight text-slate-800 dark:text-white">
                                {activeOrg?.name || 'Select Workspace'}
                            </p>
                            <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#8A93A4]">
                                {isCurrentLocal ? 'Local Folder' : 'Cloud Workspace'}
                            </p>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#0E1015] border border-slate-200 dark:border-[#22262E] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Header */}
                    <div className="p-2.5 border-b border-slate-100 dark:border-[#1E232B] bg-slate-50/50 dark:bg-[#12151B]">
                        <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-[#8A93A4] uppercase tracking-wider">
                            Workspace Matrix
                        </p>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto p-1.5 space-y-2 custom-scrollbar">
                        
                        {/* Section 1: Cloud Workspaces (Convex) */}
                        <div>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                <Cloud size={11} />
                                <span>Cloud Workspaces (Convex)</span>
                            </div>

                            {cloudOrgs.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-slate-400 italic">
                                    No cloud organizations yet.
                                </div>
                            ) : (
                                cloudOrgs.map((org) => {
                                    const isSelected = org.id === activeOrg?.id;
                                    return (
                                        <div
                                            key={org.id}
                                            className={`w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#181B22] transition-colors group cursor-pointer ${
                                                isSelected ? 'bg-slate-100 dark:bg-[#1C2028]' : ''
                                            }`}
                                            onClick={() => {
                                                onSelect(org.id);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                                                    style={{ backgroundColor: org.brandColor || '#10B981' }}
                                                >
                                                    {org.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="text-left min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                                        {org.name}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">
                                                        Online Sync • QR Live
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(org.id);
                                                        navigate('/admin');
                                                        setIsOpen(false);
                                                    }}
                                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#282D37] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                                                    title="Workspace Settings"
                                                >
                                                    <Settings size={13} />
                                                </button>
                                                {isSelected && (
                                                    <Check size={14} className="text-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Section 2: Local Workspaces (This PC) */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-[#1E232B]">
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[#0EA5E9]">
                                <Laptop size={11} />
                                <span>Local Workspace (This PC)</span>
                            </div>

                            {localFolderOrg ? (
                                <div
                                    className={`w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#181B22] transition-colors group cursor-pointer ${
                                        isCurrentLocal ? 'bg-slate-100 dark:bg-[#1C2028]' : ''
                                    }`}
                                    onClick={() => {
                                        onSelect(localFolderOrg.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-md bg-[#0EA5E9]/15 text-[#0EA5E9] flex items-center justify-center font-bold shrink-0">
                                            <FolderOpen size={14} />
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                                {localFolderOrg.name}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-mono truncate" title={localFolderOrg.folderPath}>
                                                {localFolderOrg.folderPath}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {isCurrentLocal && (
                                            <Check size={14} className="text-[#0EA5E9] shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Choose Folder Action */}
                            <button
                                type="button"
                                onClick={handlePickFolder}
                                disabled={isChoosingFolder}
                                className="w-full mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#181B22] text-[#0EA5E9] font-mono text-xs font-semibold transition-all border border-dashed border-[#0EA5E9]/30 hover:border-[#0EA5E9]"
                            >
                                <Folder size={14} />
                                <span>{isChoosingFolder ? 'Opening Picker...' : (localFolderOrg ? 'Choose Different Folder...' : 'Choose Folder on This PC...')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer: Create Cloud Workspace */}
                    <div className="p-1.5 border-t border-slate-100 dark:border-[#1E232B] bg-slate-50 dark:bg-[#12151B]">
                        <button
                            onClick={() => {
                                onCreateNew();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold transition-colors"
                        >
                            <Plus size={14} />
                            <span>Create Cloud Workspace</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
