import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (!user) return null;

        return {
            id: userId,
            email: user.email,
            name: user.name,
            image: user.image,
        };
    },
});

export const debugEnvVars = query({
    args: {},
    handler: async () => {
        return {
            hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
            hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasSiteUrl: !!process.env.SITE_URL,
            hasConvexSiteUrl: !!process.env.CONVEX_SITE_URL,
            hasHostUrl: !!process.env.HOST_URL,
        };
    }
});

import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const debugSignIn = action({
    args: {},
    handler: async (ctx) => {
        try {
            return await ctx.runAction(api.auth.signIn, { provider: "google" } as any);
        } catch (e: any) {
            return { error: e.message, stack: e.stack, name: e.name };
        }
    }
});
