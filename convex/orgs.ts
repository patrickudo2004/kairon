import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermissions } from "./programs";

export const getMyOrganizations = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) return [];
        const userIdStr = String(authUserId);
        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user", (q) => q.eq("userId", userIdStr))
            .collect();

        const orgs = await Promise.all(
            memberships.map(async (m) => {
                const org = await ctx.db.get(m.organizationId);
                if (!org) return null;
                if (org.logoUrl && !org.logoUrl.startsWith("http")) {
                    try {
                        const url = await ctx.storage.getUrl(org.logoUrl);
                        if (url) {
                            return { ...org, logoUrl: url, role: m.role };
                        }
                    } catch (e) {
                        console.error("Failed to get storage URL for logo:", e);
                    }
                }
                return { ...org, role: m.role };
            })
        );
        return orgs.filter((o) => o !== null);
    },
});

export const getOrganizationById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        let orgId: Id<"organizations"> | null = null;
        try {
            orgId = ctx.db.normalizeId("organizations", args.id);
        } catch (e) {
            return null;
        }

        if (!orgId) return null;
        const org = await ctx.db.get(orgId);
        if (!org) return null;

        let resolvedLogoUrl = (org as any).logoUrl;
        if (resolvedLogoUrl && !resolvedLogoUrl.startsWith("http")) {
            try {
                const url = await ctx.storage.getUrl(resolvedLogoUrl);
                if (url) resolvedLogoUrl = url;
            } catch (e) {
                console.error("Failed to get storage URL for logo:", e);
            }
        }

        const authUserId = await getAuthUserId(ctx);
        let isAuthorizedMember = false;
        if (authUserId) {
            if (String(org.createdBy) === String(authUserId)) {
                isAuthorizedMember = true;
            } else {
                const membership = await ctx.db
                    .query("members")
                    .withIndex("by_org", (q) => q.eq("organizationId", org._id))
                    .filter((q) => q.eq(q.field("userId"), String(authUserId)))
                    .first();
                isAuthorizedMember = !!membership;
            }
        }

        if (isAuthorizedMember) {
            return { ...org, logoUrl: resolvedLogoUrl };
        }

        // Public branding view only: strip billing IDs & owner identifiers
        return {
            _id: org._id,
            _creationTime: org._creationTime,
            name: org.name,
            slug: org.slug,
            logoUrl: resolvedLogoUrl,
            brandColor: org.brandColor,
        };
    },
});

export const createOrganization = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("Unauthorized: Please sign in to create a workspace.");
        }
        const ownerIdStr = String(authUserId);
        const initialStatus = "pro";

        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            slug: args.slug,
            subscriptionStatus: initialStatus,
            createdBy: ownerIdStr,
        });

        await ctx.db.insert("members", {
            organizationId: orgId,
            userId: ownerIdStr,
            role: "admin",
        });

        const org = await ctx.db.get(orgId);
        return org;
    },
});

export const updateOrganizationBranding = mutation({
    args: {
        id: v.id("organizations"),
        name: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        brandColor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await checkPermissions(ctx, args.id, "manager");

        const patchData: any = {};
        if (args.name !== undefined) patchData.name = args.name;
        if (args.logoUrl !== undefined) patchData.logoUrl = args.logoUrl;
        if (args.brandColor !== undefined) patchData.brandColor = args.brandColor;
        await ctx.db.patch(args.id, patchData);
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

        // 2b. Delete all crew chat history for this workspace (UK GDPR hygiene)
        const chats = await ctx.db
            .query("crewChat")
            .withIndex("by_org", (q) => q.eq("organizationId", args.id))
            .collect();
        for (const chat of chats) {
            await ctx.db.delete(chat._id);
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
        await checkPermissions(ctx, args.organizationId, "operator");
        return await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();
    },
});
export const grantProStatusByEmail = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const callerId = await getAuthUserId(ctx);
        if (!callerId) throw new Error("Unauthorized: Must be logged in");

        const callerUser = await ctx.db.get(callerId);
        const superAdminEmails = (process.env.KAIRON_SUPER_ADMIN_EMAILS || "")
            .toLowerCase()
            .split(",")
            .map(e => e.trim())
            .filter(Boolean);

        const callerEmail = callerUser?.email?.toLowerCase();
        const isSuperAdmin = callerEmail && superAdminEmails.includes(callerEmail);

        if (!isSuperAdmin && process.env.NODE_ENV !== "test") {
            throw new Error("Unauthorized: Only platform super-administrators can grant Pro status globally.");
        }

        // 1. Find the user by email
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
            .first();

        if (!user) throw new Error("User not found");

        // 2. Upgrade the User Profile to 'pro'
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { subscriptionStatus: "pro" });
        }

        // 3. Find all organizations created by this user
        const orgs = await ctx.db
            .query("organizations")
            .filter((q) => q.eq(q.field("createdBy"), user._id))
            .collect();

        // 4. Upgrade them all to 'pro'
        for (const org of orgs) {
            await ctx.db.patch(org._id, { subscriptionStatus: "pro" });
        }

        return { count: orgs.length, profileUpgraded: !!profile };
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized: Must be logged in to upload assets");
        return await ctx.storage.generateUploadUrl();
    },
});
