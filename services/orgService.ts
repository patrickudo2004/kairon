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
