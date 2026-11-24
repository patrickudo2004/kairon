import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProfile = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) return null;
        if (String(authUserId) !== String(args.userId)) return null;

        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
    },
});

export const upsertProfile = mutation({
    args: {
        userId: v.string(),
        fullName: v.string(),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId || authUserId !== args.userId) {
            throw new Error("Unauthorized: Cannot update another user's profile.");
        }

        const existing = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                fullName: args.fullName,
                avatarUrl: args.avatarUrl,
            });
        } else {
            await ctx.db.insert("profiles", {
                userId: args.userId,
                fullName: args.fullName,
                avatarUrl: args.avatarUrl,
            });
        }
    },
});

/**
 * UK GDPR Article 15 & Article 20 — Free Right of Access & Data Portability
 * Returns all personal & workspace data associated with the authenticated user.
 */
export const exportMyData = query({
    args: {},
    handler: async (ctx) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("Unauthorized: Please sign in to export your data.");
        }

        const user = await ctx.db.get(authUserId);
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", String(authUserId)))
            .unique();

        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user", (q) => q.eq("userId", String(authUserId)))
            .collect();

        const organizations = (
            await Promise.all(
                memberships.map(async (m) => {
                    const org = await ctx.db.get(m.organizationId);
                    return org
                        ? {
                              id: org._id,
                              name: org.name,
                              slug: org.slug,
                              role: m.role,
                              brandColor: org.brandColor,
                              createdByCurrentUser: String(org.createdBy) === String(authUserId),
                          }
                        : null;
                })
            )
        ).filter(Boolean);

        const ownedOrgIds = memberships
            .filter((m) => m.role === "admin")
            .map((m) => m.organizationId);

        const programs: any[] = [];
        const crewChatMessages: any[] = [];
        for (const orgId of ownedOrgIds) {
            const orgPrograms = await ctx.db
                .query("programs")
                .withIndex("by_org", (q) => q.eq("organizationId", orgId))
                .collect();
            programs.push(...orgPrograms);

            const orgChats = await ctx.db
                .query("crewChat")
                .withIndex("by_org", (q) => q.eq("organizationId", orgId))
                .collect();
            crewChatMessages.push(...orgChats);
        }

        const userEmail = user?.email?.toLowerCase();
        const pendingInvites = userEmail
            ? (
                  await ctx.db
                      .query("invites")
                      .withIndex("by_email", (q) => q.eq("email", userEmail))
                      .collect()
              ).map((inv) => ({
                  id: inv._id,
                  organizationId: inv.organizationId,
                  role: inv.role,
                  email: inv.email,
              }))
            : [];

        let linkedAuthAccounts: { provider: string }[] = [];
        try {
            const accounts = await ctx.db
                .query("authAccounts")
                .filter((q) => q.eq(q.field("userId"), authUserId))
                .collect();
            linkedAuthAccounts = accounts.map((acc: any) => ({
                provider: String(acc.provider || "unknown"),
            }));
        } catch {
            linkedAuthAccounts = [];
        }

        return {
            exportedAt: new Date().toISOString(),
            formatVersion: "1.1",
            account: user
                ? {
                      id: user._id,
                      email: user.email || null,
                      name: user.name || null,
                  }
                : null,
            profile: profile
                ? {
                      fullName: profile.fullName,
                      avatarUrl: profile.avatarUrl || null,
                  }
                : null,
            linkedAuthAccounts,
            organizations,
            pendingInvites,
            programs,
            crewChatMessages,
        };
    },
});

/**
 * UK GDPR Article 17 — Right to Erasure (Self-Service Account Deletion)
 * Validates shared-workspace admin continuity, then erases profile, memberships,
 * solo workspaces (+ logos, programs, cues, chats, invites), desktop auth sessions, and auth records.
 */
