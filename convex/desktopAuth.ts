import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateCleanCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KRN-${randomPart}`;
}

/**
 * Creates an ephemeral pending desktop auth session.
 * Desktop app subscribes to this session to receive tokens when approved in browser.
 */
export const createSession = mutation({
    args: {},
    handler: async (ctx) => {
        const code = generateCleanCode();
        const now = Date.now();
        const expiresAt = now + 10 * 60 * 1000; // 10 minutes

        const id = await ctx.db.insert("desktopAuthSessions", {
            code,
            status: "pending",
            createdAt: now,
            expiresAt,
        });

        return { code, id };
    },
});

/**
 * Subscribed to by the desktop app. Returns current status & credentials when approved.
 */
export const getSession = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        if (!args.code) return null;
        const session = await ctx.db
            .query("desktopAuthSessions")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (!session) return null;
        if (Date.now() > session.expiresAt && session.status === "pending") {
            return { ...session, status: "expired" as const };
        }
        return session;
    },
});

/**
 * Called by the authenticated user in their web browser (Chrome / Edge / Safari).
 * Sets the desktop session status to 'approved' and passes tokens.
 */
export const approveSession = mutation({
    args: {
        code: v.string(),
        jwtToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        userEmail: v.optional(v.string()),
        userName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("desktopAuthSessions")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (!session) {
            throw new Error("Invalid or unknown session code.");
        }

        if (Date.now() > session.expiresAt) {
            throw new Error("Session code has expired. Please restart login in Kairon Desktop.");
        }

        await ctx.db.patch(session._id, {
            status: "approved",
            jwtToken: args.jwtToken,
            refreshToken: args.refreshToken,
            userEmail: args.userEmail,
            userName: args.userName,
        });

        return { success: true };
    },
});
