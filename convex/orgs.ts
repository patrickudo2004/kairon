import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const getOrganizationById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        // Handle both raw ID strings and Convex IDs if needed
        let orgId;
        try {
            orgId = ctx.db.normalizeId("organizations", args.id);
        } catch (e) {
            return null;
        }

        if (!orgId) return null;
        return await ctx.db.get(orgId);
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

        const org = await ctx.db.get(orgId);
        return org;
    },
});

export const updateOrganizationBranding = mutation({
    args: {
        id: v.id("organizations"),
        logoUrl: v.optional(v.string()),
        brandColor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            logoUrl: args.logoUrl,
            brandColor: args.brandColor,
        });
    },
});

export const deleteOrganization = mutation({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const org = await ctx.db.get(args.id);
        if (!org) throw new Error("Organization not found");

        // SECURITY: Only the creator (owner) can delete the organization
        if (org.createdBy !== userId) {
            throw new Error("Only the organization owner can delete this workspace.");
        }

        // 1. Delete all members
        const members = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.id))
            .collect();
        for (const member of members) {
            await ctx.db.delete(member._id);
        }

        // 2. Delete all pending invites
        const invites = await ctx.db
            .query("invites")
            .withIndex("by_org", (q) => q.eq("organizationId", args.id))
            .collect();
        for (const invite of invites) {
            await ctx.db.delete(invite._id);
        }

        // 3. Delete the organization itself
        // Note: Programs are handled by a separate call if the user chooses to "Purge All"
        // If they chose to migrate, they should have done that before calling this.
        await ctx.db.delete(args.id);

        return { success: true };
    },
});

export const getOrgMembers = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();
    },
});
