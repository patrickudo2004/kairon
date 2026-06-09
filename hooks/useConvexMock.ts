import { useQuery as useQueryReal, useMutation as useMutationReal, useConvexAuth as useConvexAuthReal, useConvex as useConvexReal } from 'convex/react';
import { useState, useEffect } from 'react';

const isTestBypass = () => {
    try {
        if (typeof window !== 'undefined') {
            if (window.location.search.includes('testBypass=true')) {
                localStorage.setItem('testBypass', 'true');
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
        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('program_update', handleUpdate);
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
    if (path.includes('getPrograms')) {
        const local = localStorage.getItem('test_programs');
        return local ? JSON.parse(local) : [];
    }
    if (path.includes('getActiveSessions')) {
        const local = localStorage.getItem('test_programs');
        const list = local ? JSON.parse(local) : [];
        return list.filter((p: any) => p.status === 'live');
    }
    if (path.includes('getLiveProgram')) {
        const local = localStorage.getItem('test_programs');
        const list = local ? JSON.parse(local) : [];
        const live = list.find((p: any) => p.status === 'live');
        return live || null;
    }
    if (path.includes('getProgramById')) {
        const local = localStorage.getItem('test_programs');
        const list = local ? JSON.parse(local) : [];
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
    if (path.includes('getOrganizationById')) {
        return {
            id: "test-org-id",
            name: "Test Organization",
            slug: "test-org",
            logoUrl: "",
            brandColor: "#4f46e5",
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        };
    }
    if (path.includes('getMyOrganizations')) {
        return [{
            id: "test-org-id",
            name: "Test Organization",
            slug: "test-org",
            logoUrl: "",
            brandColor: "#4f46e5",
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        }];
    }
    if (path.includes('getAcknowledgements')) {
        return [];
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
        return {};
    };
};
