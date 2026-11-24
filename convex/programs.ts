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

    if (!membership) {
        // Fallback: Check if user is creator/owner of the organization
        const org = await ctx.db.get(organizationId);
        if (org && (org.createdBy === userId || String(org.createdBy) === String(userId))) {
            return { userId, role: "admin" as const };
        }
        throw new Error("Unauthorized: Not a member of this organization");
    }

    const roles = ["operator", "manager", "admin"];
    const memberLevel = roles.indexOf(membership.role);
    const requiredLevel = roles.indexOf(minimumRole);

    if (memberLevel < requiredLevel) {
        throw new Error(`Unauthorized: Insufficient permissions. Required: ${minimumRole}, Current: ${membership.role}`);
    }

    return { userId, role: membership.role };
}

async function isOrgMember(ctx: any, organizationId: Id<"organizations">, userId: any): Promise<boolean> {
    if (!userId) return false;
    const userIdStr = String(userId);
    const membership = await ctx.db
        .query("members")
        .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
        .filter((q: any) => q.eq(q.field("userId"), userIdStr))
        .first();
    if (membership) return true;
    const org = await ctx.db.get(organizationId);
    return !!(org && String(org.createdBy) === userIdStr);
}

function sanitizeProgramForUnauthenticatedDisplay(doc: Doc<"programs">) {
    const { averageHourlyRate: _rate, estimatedAttendees: _attendees, ...safeDoc } = doc;
    const sanitizedSlots = (doc.slots || []).map((slot: any) => {
        const { prompterText: _prompter, productionNotes: _notes, ...publicSlot } = slot;
        return publicSlot;
    });
    return {
        ...safeDoc,
        slots: sanitizedSlots,
    };
}

export const getPrograms = query({
    args: { organizationId: v.optional(v.union(v.id("organizations"), v.string())) },
    handler: async (ctx, args) => {
        if (!args.organizationId) return [];
        const orgIdStr = String(args.organizationId);
        if (orgIdStr.startsWith('local-') || orgIdStr.startsWith('test-')) return [];
        const normalizedId = ctx.db.normalizeId("organizations", orgIdStr);
        if (!normalizedId) return [];

        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const authorized = await isOrgMember(ctx, normalizedId, userId);
        if (!authorized) return [];

        return await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", normalizedId))
            .collect();
    },
});

export const getProgramById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        if (!args.id) return null;
        try {
            const cleanId = args.id.replace(/^local-/, '');
            let doc: Doc<"programs"> | null = null;

            const normalizedId = ctx.db.normalizeId("programs", cleanId);
            if (normalizedId) {
                doc = await ctx.db.get(normalizedId);
            }
            if (!doc) {
                doc = await ctx.db
                    .query("programs")
                    .withIndex("by_uuid", (q) => q.eq("uuid", cleanId))
                    .first();
            }
            if (!doc) {
                doc = await ctx.db
                    .query("programs")
                    .withIndex("by_slug", (q) => q.eq("slug", cleanId))
                    .first();
            }
            if (!doc && cleanId !== args.id) {
                doc = await ctx.db
                    .query("programs")
                    .withIndex("by_slug", (q) => q.eq("slug", args.id))
                    .first();
            }

            if (!doc) return null;

            const userId = await getAuthUserId(ctx);
            const authorized = userId ? await isOrgMember(ctx, doc.organizationId, userId) : false;
            if (authorized) return doc;

            if (doc.isPublic === false) return null;
            return sanitizeProgramForUnauthenticatedDisplay(doc);
        } catch (e) {
            // Unexpected internal error fallback
        }
        return null;
    },
});

export const getActiveSessions = query({
    args: { organizationId: v.union(v.id("organizations"), v.string()) },
    handler: async (ctx, args) => {
        if (!args.organizationId) return [];
        const orgIdStr = String(args.organizationId);
        if (orgIdStr.startsWith('local-') || orgIdStr.startsWith('test-')) return [];
        const normalizedId = ctx.db.normalizeId("organizations", orgIdStr);
        if (!normalizedId) return [];

        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const authorized = await isOrgMember(ctx, normalizedId, userId);
        if (!authorized) return [];

        return await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", normalizedId))
            .filter((q) => q.eq(q.field("status"), "live"))
            .collect();
    },
});

// Multi-tenant safe live-fetch (never leaks another tenant's live event to unauthenticated visitors)
export const getLiveProgram = query({
    args: { organizationId: v.optional(v.union(v.id("organizations"), v.string())) },
    handler: async (ctx, args) => {
        try {
            const userId = await getAuthUserId(ctx);
            if (!userId) return null;

            if (args.organizationId) {
                const orgIdStr = String(args.organizationId);
                if (orgIdStr.startsWith('local-') || orgIdStr.startsWith('test-')) return null;
                const normalizedId = ctx.db.normalizeId("organizations", orgIdStr);
                if (!normalizedId) return null;

                const authorized = await isOrgMember(ctx, normalizedId, userId);
                if (!authorized) return null;

                const liveInOrg = await ctx.db
                    .query("programs")
                    .withIndex("by_org", (q) => q.eq("organizationId", normalizedId))
                    .filter((q) => q.eq(q.field("status"), "live"))
                    .first();
                return liveInOrg || null;
            } else {
                const memberships = await ctx.db
                    .query("members")
                    .withIndex("by_user", (q) => q.eq("userId", String(userId)))
                    .collect();

                for (const m of memberships) {
                    const liveInOrg = await ctx.db
                        .query("programs")
                        .withIndex("by_org", (q) => q.eq("organizationId", m.organizationId))
                        .filter((q) => q.eq(q.field("status"), "live"))
                        .first();
                    if (liveInOrg) return liveInOrg;
                }
                return null;
            }
        } catch (e) {
            console.warn("getLiveProgram query fallback error:", e);
        }
        return null;
    },
});

