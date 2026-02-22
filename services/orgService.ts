import { supabase } from './supabaseClient';
import { Organization, OrganizationMember, UserRole } from '../types';

export const getMyOrganizations = async (): Promise<Organization[]> => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*');

    if (error) {
        console.error("Supabase Error [getMyOrganizations]:", error.message, error.details, error.hint);
        throw error;
    }
    return data.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logo_url,
        brandColor: org.brand_color,
        subscriptionStatus: org.subscription_status,
        stripeCustomerId: org.stripe_customer_id,
        createdBy: org.created_by,
        createdAt: org.created_at
    }));
};

export const createOrganization = async (name: string, slug: string): Promise<Organization> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");

    // 1. Create Org
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name,
            slug,
            created_by: user.id
        })
        .select()
        .single();

    if (orgError) throw orgError;

    // 2. Add creator as Admin
    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            organization_id: orgData.id,
            user_id: user.id,
            role: 'admin'
        });

    if (memberError) throw memberError;

    return {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        logoUrl: orgData.logo_url,
        brandColor: orgData.brand_color,
        subscriptionStatus: orgData.subscription_status,
        stripeCustomerId: orgData.stripe_customer_id,
        createdBy: orgData.created_by,
        createdAt: orgData.created_at
    };
};

export const updateOrganizationBranding = async (orgId: string, logoUrl: string, brandColor: string) => {
    const { error } = await supabase
        .from('organizations')
        .update({
            logo_url: logoUrl,
            brand_color: brandColor
        })
        .eq('id', orgId);

    if (error) throw error;
};

export const getOrgMembers = async (orgId: string): Promise<OrganizationMember[]> => {
    const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId);

    if (error) throw error;
    return data.map(m => ({
        id: m.id,
        organizationId: m.organization_id,
        userId: m.user_id,
        role: m.role as UserRole
    }));
};
