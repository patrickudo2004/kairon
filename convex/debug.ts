import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const debugUsers = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .unique();
        return user;
    },
});
