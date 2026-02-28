import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getLatestMessage = query({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        if (!args.programId) return null;

        try {
            const now = Date.now();
            // Fetch all messages for this program and filter in memory for maximum safety
            // (Assuming few messages per program, which is true here)
            const allMessages = await ctx.db
                .query("stageMessages")
                .collect();

            const validMessages = allMessages
                .filter(m => m.programId === args.programId && m.expiresAt > now)
                .sort((a, b) => b.timestamp - a.timestamp);

            return validMessages[0] || null;
        } catch (err) {
            console.error("Critical error in getLatestMessage:", err);
            return null; // Don't crash the client
        }
    },
});

export const sendMessage = mutation({
    args: {
        programId: v.string(),
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
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("stageMessages")
            .withIndex("by_program_latest", (q) => q.eq("programId", args.programId))
            .collect();
        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});
