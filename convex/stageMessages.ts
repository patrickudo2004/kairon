import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getLatestMessage = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db
            .query("stageMessages")
            .withIndex("by_program", (q) => q.eq("programId", args.programId))
            .filter((q) => q.gt(q.field("expiresAt"), now))
            .order("desc")
            .first();
    },
});

export const sendMessage = mutation({
    args: {
        programId: v.id("programs"),
        text: v.string(),
        type: v.string(),
        durationMs: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const duration = args.durationMs ?? 10000; // Default 10s
        return await ctx.db.insert("stageMessages", {
            programId: args.programId,
            text: args.text,
            type: args.type,
            timestamp: now,
            expiresAt: now + duration,
        });
    },
});

export const clearMessages = mutation({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("stageMessages")
            .withIndex("by_program", (q) => q.eq("programId", args.programId))
            .collect();
        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});
