import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { resolveProgram, checkPermissions } from "./programs";

export const getLatestMessage = query({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        if (!args.programId) return null;

        try {
            const program = await resolveProgram(ctx, args.programId);
            if (program && program.isPublic === false) {
                const userId = await getAuthUserId(ctx);
                if (!userId) return null;
                const membership = await ctx.db
                    .query("members")
                    .withIndex("by_org", (q) => q.eq("organizationId", program.organizationId))
                    .filter((q) => q.eq(q.field("userId"), String(userId)))
                    .first();
                const org = await ctx.db.get(program.organizationId as any);
                const isOwner = Boolean(org && String((org as any).createdBy) === String(userId));
                if (!membership && !isOwner) return null;
            }

            const now = Date.now();
            const message = await ctx.db
                .query("stageMessages")
                .withIndex("by_program_latest", (q) => q.eq("programId", args.programId))
                .order("desc")
                .filter((q) => q.gt(q.field("expiresAt"), now))
                .first();

            return message;
        } catch {
            return null;
        }
    },
});

export const sendMessage = mutation({
    args: {
        programId: v.string(),
        text: v.string(),
        type: v.string(),
        isStrobe: v.optional(v.boolean()),
        durationMs: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.programId);
        if (!program) throw new Error("Program not found");
        await checkPermissions(ctx, program.organizationId, "operator");

        const now = Date.now();
        const duration = args.durationMs ?? (24 * 60 * 60 * 1000); // Persist until operator explicitly clears
        return await ctx.db.insert("stageMessages", {
            programId: args.programId,
            text: args.text,
            type: args.type,
            isStrobe: args.isStrobe,
            timestamp: now,
            expiresAt: now + duration,
        });
    },
});

export const clearMessages = mutation({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.programId);
        if (!program) throw new Error("Program not found");
        await checkPermissions(ctx, program.organizationId, "operator");

        const messages = await ctx.db
            .query("stageMessages")
            .withIndex("by_program_latest", (q) => q.eq("programId", args.programId))
            .collect();
        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});
