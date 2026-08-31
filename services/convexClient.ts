import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://majestic-gecko-369.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);

