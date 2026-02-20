import { supabase } from './supabaseClient';

/**
 * Phase 3: Stripe Monetization Service
 * This handles subscription flows and checking Pro status.
 */

export const createCheckoutSession = async (orgId: string, priceId: string) => {
    // In a real production app, this would call a Supabase Edge Function or Backend
    // that interacts with the Stripe API to create a session.
    console.log(`Creating Stripe Checkout Session for Org: ${orgId}, Price: ${priceId}`);

    // Simulated redirect for prototype
    return {
        url: `https://checkout.stripe.com/pay/simulated_session_${orgId}`
    };
};

export const createPortalSession = async (orgId: string) => {
    console.log(`Creating Stripe Customer Portal Session for Org: ${orgId}`);

    // Simulated redirect
    return {
        url: `https://billing.stripe.com/p/simulated_portal_${orgId}`
    };
};

export const isProOrganization = async (orgId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('organizations')
        .select('subscription_status')
        .eq('id', orgId)
        .single();

    if (error || !data) return false;
    return data.subscription_status === 'pro' || data.subscription_status === 'enterprise';
};
