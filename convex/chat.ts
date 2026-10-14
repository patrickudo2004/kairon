import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { resolveProgram } from "./programs";

export const getMessages = query({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        if (!args.programId) return [];

        const messages = await ctx.db
            .query("crewChat")
            .withIndex("by_program", (q) => q.eq("programId", args.programId))
            .order("asc")
            .take(100);

        return messages;
    },
});

export const sendMessage = mutation({
    args: {
        programId: v.string(),
        senderName: v.string(),
        senderRole: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const trimmed = args.message.trim();
        if (!trimmed) throw new Error("Message cannot be empty");

        const program = await resolveProgram(ctx, args.programId);
        if (!program) throw new Error("Program not found");

        // Verify that sender is an authenticated member of this organization
        // (Strict air-gapping: public portal visitors cannot send chat messages)
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized: Tactical chat is strictly restricted to authenticated production team members.");
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", program.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        const org = await ctx.db.get(program.organizationId);
        const isOwner = org?.createdBy === userId;

        if (!membership && !isOwner) {
            throw new Error("Forbidden: You must be a registered team member of this organization to send messages.");
        }

        const resolvedRole = membership?.role || (isOwner ? "admin" : args.senderRole || "operator");

        return await ctx.db.insert("crewChat", {
            organizationId: program.organizationId,
            programId: args.programId,
            senderName: args.senderName.trim() || "Crew Member",
            senderRole: resolvedRole,
            message: trimmed,
            timestamp: Date.now(),
        });
    },
});

export const clearMessages = mutation({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.programId);
        if (!program) throw new Error("Program not found");

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const membership = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", program.organizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        const org = await ctx.db.get(program.organizationId);
        const isOwner = org?.createdBy === userId;

        if (!membership && !isOwner) {
            throw new Error("Forbidden");
        }

        const messages = await ctx.db
            .query("crewChat")
            .withIndex("by_program", (q) => q.eq("programId", args.programId))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});
