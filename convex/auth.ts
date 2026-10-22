import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Google, Password],
    callbacks: {
        async redirect({ redirectTo }) {
            if (!redirectTo) return process.env.SITE_URL || "https://kairon-murex.vercel.app";
            const allowedOrigins = [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "https://kairon-murex.vercel.app"
            ];
            for (const origin of allowedOrigins) {
                if (redirectTo.startsWith(origin)) {
                    return redirectTo;
                }
            }
            if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
                const base = (process.env.SITE_URL || "https://kairon-murex.vercel.app").replace(/\/$/, "");
                return `${base}${redirectTo}`;
            }
            return process.env.SITE_URL || "https://kairon-murex.vercel.app";
        }
    }
});
