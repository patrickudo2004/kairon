import { v } from "convex/values";
import { query } from "./_generated/server";

export const listAllUsers = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return users.map(u => ({
            id: u._id,
            email: u.email,
            name: (u as any).name,
            hasEmail: !!u.email
        }));
    },
});
