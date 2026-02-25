import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMyOrganizations = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userId) return [];
        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .collect();

        const orgs = await Promise.all(
            memberships.map((m) => ctx.db.get(m.organizationId))
        );
        return orgs.filter((o) => o !== null);
    },
});

export const createOrganization = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            slug: args.slug,
            subscriptionStatus: "free",
            createdBy: args.userId,
        });

        await ctx.db.insert("members", {
            organizationId: orgId,
            userId: args.userId,
            role: "admin",
        });

        return orgId;
    },
});
