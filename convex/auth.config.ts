export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL || "http://localhost:5173",
      applicationID: "convex",
    },
  ],
};
