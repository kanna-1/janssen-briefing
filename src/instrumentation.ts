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

    if (process.env.ENABLE_PIPELINE !== "false") {
      const { startScheduler } = await import("./lib/scheduler");
      startScheduler();
    } else {
      console.log("[scheduler] Pipeline disabled (ENABLE_PIPELINE=false)");
    }
  }
}
