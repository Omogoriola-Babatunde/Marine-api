export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV !== "production" &&
    process.env.MSW_ENABLED === "1"
  ) {
    const { mswServer } = await import("./tests/e2e/setup");
    mswServer.listen({ onUnhandledRequest: "bypass" });
    console.log("[msw] server-side handlers registered");
  }
}
