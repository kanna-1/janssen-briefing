export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Before the scheduler, so the first pipeline run never meets a table the
    // build expects and the database has not got yet.
    const { runMigrations } = await import("./lib/migrate");
    await runMigrations();

    if (process.env.ENABLE_PIPELINE !== "false") {
      const { startScheduler } = await import("./lib/scheduler");
      startScheduler();
    } else {
      console.log("[scheduler] Pipeline disabled (ENABLE_PIPELINE=false)");
    }
  }
}
