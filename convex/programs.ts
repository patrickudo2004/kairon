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
    args: { id: v.string() },
    handler: async (ctx, args) => {
        try {
            // 1. Try as standard Convex ID (safely normalized)
            const normalizedId = ctx.db.normalizeId("programs", args.id);
            if (normalizedId) {
                const doc = await ctx.db.get(normalizedId);
                if (doc) return doc;
            }

            // 2. Try as UUID (for monitors/legacy links)
            const byUuid = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", args.id))
                .first();
            if (byUuid) return byUuid;
        } catch (e) {
            // Unexpected internal error fallback
        }
        return null;
    },
});

export const getLiveProgram = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_status", (q) => q.eq("status", "live"))
            .first();
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
            isOnHold: v.optional(v.boolean()),
            holdMessage: v.optional(v.string()),
            status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("concluded"))),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.timerState);
    },
});
