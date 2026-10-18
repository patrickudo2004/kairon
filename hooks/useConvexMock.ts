import { useQuery as useQueryReal, useMutation as useMutationReal, useConvexAuth as useConvexAuthReal, useConvex as useConvexReal } from 'convex/react';
import { useState, useEffect } from 'react';

const isTestBypass = () => {
    try {
        if (typeof window !== 'undefined') {
            if (window.location.search.includes('testBypass=true')) {
                localStorage.setItem('testBypass', 'true');
                return true;
            }
            if (localStorage.getItem('kairon_booth_mode') === 'true') {
                return true;
            }
            return localStorage.getItem('testBypass') === 'true';
        }
        return false;
    } catch {
        return false;
    }
};

export const useConvexAuth = () => {
    const isTestMode = isTestBypass();
    const realVal = useConvexAuthReal();
    if (isTestMode) {
        return { isAuthenticated: true, isLoading: false };
    }
    return realVal;
};

export const useConvex = () => {
    const isTestMode = isTestBypass();
    const realVal = useConvexReal();
    if (isTestMode) {
        return {
            status: () => 'connected'
        };
    }
    return realVal;
};

export const useQuery = (query: any, args: any) => {
    const isTestMode = isTestBypass();
    
    // Call real hook conditionally with "skip" to satisfy React Rules of Hooks
    const realVal = useQueryReal(
        query,
        isTestMode ? "skip" : args
    );

    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!isTestMode) return;
        
        const handleUpdate = () => {
            setTick(t => t + 1);
        };
        window.addEventListener('storage', handleUpdate);
        window.addEventListener('program_update', handleUpdate);
        window.addEventListener('kairon_booth_mode_changed', handleUpdate);
        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('program_update', handleUpdate);
            window.removeEventListener('kairon_booth_mode_changed', handleUpdate);
        };
    }, [isTestMode]);

    if (!isTestMode) {
        return realVal;
    }

    let path = '';
    if (typeof query === 'string') {
        path = query;
    } else if (query && typeof query === 'object') {
        const sym = Symbol.for("functionName");
        const val = query[sym];
        if (typeof val === 'string') {
            path = val;
        } else if (typeof query._path === 'string') {
            path = query._path;
        } else if (typeof query.path === 'string') {
            path = query.path;
        }
    }
    if (path.includes('getCurrentUser')) {
        return { id: "test-user-id", email: "test@kairon.app", name: "Test User" };
    }
    if (path.includes('getMyMembershipInOrg')) {
        return { role: "admin" };
    }

    const getLocalPrograms = () => {
        try {
            const local = localStorage.getItem('test_programs') || localStorage.getItem('kairon_offline_programs');
            return local ? JSON.parse(local) : [];
        } catch {
            return [];
        }
    };

    if (path.includes('getPrograms')) {
        return getLocalPrograms();
    }
    if (path.includes('getActiveSessions')) {
        const list = getLocalPrograms();
        return list.filter((p: any) => p.status === 'live');
    }
    if (path.includes('getLiveProgram')) {
        const list = getLocalPrograms();
        const live = list.find((p: any) => p.status === 'live');
        return live || null;
    }
    if (path.includes('getProgramById')) {
        const list = getLocalPrograms();
        const idStr = args?.id || '';
        const cleanId = idStr.replace('local-', '');
        const found = list.find((p: any) => p.id === idStr || p.id?.replace('local-', '') === cleanId || p._id === idStr);
        return found || null;
    }
    if (path.includes('getProgramBySlug')) {
        const local = localStorage.getItem('test_programs');
        const list = local ? JSON.parse(local) : [];
        const slugStr = args?.slug || '';
        const found = list.find((p: any) => p.slug === slugStr || p.id === slugStr || p.id?.replace('local-', '') === slugStr.replace('local-', ''));
        return found || null;
    }
    if (path.includes('getOrganizationById') || path.includes('getMyOrganizations')) {
        const cachedBranding = localStorage.getItem('test_org_branding');
        const branding = cachedBranding ? JSON.parse(cachedBranding) : { logoUrl: "", brandColor: "#4f46e5", name: "Test Organization" };
        const org = {
            id: "test-org-id",
            name: branding.name || "Test Organization",
            slug: "test-org",
            logoUrl: branding.logoUrl,
            brandColor: branding.brandColor,
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        };
        return path.includes('getMyOrganizations') ? [org] : org;
    }
    if (path.includes('getAcknowledgements')) {
        const local = localStorage.getItem('test_acknowledgements');
        const list = local ? JSON.parse(local) : [];
        if (args?.programId) {
            const cleanArg = String(args.programId).replace('local-', '');
            return list.filter((a: any) => {
                const cleanA = String(a.programId).replace('local-', '');
                return cleanA === cleanArg;
            });
        }
        return list;
    }
    return null;
};

export const useMutation = (mutation: any) => {
    const isTestMode = isTestBypass();
    const realMutate = useMutationReal(mutation);
    if (!isTestMode) {
        return realMutate;
    }
    return async (args: any) => {
        console.log('Mock mutation called with args:', args);
        let path = '';
        if (typeof mutation === 'string') {
            path = mutation;
        } else if (mutation && typeof mutation === 'object') {
            const sym = Symbol.for("functionName");
            path = mutation[sym] || mutation._path || mutation.path || '';
        }
        
        if (path.includes('generateUploadUrl')) {
            return "/mock-upload-url";
        }
        if (path.includes('updateOrganizationBranding')) {
            const cached = localStorage.getItem('test_org_branding');
            const existing = cached ? JSON.parse(cached) : {};
            localStorage.setItem('test_org_branding', JSON.stringify({
                ...existing,
                logoUrl: args.logoUrl,
                brandColor: args.brandColor,
                ...(args.name ? { name: args.name } : {})
            }));
            window.dispatchEvent(new Event('storage'));
            return { success: true };
        }
        if (path.includes('acknowledgeCue')) {
            const local = localStorage.getItem('test_acknowledgements');
            const list = local ? JSON.parse(local) : [];
            const timestamp = Date.now();
            const existingIdx = list.findIndex((a: any) =>
                String(a.programId).replace('local-', '') === String(args.programId).replace('local-', '') &&
                a.slotId === args.slotId &&
                a.role === args.role
            );
            if (existingIdx >= 0) {
                list[existingIdx].timestamp = timestamp;
            } else {
                list.push({
                    _id: `ack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    programId: args.programId,
                    slotId: args.slotId,
                    role: args.role,
                    timestamp,
                });
            }
            localStorage.setItem('test_acknowledgements', JSON.stringify(list));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('program_update'));
            return { success: true };
        }
        return {};
    };
};
