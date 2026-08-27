import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

// Internal helper to verify user has required role in an organization
export async function checkPermissions(ctx: any, organizationId: Id<"organizations">, minimumRole: "admin" | "manager" | "operator") {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized: Not logged in");

    const membership = await ctx.db
        .query("members")
        .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
        .filter((q: any) => q.eq(q.field("userId"), userId))
        .unique();

    if (!membership) throw new Error("Unauthorized: Not a member of this organization");

    const roles = ["operator", "manager", "admin"];
    const memberLevel = roles.indexOf(membership.role);
    const requiredLevel = roles.indexOf(minimumRole);

    if (memberLevel < requiredLevel) {
        throw new Error(`Unauthorized: Insufficient permissions. Required: ${minimumRole}, Current: ${membership.role}`);
    }

    return { userId, role: membership.role };
}

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
        if (!args.id) return null;
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

            // 3. Try as Slug
            const bySlug = await ctx.db
                .query("programs")
                .withIndex("by_slug", (q) => q.eq("slug", args.id))
                .first();
            if (bySlug) return bySlug;

            // 4. Try fallback search in programs
            const fallback = await ctx.db
                .query("programs")
                .filter((q) => q.or(
                    q.eq(q.field("uuid"), args.id),
                    q.eq(q.field("slug"), args.id),
                    q.eq(q.field("title"), args.id)
                ))
                .first();
            if (fallback) return fallback;
        } catch (e) {
            // Unexpected internal error fallback
        }
        return null;
    },
});

export const getActiveSessions = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("status"), "live"))
            .collect();
    },
});

// Resilient live-fetch for monitors, external views, and public portals
export const getLiveProgram = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        try {
            if (args.organizationId) {
                const liveInOrg = await ctx.db
                    .query("programs")
                    .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId!))
                    .filter((q) => q.eq(q.field("status"), "live"))
                    .first();
                if (liveInOrg) return liveInOrg;
            }

            // Fallback 1: Any program marked as live
            const anyLive = await ctx.db
                .query("programs")
                .filter((q) => q.eq(q.field("status"), "live"))
                .first();
            if (anyLive) return anyLive;

            // Fallback 2: The latest updated program in the database
            const latest = await ctx.db
                .query("programs")
                .order("desc")
                .first();
            if (latest) return latest;
        } catch (e) {
            console.warn("getLiveProgram query fallback error:", e);
        }
        return null;
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
        if (!args.slug) return null;
        try {
            // 1. Try by exact slug
            const bySlug = await ctx.db
                .query("programs")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                .first();
            if (bySlug) return bySlug;

            // 2. Try as Convex ID
            const normalizedId = ctx.db.normalizeId("programs", args.slug);
            if (normalizedId) {
                const doc = await ctx.db.get(normalizedId);
                if (doc) return doc;
            }

            // 3. Try as UUID
            const cleanUuid = args.slug.replace('local-', '');
            const byUuid = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", cleanUuid))
                .first();
            if (byUuid) return byUuid;

            // 4. Try fallback search by title or UUID
            const fallback = await ctx.db
                .query("programs")
                .filter((q) => q.or(
                    q.eq(q.field("uuid"), args.slug),
                    q.eq(q.field("slug"), args.slug),
                    q.eq(q.field("title"), args.slug)
                ))
                .first();
            if (fallback) return fallback;
        } catch (e) {
            console.warn("getProgramBySlug query fallback error:", e);
        }
        return null;
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
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Verify permissions
        await checkPermissions(ctx, args.organizationId, "manager");

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


// Internal helper to resolve a program document by either Convex ID or UUID
export async function resolveProgram(ctx: any, id: string) {
    const normalizedId = ctx.db.normalizeId("programs", id);
    if (normalizedId) {
        const doc = await ctx.db.get(normalizedId);
        if (doc) return doc;
    }

    const cleanUuid = id.replace('local-', '');
    return await ctx.db
        .query("programs")
        .withIndex("by_uuid", (q: any) => q.eq("uuid", cleanUuid))
        .first();
}

export const updateProgram = mutation({
    args: {
        id: v.string(), // Changed to v.string() for robustness
        patch: v.any(),
    },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.id);
        if (!program) throw new Error("Program not found");

        // Verify permissions
        await checkPermissions(ctx, program.organizationId, "operator");

        if (program.status === "archived") {
            throw new Error("Cannot modify an archived Service Report.");
        }
        await ctx.db.patch(program._id, args.patch);
    },
});

export const deleteProgram = mutation({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.id);
        if (!program) return;

        // Verify permissions - Only managers/admins can delete
        await checkPermissions(ctx, program.organizationId, "manager");

        await ctx.db.delete(program._id);
    },
});

export const finalizeProgram = mutation({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.id);
        if (!program) throw new Error("Program not found");

        // Verify permissions - Finalizing a report is a manager action
        await checkPermissions(ctx, program.organizationId, "manager");

        if (program.status === "archived") throw new Error("Program is already archived");
        await ctx.db.patch(program._id, { status: "archived" });
    },
});

export const updateTimerState = mutation({
    args: {
        id: v.string(),
        timerState: v.object({
            isTimerActive: v.boolean(),
            secondsElapsed: v.number(),
            currentSlotIndex: v.number(),
            timerStartTimestamp: v.union(v.number(), v.null()),
            isOnHold: v.optional(v.boolean()),
            isManualMode: v.optional(v.boolean()),
            holdMessage: v.optional(v.string()),
            status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("concluded"), v.literal("archived"))),
        }),
    },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.id);
        if (!program) throw new Error("Program not found");

        // Verify permissions - Operators can control the timer
        await checkPermissions(ctx, program.organizationId, "operator");

        await ctx.db.patch(program._id, args.timerState);
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
        programId: v.string(),
        slotId: v.string(),
        role: v.union(v.literal("sound"), v.literal("lighting"), v.literal("video")),
    },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.programId);
        if (!program) throw new Error("Program not found");
        await checkPermissions(ctx, program.organizationId, "operator");

        const timestamp = Date.now();

        // Check if already acknowledged for this slot/role
        const existing = await ctx.db
            .query("acknowledgements")
            .withIndex("by_slot", (q) => q.eq("programId", program._id).eq("slotId", args.slotId))
            .filter((q) => q.eq(q.field("role"), args.role))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { timestamp });
        } else {
            await ctx.db.insert("acknowledgements", {
                programId: program._id,
                slotId: args.slotId,
                role: args.role,
                timestamp,
            });
        }
    },
});

export const getAcknowledgements = query({
    args: { programId: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.programId);
        if (!program) return [];

        return await ctx.db
            .query("acknowledgements")
            .withIndex("by_slot", (q) => q.eq("programId", program._id))
            .collect();
    },
});
