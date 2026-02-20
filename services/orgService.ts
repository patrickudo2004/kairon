import { supabase } from './supabaseClient';
import { Organization, OrganizationMember, UserRole } from '../types';

export const getMyOrganizations = async (): Promise<Organization[]> => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*');

    if (error) throw error;
    return data.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logo_url,
        themeColors: org.theme_colors,
        createdBy: org.created_by
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
        themeColors: orgData.theme_colors,
        createdBy: orgData.created_by
    };
};

export const updateOrganizationBranding = async (orgId: string, logoUrl: string, colors: { primary: string, secondary: string }) => {
    const { error } = await supabase
        .from('organizations')
        .update({
            logo_url: logoUrl,
            theme_colors: colors
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
