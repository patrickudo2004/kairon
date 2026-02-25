import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getProfile = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
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
