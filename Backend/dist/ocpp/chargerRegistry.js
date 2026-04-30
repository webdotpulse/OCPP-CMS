import { logger } from "../utils/logger.js";
import { redisClient, redisSubscriber, redisPublisher } from "../config/redis.js";
class ChargerRegistry {
    chargers = new Map();
    offlineMonitorInterval = null;
    offlineThreshold;
    constructor(offlineThresholdSeconds = 60) {
        this.offlineThreshold = offlineThresholdSeconds * 1000;
        this.startOfflineMonitor();
        this.setupRedisSubscriber();
    }
    setupRedisSubscriber() {
        redisSubscriber.subscribe("ocpp_commands", (err) => {
            if (err)
                logger.error(`Failed to subscribe to ocpp_commands: ${err}`);
            else
                logger.info("Subscribed to ocpp_commands Redis channel");
        });
        redisSubscriber.on("message", async (channel, message) => {
            if (channel === "ocpp_commands") {
                try {
                    const { chargerId, payload } = JSON.parse(message);
                    // Only send if this instance holds the active connection
                    if (this.isConnected(chargerId)) {
                        await this.sendToCharger(chargerId, payload);
                    }
                }
                catch (error) {
                    logger.error(`Error processing Redis pub/sub command: ${error}`);
                }
            }
        });
    }
    getRedisKey(chargerId) {
        return `charger:${chargerId}:session`;
    }
    getTransactionKey(chargerId, transactionId) {
        return `charger:${chargerId}:transaction:${transactionId}`;
    }
    /**
     * Register a new charger connection
     */
    async register(chargerId, chargerName, ws) {
        const connection = {
            chargerId,
            ws,
            chargerName,
            connectedAt: new Date(),
            lastHeartbeat: new Date(),
            transactions: new Map(),
        };
        this.chargers.set(chargerId, connection);
        logger.info(`Charger registered locally: ${chargerName} (ID: ${chargerId})`);
        // Cache connection metadata in Redis
        try {
            await redisClient.hset(this.getRedisKey(chargerId), "chargerName", chargerName, "connectedAt", connection.connectedAt.toISOString(), "lastHeartbeat", connection.lastHeartbeat.toISOString(), "status", "connected");
            // Expire session data slightly longer than offline threshold to avoid premature cleanup
            await redisClient.expire(this.getRedisKey(chargerId), this.offlineThreshold / 1000 * 2);
        }
        catch (error) {
            logger.error(`Error caching charger session in Redis: ${error}`);
        }
    }
    /**
     * Unregister a charger (disconnected)
     */
    async unregister(chargerId) {
        const connection = this.chargers.get(chargerId);
        if (connection) {
            this.chargers.delete(chargerId);
            logger.info(`Charger unregistered locally: ${connection.chargerName} (ID: ${chargerId})`);
            try {
                await redisClient.del(this.getRedisKey(chargerId));
            }
            catch (error) {
                logger.error(`Error removing cached charger session in Redis: ${error}`);
            }
        }
    }
    /**
     * Get a charger connection by ID
     */
    getConnection(chargerId) {
        return this.chargers.get(chargerId);
    }
    /**
     * Check if a charger is connected locally
     */
    isConnected(chargerId) {
        return this.chargers.has(chargerId);
    }
    /**
     * Check if a charger is connected anywhere in the cluster
     */
    async isConnectedGlobally(chargerId) {
        if (this.isConnected(chargerId))
            return true;
        const exists = await redisClient.exists(this.getRedisKey(chargerId));
        return exists === 1;
    }
    /**
     * Update charger's last heartbeat timestamp
     */
    async updateHeartbeat(chargerId) {
        const connection = this.chargers.get(chargerId);
        if (connection) {
            connection.lastHeartbeat = new Date();
            try {
                await redisClient.hset(this.getRedisKey(chargerId), "lastHeartbeat", connection.lastHeartbeat.toISOString());
                await redisClient.expire(this.getRedisKey(chargerId), this.offlineThreshold / 1000 * 2);
            }
            catch (error) {
                logger.error(`Error updating cached heartbeat in Redis: ${error}`);
            }
        }
        else {
            // Just in case it's another instance holding the socket, let's just refresh the key if it exists
            try {
                await redisClient.hset(this.getRedisKey(chargerId), "lastHeartbeat", new Date().toISOString());
                await redisClient.expire(this.getRedisKey(chargerId), this.offlineThreshold / 1000 * 2);
            }
            catch (error) {
                // ignore
            }
        }
    }
    /**
     * Start an active transaction for a charger
     */
    async startTransaction(chargerId, transactionId, connectorName, idTag) {
        const transactionData = {
            transactionId,
            connectorName,
            idTag,
            startTime: new Date(),
            initialMeterValue: 0,
        };
        const connection = this.chargers.get(chargerId);
        if (connection) {
            connection.transactions.set(transactionId, transactionData);
        }
        try {
            await redisClient.set(this.getTransactionKey(chargerId, transactionId), JSON.stringify(transactionData));
        }
        catch (error) {
            logger.error(`Error caching transaction in Redis: ${error}`);
        }
    }
    /**
     * End a transaction for a charger
     */
    async endTransaction(chargerId, transactionId) {
        let transaction;
        const connection = this.chargers.get(chargerId);
        if (connection) {
            transaction = connection.transactions.get(transactionId);
            connection.transactions.delete(transactionId);
        }
        try {
            if (!transaction) {
                const cached = await redisClient.get(this.getTransactionKey(chargerId, transactionId));
                if (cached)
                    transaction = JSON.parse(cached);
            }
            await redisClient.del(this.getTransactionKey(chargerId, transactionId));
        }
        catch (error) {
            logger.error(`Error removing cached transaction in Redis: ${error}`);
        }
        return transaction;
    }
    /**
     * Get active transaction for a charger
     */
    async getTransaction(chargerId, transactionId) {
        const connection = this.chargers.get(chargerId);
        if (connection) {
            const tx = connection.transactions.get(transactionId);
            if (tx)
                return tx;
        }
        try {
            const cached = await redisClient.get(this.getTransactionKey(chargerId, transactionId));
            if (cached)
                return JSON.parse(cached);
        }
        catch (error) {
            logger.error(`Error getting cached transaction in Redis: ${error}`);
        }
        return undefined;
    }
    /**
     * Publish an OCPP command via Redis to reach the correct instance
     */
    async publishCommand(chargerId, message) {
        const cachedSession = await redisClient.hgetall(this.getRedisKey(chargerId));
        if (!cachedSession || cachedSession.status !== "connected") {
            throw new Error(`Charger ${chargerId} is not connected anywhere in cluster`);
        }
        // If we have the local connection, we can just send directly as an optimization
        if (this.isConnected(chargerId)) {
            await this.sendToCharger(chargerId, message);
        }
        else {
            // Publish to cluster
            await redisPublisher.publish("ocpp_commands", JSON.stringify({ chargerId, payload: message }));
        }
    }
    /**
     * Send OCPP message to a charger connected to THIS instance
     */
    async sendToCharger(chargerId, message) {
        const connection = this.chargers.get(chargerId);
        if (!connection) {
            throw new Error(`Charger ${chargerId} is not connected locally`);
        }
        // Lazily import to avoid circular dependency
        const { logOcppMessage } = await import("./messageHandlers.js");
        return new Promise((resolve, reject) => {
            connection.ws.send(JSON.stringify(message), (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    // Log outgoing message correctly formatted for WebSocket clients
                    logOcppMessage(chargerId, "out", message).catch(err => logger.error(`Failed to broadcast logged msg: ${err}`));
                    resolve(message);
                }
            });
        });
    }
    /**
     * Get all connected charger IDs
     */
    getConnectedChargers() {
        return Array.from(this.chargers.keys());
    }
    /**
     * Get connection count
     */
    getConnectionCount() {
        return this.chargers.size;
    }
    /**
     * Start monitoring for offline chargers
     */
    startOfflineMonitor() {
        this.offlineMonitorInterval = setInterval(() => {
            const now = Date.now();
            for (const [chargerId, connection] of this.chargers) {
                const timeSinceHeartbeat = now - connection.lastHeartbeat.getTime();
                if (timeSinceHeartbeat > this.offlineThreshold) {
                    logger.warn(`Charger ${connection.chargerName} (ID: ${chargerId}) appears to be offline. Last heartbeat: ${connection.lastHeartbeat.toISOString()}`);
                    // Note: We don't automatically unregister; let the system handle via DB update
                }
            }
        }, 10000); // Check every 10 seconds
    }
    /**
     * Stop the offline monitor
     */
    stopOfflineMonitor() {
        if (this.offlineMonitorInterval) {
            clearInterval(this.offlineMonitorInterval);
            this.offlineMonitorInterval = null;
        }
    }
    /**
     * Clear all connections
     */
    clear() {
        this.chargers.clear();
    }
}
// Singleton instance
export const chargerRegistry = new ChargerRegistry();
