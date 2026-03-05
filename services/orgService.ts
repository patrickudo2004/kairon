import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Organization } from '../types';
import { getSession } from './authService';

export const getMyOrganizations = async (userId: string): Promise<Organization[]> => {
    if (!userId) return [];
    const data = await convex.query(api.orgs.getMyOrganizations, { userId });
    return (data || []).map(transformOrg);
};

export const getOrganizationById = async (id: string): Promise<Organization | null> => {
    const data = await convex.query(api.orgs.getOrganizationById, { id });
    if (!data) return null;
    return transformOrg(data);
};

export const createOrganization = async (name: string, slug: string, userId?: string): Promise<Organization> => {
    const session = userId || getSession()?.id;
    if (!session) throw new Error("User must be logged in to create an organization");

    const data = await convex.mutation(api.orgs.createOrganization, { name, slug, userId: session });
    return transformOrg(data);
};

export const updateOrganizationBranding = async (orgId: string, logoUrl: string, brandColor: string): Promise<void> => {
    await convex.mutation(api.orgs.updateOrganizationBranding, { id: orgId as any, logoUrl, brandColor });
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
