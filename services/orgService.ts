import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Organization } from '../types';
import { getSession } from './authService';

const isTestBypass = () => {
    try {
        return typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
    } catch {
        return false;
    }
};

export const getMyOrganizations = async (userId: string): Promise<Organization[]> => {
    if (isTestBypass()) {
        const cached = localStorage.getItem('test_org_branding');
        const branding = cached ? JSON.parse(cached) : { logoUrl: "", brandColor: "#4f46e5" };
        return [{
            id: "test-org-id",
            name: "Test Organization",
            slug: "test-org",
            logoUrl: branding.logoUrl,
            brandColor: branding.brandColor,
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        }];
    }
    if (!userId) return [];
    const data = await convex.query(api.orgs.getMyOrganizations, { userId });
    return (data || []).map(transformOrg);
};

export const getOrganizationById = async (id: string): Promise<Organization | null> => {
    if (isTestBypass()) {
        const cached = localStorage.getItem('test_org_branding');
        const branding = cached ? JSON.parse(cached) : { logoUrl: "", brandColor: "#4f46e5" };
        return {
            id: "test-org-id",
            name: "Test Organization",
            slug: "test-org",
            logoUrl: branding.logoUrl,
            brandColor: branding.brandColor,
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        };
    }
    const data = await convex.query(api.orgs.getOrganizationById, { id });
    if (!data) return null;
    return transformOrg(data);
};

export const createOrganization = async (name: string, slug: string, userId?: string): Promise<Organization> => {
    if (isTestBypass()) {
        return {
            id: "test-org-id",
            name,
            slug,
            logoUrl: "",
            brandColor: "#4f46e5",
            subscriptionStatus: "pro",
            createdBy: "test-user-id",
            createdAt: new Date().toISOString()
        };
    }
    const session = userId || getSession()?.id;
    if (!session) throw new Error("User must be logged in to create an organization");

    const data = await convex.mutation(api.orgs.createOrganization, { name, slug, userId: session });
    return transformOrg(data);
};

export const updateOrganizationBranding = async (orgId: string, logoUrl: string, brandColor: string, name?: string): Promise<void> => {
    if (isTestBypass()) {
        const cached = localStorage.getItem('test_org_branding');
        const existing = cached ? JSON.parse(cached) : {};
        localStorage.setItem('test_org_branding', JSON.stringify({
            ...existing,
            logoUrl,
            brandColor,
            ...(name ? { name } : {})
        }));
        window.dispatchEvent(new Event('storage'));
        return;
    }
    await convex.mutation(api.orgs.updateOrganizationBranding, { id: orgId as any, logoUrl, brandColor, name });
};

export const generateUploadUrl = async (): Promise<string> => {
    if (isTestBypass()) {
        return "/mock-upload-url";
    }
    return await convex.mutation(api.orgs.generateUploadUrl, {});
};

export const getOrgMembers = async (orgId: string): Promise<any[]> => {
    const data = await convex.query(api.members.getOrgMembers, { organizationId: orgId as any });
    return data || [];
};

export const inviteMember = async (orgId: string, email: string, role: 'admin' | 'manager' | 'operator'): Promise<string> => {
    return await convex.mutation(api.members.addMemberByEmail, {
        organizationId: orgId as any,
        email,
        role: role as any
    });
};

export const removeMember = async (memberId: string): Promise<void> => {
    await convex.mutation(api.members.removeMember, { memberId: memberId as any });
};

export const updateMemberRole = async (memberId: string, role: string): Promise<void> => {
    await convex.mutation(api.members.updateMemberRole, { memberId: memberId as any, role: role as any });
};

export const checkPendingInvites = async (): Promise<string[] | null> => {
    return await convex.mutation(api.members.checkPendingInvites, {});
};

export const cancelInvite = async (inviteId: string): Promise<void> => {
    await convex.mutation(api.members.cancelInvite, { inviteId: inviteId as any });
};

export const getInviteDetails = async (inviteId: string): Promise<any> => {
    return await convex.query(api.members.getInviteDetails, { inviteId: inviteId as any });
};

export const deleteOrganization = async (id: string) => {
    return await convex.mutation(api.orgs.deleteOrganization, { id: id as any });
};

const transformOrg = (o: any): Organization => ({
    id: o._id,
    name: o.name,
    slug: o.slug,
    logoUrl: o.logoUrl,
    brandColor: o.brandColor,
    subscriptionStatus: o.subscriptionStatus,
    stripeCustomerId: o.stripeCustomerId,
    createdBy: o.createdBy,
    createdAt: new Date(o._creationTime).toISOString()
});
