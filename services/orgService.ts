import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Organization } from '../types';

export const getMyOrganizations = async (userId: string): Promise<Organization[]> => {
    if (!userId) return [];
    const data = await convex.query(api.orgs.getMyOrganizations, { userId });
    return (data || []).map(transformOrg);
};

export const createOrganization = async (name: string, slug: string, userId: string): Promise<string> => {
    return await convex.mutation(api.orgs.createOrganization, { name, slug, userId });
};

export const updateOrganizationBranding = async (orgId: string, logoUrl: string, brandColor: string): Promise<void> => {
    await convex.mutation(api.orgs.updateOrganizationBranding, { id: orgId as any, logoUrl, brandColor });
};

export const getOrgMembers = async (orgId: string): Promise<any[]> => {
    const data = await convex.query(api.orgs.getOrgMembers, { organizationId: orgId as any });
    return data || [];
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