export const deleteMyAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const authUserId = await getAuthUserId(ctx);
        if (!authUserId) {
            throw new Error("Unauthorized: Please sign in to delete your account.");
        }

        const userIdStr = String(authUserId);
        const userDoc = await ctx.db.get(authUserId);
        const userEmail = userDoc?.email?.toLowerCase();

        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user", (q) => q.eq("userId", userIdStr))
            .collect();

        // Pre-flight Last-Admin Safety Guard: prevent permanently bricking multi-member workspaces
        for (const membership of memberships) {
            const org = await ctx.db.get(membership.organizationId);
            if (!org) continue;
            const orgMembers = await ctx.db
                .query("members")
                .withIndex("by_org", (q) => q.eq("organizationId", membership.organizationId))
                .collect();
            const otherMembers = orgMembers.filter((m) => String(m.userId) !== userIdStr);
            if (otherMembers.length > 0) {
                const otherAdmins = otherMembers.filter((m) => m.role === "admin");
                const isSoleAdminOrOwner =
                    (membership.role === "admin" || String(org.createdBy) === userIdStr) &&
                    otherAdmins.length === 0;
                if (isSoleAdminOrOwner) {
                    throw new Error(
                        `Cannot delete account while you are the sole Administrator of "${org.name}". Promote another team member to Admin or delete that workspace first.`
                    );
                }
            }
        }

        // 1. Delete user profile
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userIdStr))
            .unique();
        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // 2. Process memberships: transfer ownership if shared, or cascade-delete solo/0-member orgs
        for (const membership of memberships) {
            const org = await ctx.db.get(membership.organizationId);
            const orgMembers = await ctx.db
                .query("members")
                .withIndex("by_org", (q) => q.eq("organizationId", membership.organizationId))
                .collect();

            await ctx.db.delete(membership._id);

            const remainingMembers = orgMembers.filter((m) => String(m.userId) !== userIdStr);
            if (org && remainingMembers.length > 0) {
                // Transfer createdBy if deleting user originally created the org
                if (String(org.createdBy) === userIdStr) {
                    const successor = remainingMembers.find((m) => m.role === "admin") || remainingMembers[0];
                    if (successor) {
                        await ctx.db.patch(org._id, { createdBy: String(successor.userId) });
                    }
                }
                continue;
            }

            // If zero members remain, cascade-delete the organization & all child records + storage logo
            if (org && remainingMembers.length === 0) {
                if (
                    org.logoUrl &&
                    !org.logoUrl.startsWith("http") &&
                    !org.logoUrl.startsWith("/") &&
                    !org.logoUrl.startsWith(".")
                ) {
                    try {
                        await ctx.storage.delete(org.logoUrl as any);
                    } catch {
                        // Ignore already-removed storage object
                    }
                }

                const orgPrograms = await ctx.db
                    .query("programs")
                    .withIndex("by_org", (q) => q.eq("organizationId", org._id))
                    .collect();

                for (const prog of orgPrograms) {
                    const acks = await ctx.db
                        .query("acknowledgements")
                        .withIndex("by_slot", (q) => q.eq("programId", prog._id))
                        .collect();
                    for (const ack of acks) await ctx.db.delete(ack._id);

                    const candidateKeys = Array.from(
                        new Set([String(prog._id), prog.uuid, prog.slug].filter(Boolean) as string[])
                    );
                    for (const key of candidateKeys) {
                        const msgs = await ctx.db
                            .query("stageMessages")
                            .withIndex("by_program_latest", (q) => q.eq("programId", key))
                            .collect();
                        for (const msg of msgs) await ctx.db.delete(msg._id);
                    }

                    await ctx.db.delete(prog._id);
                }

                const orgChats = await ctx.db
                    .query("crewChat")
                    .withIndex("by_org", (q) => q.eq("organizationId", org._id))
                    .collect();
                for (const c of orgChats) await ctx.db.delete(c._id);

                const orgInvites = await ctx.db
                    .query("invites")
                    .withIndex("by_org", (q) => q.eq("organizationId", org._id))
                    .collect();
                for (const inv of orgInvites) await ctx.db.delete(inv._id);

                await ctx.db.delete(org._id);
            }
        }

        // 3. Delete pending invites & desktop auth relay tokens containing user's email
        if (userEmail) {
            const invites = await ctx.db
                .query("invites")
                .withIndex("by_email", (q) => q.eq("email", userEmail))
                .collect();
            for (const inv of invites) {
                await ctx.db.delete(inv._id);
            }

            const desktopSessions = await ctx.db.query("desktopAuthSessions").collect();
            for (const ds of desktopSessions) {
                if (ds.userEmail && ds.userEmail.toLowerCase() === userEmail) {
                    await ctx.db.delete(ds._id);
                }
            }
        }

        // 4. Clean up Convex Auth sessions, refresh tokens, verification codes, authAccounts, and user record
        try {
            const sessions = await ctx.db
                .query("authSessions")
                .filter((q) => q.eq(q.field("userId"), authUserId))
                .collect();
            for (const s of sessions) {
                const refreshTokens = await ctx.db
                    .query("authRefreshTokens")
                    .filter((q) => q.eq(q.field("sessionId"), s._id))
                    .collect();
                for (const rt of refreshTokens) await ctx.db.delete(rt._id);
                await ctx.db.delete(s._id);
            }

            const accounts = await ctx.db
                .query("authAccounts")
                .filter((q) => q.eq(q.field("userId"), authUserId))
                .collect();
            for (const acc of accounts) {
                const codes = await ctx.db
                    .query("authVerificationCodes")
                    .filter((q) => q.eq(q.field("accountId"), acc._id))
                    .collect();
                for (const code of codes) await ctx.db.delete(code._id);
                await ctx.db.delete(acc._id);
            }
        } catch (err) {
            console.warn("Non-fatal auth table cleanup note during account deletion:", err);
        }

        if (userDoc) {
            await ctx.db.delete(authUserId);
        }

        return { deleted: true };
    },
});
