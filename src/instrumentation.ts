export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Containers migrate on startup. Serverless deployments can disable this
    // after applying migrations during release, avoiding a database round trip
    // on every cold start.
    if (process.env.RUN_MIGRATIONS !== "false") {
      const { runMigrations } = await import("./lib/migrate");
      await runMigrations();
    } else {
      console.log("[migrate] Runtime migrations disabled");
    }

    if (
      process.env.ENABLE_PIPELINE !== "false" &&
      process.env.ENABLE_SCHEDULER !== "false"
    ) {
      const { startScheduler } = await import("./lib/scheduler");
      startScheduler();
    } else if (process.env.ENABLE_PIPELINE === "false") {
      console.log("[scheduler] Pipeline disabled (ENABLE_PIPELINE=false)");
    } else {
      console.log("[scheduler] Process scheduler disabled; using platform cron");
    }
  }
}
