import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getPrograms = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        if (!args.organizationId) return [];
        return await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId!))
            .collect();
    },
});

export const getProgramById = query({
    args: { id: v.string() }, // Accept string to handle potential legacy IDs or standard Convex IDs
    handler: async (ctx, args) => {
        try {
            // Try as Convex ID first
            const doc = await ctx.db.get(args.id as any);
            if (doc) return doc;
        } catch (e) {
            // Fallback or ignore
        }
        return null;
    },
});

export const getProgramBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique();
    },
});

export const createProgram = mutation({
    args: {
        title: v.string(),
        subtitle: v.string(),
        date: v.string(),
        startTime: v.string(),
        organizationId: v.id("organizations"),
        slots: v.array(v.any()),
        uuid: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.uuid) {
            const existing = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
                .first();
            if (existing) {
                const { uuid, ...patch } = args;
                await ctx.db.patch(existing._id, patch);
                return existing._id;
            }
        }
        return await ctx.db.insert("programs", {
            ...args,
            status: "draft",
            isTimerActive: false,
            secondsElapsed: 0,
            currentSlotIndex: 0,
        });
    },
});

// Used exclusively by the migration script to import all fields from Supabase
export const migrateProgram = mutation({
    args: {
        title: v.string(),
        subtitle: v.string(),
        date: v.string(),
        startTime: v.string(),
        endTime: v.optional(v.string()),
        organizationId: v.id("organizations"),
        slots: v.array(v.any()),
        estimatedAttendees: v.optional(v.number()),
        averageHourlyRate: v.optional(v.number()),
        isManualMode: v.optional(v.boolean()),
        isOnHold: v.optional(v.boolean()),
        slug: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
        status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("concluded"))),
        currentSlotIndex: v.optional(v.number()),
        isTimerActive: v.optional(v.boolean()),
        secondsElapsed: v.optional(v.number()),
        uuid: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.uuid) {
            const existing = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
                .first();
            if (existing) {
                const { uuid, ...patch } = args;
                await ctx.db.patch(existing._id, patch);
                return existing._id;
            }
        }
        return await ctx.db.insert("programs", {
            ...args,
            status: args.status ?? "draft",
            isTimerActive: args.isTimerActive ?? false,
            secondsElapsed: args.secondsElapsed ?? 0,
            currentSlotIndex: args.currentSlotIndex ?? 0,
        });
    },
});


export const updateProgram = mutation({
    args: {
        id: v.id("programs"),
        patch: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.patch);
    },
});

export const deleteProgram = mutation({
    args: { id: v.id("programs") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const updateTimerState = mutation({
    args: {
        id: v.id("programs"),
        timerState: v.object({
            isTimerActive: v.boolean(),
            secondsElapsed: v.number(),
            currentSlotIndex: v.number(),
            timerStartTimestamp: v.union(v.number(), v.null()),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.timerState);
    },
});
