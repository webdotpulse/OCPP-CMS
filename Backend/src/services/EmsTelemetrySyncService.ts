import { prisma } from "../config/database.js";
import { redisClient } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export class EmsTelemetrySyncService {
  static async syncToDatabase() {
    try {
      const keys = await redisClient.keys("ems_telemetry:*");
      if (keys.length === 0) return;

      const records = [];
      for (const key of keys) {
        const data = await redisClient.hgetall(key);
        if (data && data.solar_kw) {
          const gateway_id = key.replace("ems_telemetry:", "");
          records.push({
            gateway_id,
            solar_kw: parseFloat(data.solar_kw),
            battery_kw: parseFloat(data.battery_kw),
            grid_kw: parseFloat(data.grid_kw),
            house_kw: parseFloat(data.house_kw),
            timestamp: new Date(parseInt(data.timestamp)),
          });
        }
      }

      if (records.length > 0) {
        await prisma.emsTelemetryRecord.createMany({
          data: records,
          skipDuplicates: true,
        });
      }
    } catch (error) {
      logger.error(`Error syncing EMS telemetry to database: ${error}`);
    }
  }
}
