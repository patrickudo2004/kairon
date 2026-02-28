import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,
    profiles: defineTable({
        userId: v.string(), // Clerk or Convex Auth ID
        fullName: v.string(),
        avatarUrl: v.optional(v.string()),
    }).index("by_userId", ["userId"]),

    organizations: defineTable({
        name: v.string(),
        slug: v.string(),
        logoUrl: v.optional(v.string()),
        brandColor: v.optional(v.string()),
        subscriptionStatus: v.union(
            v.literal("free"),
            v.literal("pro"),
            v.literal("enterprise")
        ),
        stripeCustomerId: v.optional(v.string()),
        createdBy: v.string(),
    }).index("by_slug", ["slug"]),

    members: defineTable({
        organizationId: v.id("organizations"),
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("operator")),
    }).index("by_org", ["organizationId"]).index("by_user", ["userId"]),

    programs: defineTable({
        title: v.string(),
        subtitle: v.string(),
        date: v.string(),
        startTime: v.string(),
        endTime: v.optional(v.string()),
        organizationId: v.id("organizations"),
        estimatedAttendees: v.optional(v.number()),
        averageHourlyRate: v.optional(v.number()),
        slots: v.array(
            v.object({
                id: v.string(),
                title: v.string(),
                speaker: v.string(),
                durationMinutes: v.number(),
                type: v.string(),
                actualDuration: v.optional(v.number()),
                details: v.optional(v.string()),
                productionNotes: v.optional(v.string()),
            })
        ),
        isManualMode: v.optional(v.boolean()),
        isOnHold: v.optional(v.boolean()),
        holdMessage: v.optional(v.string()),
        currentSlotIndex: v.optional(v.number()),
        isTimerActive: v.optional(v.boolean()),
        timerStartTimestamp: v.optional(v.union(v.number(), v.null())),
        secondsElapsed: v.optional(v.number()),
        slug: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
        status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("concluded"))),
    }).index("by_org", ["organizationId"]).index("by_slug", ["slug"]),

    stageMessages: defineTable({
        programId: v.string(),
        text: v.string(),
        type: v.string(), // 'alert', 'info', etc.
        timestamp: v.number(),
        expiresAt: v.number(), // For auto-cleanup or hiding
    }).index("by_program_latest", ["programId", "timestamp"]),
});
