import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getOrgMembers = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const [members, pendingInvites] = await Promise.all([
            ctx.db
                .query("members")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .collect(),
            ctx.db
                .query("invites")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .collect()
        ]);

        const memberList = await Promise.all(
            members.map(async (m) => {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("by_userId", (q) => q.eq("userId", m.userId))
                    .unique();

                // Fetch user info for email/avatar from the private 'users' table
                // Safeguard: Check if it's a valid Convex ID to avoid crashes on legacy string IDs
                let user = null;
                const userId = ctx.db.normalizeId("users", m.userId);
                if (userId) {
                    user = await ctx.db.get(userId);
                }

                return {
                    id: m._id,
                    userId: m.userId,
                    role: m.role,
                    name: profile?.fullName || (user as any)?.name || "Kairon User",
                    email: (user as any)?.email || "No Email Provided",
                    avatarUrl: profile?.avatarUrl || (user as any)?.image,
                    isPending: false
                };
            })
        );

        const inviteList = pendingInvites.map(i => ({
            id: i._id,
            email: i.email,
            role: i.role,
            name: "Pending Invite",
            isPending: true
        }));

        return [...memberList, ...inviteList];
    },
});

export const addMemberByEmail = mutation({
    args: {
        organizationId: v.id("organizations"),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        console.log("Inviting teammate:", args.email, "to org:", args.organizationId);

        // 1. Check if requester is an admin of this specific org
        const requester = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        console.log("Requester role:", requester?.role);

        if (requester?.role !== "admin") {
            throw new Error("Only admins can invite members. You are: " + (requester?.role || "not a member"));
        }

        // 2. Find user by email in the 'users' table
        // Try exact match first (fast)
        let user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        // If not found, try case-insensitive scan (slower but resilient)
        if (!user) {
            const allUsers = await ctx.db.query("users").collect();
            user = allUsers.find(u => u.email?.toLowerCase() === args.email.toLowerCase()) || null;
        }

        if (!user) {
            console.warn("User not found for email:", args.email, "- Creating shadow invite");

            // Check if already invited
            const existingInvite = await ctx.db
                .query("invites")
                .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
                .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
                .first();

            if (existingInvite) {
                throw new Error("An invitation is already pending for this email.");
            }

            return await ctx.db.insert("invites", {
                email: args.email.toLowerCase(),
                organizationId: args.organizationId,
                role: args.role,
                invitedBy: userId,
            });
        }

        console.log("Found user to invite:", user._id);

        // 3. Check if already a member
        const existing = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("userId"), user._id))
            .first();

        if (existing) {
            throw new Error("This user is already a member of your organization.");
        }

        // 4. Add member
        console.log("Inserting new member record...");
        return await ctx.db.insert("members", {
            organizationId: args.organizationId,
            userId: user._id,
            role: args.role,
        });
    },
});

export const checkPendingInvites = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (!user?.email) return null;

        const email = user.email.toLowerCase();
        const pendingInvites = await ctx.db
            .query("invites")
            .withIndex("by_email", (q) => q.eq("email", email))
            .collect();

        if (pendingInvites.length === 0) return null;

        const results = [];
        for (const invite of pendingInvites) {
            // Check if somehow already a member
            const existing = await ctx.db
                .query("members")
                .withIndex("by_org", (q) => q.eq("organizationId", invite.organizationId))
                .filter((q) => q.eq(q.field("userId"), userId))
                .first();

            if (!existing) {
                await ctx.db.insert("members", {
                    organizationId: invite.organizationId,
                    userId,
                    role: invite.role,
                });

                const org = await ctx.db.get(invite.organizationId);
                results.push(org?.name || "Unknown Organization");
            }

            // Clean up invite
            await ctx.db.delete(invite._id);
        }

        return results;
    },
});

export const cancelInvite = mutation({
    args: { inviteId: v.id("invites") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invitation not found");

        const requester = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", invite.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        if (requester?.role !== "admin") {
            throw new Error("Only admins can cancel invitations.");
        }

        await ctx.db.delete(args.inviteId);
    },
});

export const removeMember = mutation({
    args: { memberId: v.id("members") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const memberToRemove = await ctx.db.get(args.memberId);
        if (!memberToRemove) throw new Error("Member record not found");

        // Allowed if:
        // 1. You are an admin of the organization
        // 2. You are removing yourself (leaving)
        const requester = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", memberToRemove.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .unique();

        const isSelf = memberToRemove.userId === userId;
        const isAdmin = requester?.role === "admin";

        if (!isAdmin && !isSelf) {
            throw new Error("You don't have permission to remove this member.");
        }

        // Prevent removing the last admin? (Optional but recommended)
        if (isAdmin && !isSelf) {
            // Check if there are other admins
            const otherAdmins = await ctx.db
                .query("members")
                .withIndex("by_org", (q) => q.eq("organizationId", memberToRemove.organizationId))
                .filter((q) => q.and(q.eq(q.field("role"), "admin"), q.neq(q.field("_id"), args.memberId)))
                .collect();

            if (otherAdmins.length === 0) {
                // We're trying to remove the last admin? Wait, requester IS an admin too.
                // If requester is not the one being removed, then there IS at least one admin left (requester).
            }
        }

        await ctx.db.delete(args.memberId);
    },
});

export const updateMemberRole = mutation({
    args: {
        memberId: v.id("members"),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator"))
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const targetMember = await ctx.db.get(args.memberId);
        if (!targetMember) throw new Error("Member not found");

        const requester = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", targetMember.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .unique();

        if (requester?.role !== "admin") {
            throw new Error("Only admins can change roles.");
        }

        await ctx.db.patch(args.memberId, { role: args.role });
    },
});

export const getMyMembershipInOrg = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .unique();
    },
});