export const stopAllActiveSessions = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await checkPermissions(ctx, args.organizationId, "operator");
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
    args: { 
        slug: v.string(),
        includeProductionNotes: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        if (!args.slug) return null;
        try {
            const cleanSlug = args.slug.replace(/^local-/, '');
            let doc = null;

            // 1. Try by exact slug (or cleaned slug)
            const bySlug = await ctx.db
                .query("programs")
                .withIndex("by_slug", (q) => q.eq("slug", cleanSlug))
                .first();
            if (bySlug) doc = bySlug;

            if (!doc && cleanSlug !== args.slug) {
                const byRawSlug = await ctx.db
                    .query("programs")
                    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                    .first();
                if (byRawSlug) doc = byRawSlug;
            }

            // 2. Try as Convex ID
            if (!doc) {
                const normalizedId = ctx.db.normalizeId("programs", cleanSlug);
                if (normalizedId) {
                    const docById = await ctx.db.get(normalizedId);
                    if (docById) doc = docById;
                }
            }

            // 3. Try as UUID
            if (!doc) {
                const byUuid = await ctx.db
                    .query("programs")
                    .withIndex("by_uuid", (q) => q.eq("uuid", cleanSlug))
                    .first();
                if (byUuid) doc = byUuid;
            }

            if (!doc) return null;

            const userId = await getAuthUserId(ctx);
            const authorized = userId ? await isOrgMember(ctx, doc.organizationId, userId) : false;

            // Security: Enforce isPublic visibility restriction for non-members
            if (!authorized && doc.isPublic === false) return null;

            // Security Projection: Never leak confidential speaker scripts (prompterText),
            // internal financial rates (averageHourlyRate), or booth cues to unauthenticated attendees.
            const sanitizedSlots = (doc.slots || []).map((slot: any) => ({
                id: slot.id,
                title: slot.title,
                speaker: slot.speaker,
                durationMinutes: slot.durationMinutes,
                actualDuration: slot.actualDuration,
                type: slot.type,
                details: slot.details,
                // Only disclose booth cues to authenticated org members when explicitly requested
                ...(authorized && args.includeProductionNotes ? { productionNotes: slot.productionNotes } : {}),
            }));

            return {
                _id: doc._id,
                id: doc._id,
                title: doc.title,
                subtitle: doc.subtitle,
                date: doc.date,
                startTime: doc.startTime,
                endTime: doc.endTime,
                organizationId: doc.organizationId,
                status: doc.status,
                isTimerActive: doc.isTimerActive,
                secondsElapsed: doc.secondsElapsed,
                currentSlotIndex: doc.currentSlotIndex,
                timerStartTimestamp: doc.timerStartTimestamp,
                isOnHold: doc.isOnHold,
                holdMessage: doc.holdMessage,
                isManualMode: doc.isManualMode,
                slug: doc.slug,
                uuid: doc.uuid,
                isPublic: doc.isPublic,
                slots: sanitizedSlots,
            };
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

        const cleanUuid = args.uuid ? args.uuid.replace(/^local-/, '') : undefined;

        if (cleanUuid) {
            const existing = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", cleanUuid))
                .first();
            if (existing) {
                if (String(existing.organizationId) !== String(args.organizationId)) {
                    throw new Error("Forbidden: A program with this identifier already belongs to another organization.");
                }
                const { uuid: _uuid, organizationId: _orgId, ...patch } = args;
                await ctx.db.patch(existing._id, {
                    ...patch,
                    slug: existing.slug || cleanUuid,
                    isPublic: args.isPublic ?? existing.isPublic ?? true,
                });
                return existing._id;
            }
        }
        const insertedId = await ctx.db.insert("programs", {
            ...args,
            uuid: cleanUuid,
            slug: cleanUuid || undefined,
            isPublic: args.isPublic ?? true,
            status: "draft",
            isTimerActive: false,
            secondsElapsed: 0,
            currentSlotIndex: 0,
        });
        if (!cleanUuid) {
            await ctx.db.patch(insertedId, { slug: String(insertedId) });
        }
        return insertedId;
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
        // Enforce administrative permissions in target organization
        await checkPermissions(ctx, args.organizationId, "admin");

        if (args.uuid) {
            const existing = await ctx.db
                .query("programs")
                .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
                .first();
            if (existing) {
                if (String(existing.organizationId) !== String(args.organizationId)) {
                    throw new Error("Forbidden: Program UUID belongs to another organization.");
                }
                const { uuid: _uuid, organizationId: _orgId, ...patch } = args;
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

    const cleanUuid = id.replace(/^local-/, '');
    const byUuid = await ctx.db
        .query("programs")
        .withIndex("by_uuid", (q: any) => q.eq("uuid", cleanUuid))
        .first();
    if (byUuid) return byUuid;

    return await ctx.db
        .query("programs")
        .withIndex("by_slug", (q: any) => q.eq("slug", cleanUuid))
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

        // Verify baseline operator permissions
        await checkPermissions(ctx, program.organizationId, "operator");

        if (program.status === "archived") {
            throw new Error("Cannot modify an archived Service Report.");
        }

        // Strict field allowlist — prevent mass assignment & cross-tenant organizationId mutation
        const OPERATOR_FIELDS = new Set([
            "status",
            "isTimerActive",
            "secondsElapsed",
            "currentSlotIndex",
            "timerStartTimestamp",
            "isOnHold",
            "holdMessage",
            "isManualMode",
        ]);
        const STRUCTURAL_FIELDS = new Set([
            "title",
            "subtitle",
            "date",
            "startTime",
            "endTime",
            "slots",
            "slug",
            "isPublic",
            "estimatedAttendees",
            "averageHourlyRate",
        ]);

        const rawPatch = (args.patch && typeof args.patch === "object") ? args.patch : {};
        const safePatch: Record<string, any> = {};
        let touchesStructural = false;

        for (const [key, value] of Object.entries(rawPatch)) {
            if (OPERATOR_FIELDS.has(key)) {
                safePatch[key] = value;
            } else if (STRUCTURAL_FIELDS.has(key)) {
                safePatch[key] = value;
                touchesStructural = true;
            }
        }

        if (touchesStructural) {
            await checkPermissions(ctx, program.organizationId, "manager");
        }

        // Never wipe out existing slug or isPublic with undefined during auto-save
        if (!safePatch.slug) {
            safePatch.slug = program.slug || program.uuid || String(program._id);
        }
        if (safePatch.isPublic === undefined) {
            safePatch.isPublic = program.isPublic ?? true;
        }

        await ctx.db.patch(program._id, safePatch);
    },
});

async function cascadeDeleteProgramDependents(ctx: any, program: Doc<"programs">) {
    const acks = await ctx.db
        .query("acknowledgements")
        .withIndex("by_slot", (q: any) => q.eq("programId", program._id))
        .collect();
    for (const ack of acks) await ctx.db.delete(ack._id);

    const candidateKeys = Array.from(
        new Set([String(program._id), program.uuid, program.slug].filter(Boolean) as string[])
    );
    for (const key of candidateKeys) {
        const msgs = await ctx.db
            .query("stageMessages")
            .withIndex("by_program_latest", (q: any) => q.eq("programId", key))
            .collect();
        for (const msg of msgs) await ctx.db.delete(msg._id);

        const chats = await ctx.db
            .query("crewChat")
            .withIndex("by_program", (q: any) => q.eq("programId", key))
            .collect();
        for (const chat of chats) await ctx.db.delete(chat._id);
    }
}

export const deleteProgram = mutation({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const program = await resolveProgram(ctx, args.id);
        if (!program) return;

        // Verify permissions - Only managers/admins can delete
        await checkPermissions(ctx, program.organizationId, "manager");

        if (program.status === "archived") {
            throw new Error("Cannot delete a finalized, archived Service Report.");
        }

        await cascadeDeleteProgramDependents(ctx, program);
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
        await ctx.db.patch(program._id, { 
            status: "archived",
            isTimerActive: false,
            timerStartTimestamp: null
        });
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

        if (program.status === "archived") {
            throw new Error("Cannot modify an archived Service Report.");
        }

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

        // Cross-Tenant Protection: Verify user has management permissions over each source program
        for (const id of args.programIds) {
            const prog = await ctx.db.get(id);
            if (!prog) continue;
            await checkPermissions(ctx, prog.organizationId, "manager");
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
        if (!org) throw new Error("Organization not found");

        if (org.createdBy !== userId && String(org.createdBy) !== String(userId)) {
            // Also allow an admin if owner field is legacy or matches admin check
            await checkPermissions(ctx, args.organizationId, "admin");
        }

        const programs = await ctx.db
            .query("programs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const prog of programs) {
            await cascadeDeleteProgramDependents(ctx, prog);
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
        if (program.isPublic === false) {
            const userId = await getAuthUserId(ctx);
            const authorized = userId ? await isOrgMember(ctx, program.organizationId, userId) : false;
            if (!authorized) throw new Error("Forbidden: Private program requires workspace authentication.");
        }
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
        if (program.isPublic === false) {
            const userId = await getAuthUserId(ctx);
            const authorized = userId ? await isOrgMember(ctx, program.organizationId, userId) : false;
            if (!authorized) return [];
        }

        return await ctx.db
            .query("acknowledgements")
            .withIndex("by_slot", (q) => q.eq("programId", program._id))
            .collect();
    },
});
