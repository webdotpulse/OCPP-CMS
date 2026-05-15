import cron from "node-cron";
import { EmsTelemetrySyncService } from "../services/EmsTelemetrySyncService.js";
import { logger } from "../utils/logger.js";

export function startTelemetrySyncCron() {
  // Sync every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Running EMS Telemetry Sync Cron...");
    await EmsTelemetrySyncService.syncToDatabase();
  });
  logger.info("EMS Telemetry Sync Cron started (runs every 5 minutes)");
}
