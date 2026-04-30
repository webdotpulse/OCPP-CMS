import { WebSocket, WebSocketServer } from "ws";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../config/database.js";
import { redisSubscriber } from "../config/redis.js";
class OcppLogsServer {
    wss = null;
    start() {
        this.wss = new WebSocketServer({ port: config.ocppLogsPort });
        this.wss.on("listening", () => {
            logger.info(`OCPP logs WebSocket listening on port ${config.ocppLogsPort}`);
        });
        this.wss.on("connection", this.handleConnection.bind(this));
        this.wss.on("error", (error) => {
            logger.error(`OCPP logs WebSocket error: ${error}`);
        });
        this.setupRedisSubscription();
    }
    setupRedisSubscription() {
        redisSubscriber.subscribe("ocpp_logs", (err) => {
            if (err)
                logger.error(`Failed to subscribe to ocpp_logs: ${err}`);
            else
                logger.info("Subscribed to ocpp_logs Redis channel");
        });
        redisSubscriber.on("message", (channel, message) => {
            if (channel === "ocpp_logs") {
                try {
                    const log = JSON.parse(message);
                    this.broadcast({
                        type: "log",
                        log,
                    });
                }
                catch (error) {
                    logger.error(`Error processing Redis pub/sub log: ${error}`);
                }
            }
        });
    }
    async handleConnection(ws) {
        logger.info(`OCPP logs client connected. Total clients: ${this.getClientCount()}`);
        // Send welcome message
        this.broadcastToClient(ws, {
            type: "welcome",
            message: "Connected to OCPP logs stream",
            clientCount: this.getClientCount(),
        });
        // Send recent logs (last 50)
        const recentLogs = await prisma.ocppLog.findMany({
            take: 50,
            orderBy: { timestamp: "desc" },
            include: { charger: true },
        });
        this.broadcastToClient(ws, {
            type: "history",
            logs: recentLogs.reverse(), // Send in chronological order
        });
        ws.on("close", () => {
            logger.info(`OCPP logs client disconnected. Total clients: ${this.getClientCount() - 1}`);
        });
        ws.on("error", (error) => {
            logger.error(`OCPP logs WebSocket client error: ${error}`);
        });
    }
    /**
     * Broadcast message to all connected clients
     */
    broadcast(data) {
        if (!this.wss)
            return;
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    /**
     * Send message to specific client
     */
    broadcastToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    /**
     * Get current client count
     */
    getClientCount() {
        return this.wss ? this.wss.clients.size : 0;
    }
    /**
     * Broadcast new OCPP log to all clients
     */
    broadcastLog(log) {
        this.broadcast({
            type: "log",
            log,
        });
    }
    stop() {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
            logger.info("OCPP logs server stopped");
        }
    }
}
// Singleton instance
export const ocppLogsServer = new OcppLogsServer();
