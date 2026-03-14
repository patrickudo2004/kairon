import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

            // 2. Try as UUID (for monitors/legacy links) - Strip local- prefix if present
            const cleanUuid = args.id.replace('local-', '');
            const byUuid = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", cleanUuid))
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
        const today = new Date().toISOString().split('T')[0];
        return await ctx.db
            .query("programs")
            .withIndex("by_status", (q) => q.eq("status", "live"))
            .filter((q) => q.eq(q.field("date"), today))
            .first();
    },
});

export const stopAllActiveSessions = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const activePrograms = await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("status"), "live"))
            .collect();

        for (const prog of activePrograms) {
            await ctx.db.patch(prog._id, {
                status: "draft",
                isTimerActive: false,
                timerStartTimestamp: null,
            });
        }
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
        isPublic: v.optional(v.boolean()), // Added isPublic to args
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
            slug: args.uuid || undefined,
            isPublic: true,
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
        const program = await ctx.db.get(args.id);
        if (program?.status === "archived") {
            throw new Error("Cannot modify an archived Service Report.");
        }
        await ctx.db.patch(args.id, args.patch);
    },
});

export const finalizeProgram = mutation({
    args: { id: v.id("programs") },
    handler: async (ctx, args) => {
        const program = await ctx.db.get(args.id);
        if (!program) throw new Error("Program not found");
        if (program.status === "archived") throw new Error("Program is already archived");
        await ctx.db.patch(args.id, { status: "archived" });
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
            status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("concluded"), v.literal("archived"))),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.timerState);
    },
});

export const migratePrograms = mutation({
    args: {
        targetOrganizationId: v.id("organizations"),
        programIds: v.array(v.id("programs")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Verify user is at least an admin/manager in the target org
        const membership = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("organizationId", args.targetOrganizationId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .unique();

        if (membership?.role !== "admin" && membership?.role !== "manager") {
            throw new Error("Insufficient permissions in the target organization.");
        }

        for (const id of args.programIds) {
            await ctx.db.patch(id, { organizationId: args.targetOrganizationId });
        }
    },
});

export const deleteAllProgramsInOrg = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const org = await ctx.db.get(args.organizationId);
        if (org?.createdBy !== userId) {
            throw new Error("Only the owner can purge all programs.");
        }

        const programs = await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const prog of programs) {
            await ctx.db.delete(prog._id);
        }
    },
});

export const acknowledgeCue = mutation({
    args: {
        programId: v.id("programs"),
        slotId: v.string(),
        role: v.union(v.literal("sound"), v.literal("lighting"), v.literal("video")),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();

        // Check if already acknowledged for this slot/role
        const existing = await ctx.db
            .query("acknowledgements")
            .withIndex("by_slot", (q) => q.eq("programId", args.programId).eq("slotId", args.slotId))
            .filter((q) => q.eq(q.field("role"), args.role))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { timestamp });
        } else {
            await ctx.db.insert("acknowledgements", {
                programId: args.programId,
                slotId: args.slotId,
                role: args.role,
                timestamp,
            });
        }
    },
});

export const getAcknowledgements = query({
    args: { programId: v.id("programs") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("acknowledgements")
            .withIndex("by_slot", (q) => q.eq("programId", args.programId))
            .collect();
    },
});
