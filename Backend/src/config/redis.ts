import { Redis } from "ioredis";
import { config } from "./index.js";
import { logger } from "../utils/logger.js";

// Main Redis client for standard commands (caching, rate limiting)
export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    logger.warn(`Redis connection retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
});

// Redis client dedicated to Pub/Sub (Publishing)
export const redisPublisher = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

// Redis client dedicated to Pub/Sub (Subscribing)
export const redisSubscriber = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redisClient.on("connect", () => logger.info("Redis main client connected"));
redisClient.on("error", (err) => logger.error(`Redis client error: ${err}`));

redisPublisher.on("connect", () => logger.info("Redis publisher connected"));
redisPublisher.on("error", (err) => logger.error(`Redis publisher error: ${err}`));

redisSubscriber.on("connect", () => logger.info("Redis subscriber connected"));
redisSubscriber.on("error", (err) => logger.error(`Redis subscriber error: ${err}`));

// Graceful shutdown
process.on("beforeExit", () => {
  redisClient.quit();
  redisPublisher.quit();
  redisSubscriber.quit();
});
