import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const OWNER_EMAIL = "patrickudo2004@gmail.com";

async function getAuthorizedOwner(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  const email = (user?.email || "").trim().toLowerCase();
  if (email !== OWNER_EMAIL) return null;
  return { userId: String(userId), email };
}

/**
 * Public mutation so website visitors, Guest Booth users, Web App users,
 * and Desktop App users can all submit Open Beta feedback directly into
 * the private owner inbox.
 */
export const submitFeedback = mutation({
  args: {
    category: v.union(
      v.literal("bug"),
      v.literal("feature"),
      v.literal("ux"),
      v.literal("praise"),
      v.literal("other")
    ),
    rating: v.optional(v.number()),
    message: v.string(),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    source: v.union(
      v.literal("website"),
      v.literal("web_app"),
      v.literal("desktop_app")
    ),
    appVersion: v.string(),
    pageRoute: v.optional(v.string()),
    platformInfo: v.optional(v.string()),
    workspaceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanMessage = (args.message || "").trim();
    if (cleanMessage.length < 3) {
      throw new Error("Please share at least a few words of feedback before submitting.");
    }
    if (cleanMessage.length > 4000) {
      throw new Error("Feedback message must be 4,000 characters or fewer.");
    }

    let safeRating: number | undefined = undefined;
    if (typeof args.rating === "number" && Number.isFinite(args.rating)) {
      const rounded = Math.round(args.rating);
      if (rounded >= 1 && rounded <= 5) {
        safeRating = rounded;
      }
    }

    const authUserId = await getAuthUserId(ctx);
    let resolvedEmail = (args.contactEmail || "").trim().slice(0, 180) || undefined;
    let resolvedName = (args.contactName || "").trim().slice(0, 120) || undefined;

    if (authUserId) {
      const authUser = await ctx.db.get(authUserId);
      if (!resolvedEmail && authUser?.email) {
        resolvedEmail = String(authUser.email).trim().slice(0, 180);
      }
      if (!resolvedName && authUser?.name) {
        resolvedName = String(authUser.name).trim().slice(0, 120);
      }
    }

    const id = await ctx.db.insert("betaFeedback", {
      category: args.category,
      rating: safeRating,
      message: cleanMessage,
      contactEmail: resolvedEmail,
      contactName: resolvedName,
      source: args.source,
      appVersion: (args.appVersion || "1.1.4").trim().slice(0, 32),
      pageRoute: args.pageRoute ? args.pageRoute.trim().slice(0, 200) : undefined,
      platformInfo: args.platformInfo ? args.platformInfo.trim().slice(0, 200) : undefined,
      workspaceName: args.workspaceName ? args.workspaceName.trim().slice(0, 120) : undefined,
      userId: authUserId ? String(authUserId) : undefined,
      status: "new",
      createdAt: Date.now(),
    });

    return { success: true, id };
  },
});

/**
 * STRICTLY OWNER-ONLY: List all beta feedback entries (newest first).
 * Returns null for any unauthenticated or non-owner user.
 */
export const listFeedback = query({
  args: {},
  handler: async (ctx) => {
    const owner = await getAuthorizedOwner(ctx);
    if (!owner) return null;

    const items = await ctx.db
      .query("betaFeedback")
      .withIndex("by_created")
      .order("desc")
      .take(300);

    return items;
  },
});

/**
 * STRICTLY OWNER-ONLY: Count of unread ("new") beta feedback entries for sidebar badge.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const owner = await getAuthorizedOwner(ctx);
    if (!owner) return 0;

    const unread = await ctx.db
      .query("betaFeedback")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .collect();

    return unread.length;
  },
});

/**
 * STRICTLY OWNER-ONLY: Update triage status or private owner notes.
 */
export const updateFeedback = mutation({
  args: {
    id: v.id("betaFeedback"),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("planned"),
        v.literal("resolved")
      )
    ),
    ownerNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await getAuthorizedOwner(ctx);
    if (!owner) {
      throw new Error("Unauthorized: Owner access required.");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Feedback entry not found.");
    }

    const patch: Record<string, any> = {};
    if (args.status !== undefined) patch.status = args.status;
    if (args.ownerNotes !== undefined) patch.ownerNotes = args.ownerNotes.trim().slice(0, 2000);

    await ctx.db.patch(args.id, patch);
    return { success: true };
  },
});

/**
 * STRICTLY OWNER-ONLY: Permanently delete a feedback entry.
 */
export const deleteFeedback = mutation({
  args: {
    id: v.id("betaFeedback"),
  },
  handler: async (ctx, args) => {
    const owner = await getAuthorizedOwner(ctx);
    if (!owner) {
      throw new Error("Unauthorized: Owner access required.");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) return { success: true };

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
