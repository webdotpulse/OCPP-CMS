import { chargerRegistry } from "./chargerRegistry.js";
import { logger } from "../utils/logger.js";
// Generate unique message ID
let messageIdCounter = 0;
function generateMessageId() {
    return `msg_${Date.now()}_${++messageIdCounter}`;
}
/**
 * Send RemoteStartTransaction request to charger
 * OCPP 1.6 CALL format: [2, messageId, "RemoteStartTransaction", payload]
 */
export async function remoteStartTransaction(request) {
    const { chargerId, connectorId, idTag } = request;
    try {
        // Check if charger is connected
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send RemoteStartTransaction using correct OCPP 1.6 CALL format
        // MessageTypeId 2 = CALL (request from Central System to Charge Point)
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "RemoteStartTransaction",
            {
                connectorId,
                idTag,
            }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`Remote start sent to charger ${chargerId}, connector ${connectorId}, idTag ${idTag}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in remoteStartTransaction: ${error}`);
        return { status: "Rejected", error: "Failed to send remote start" };
    }
}
/**
 * Send RemoteStopTransaction request to charger
 * OCPP 1.6 CALL format: [2, messageId, "RemoteStopTransaction", payload]
 */
export async function remoteStopTransaction(request) {
    const { chargerId, transactionId } = request;
    try {
        // Check if charger is connected
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send RemoteStopTransaction using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "RemoteStopTransaction",
            { transactionId }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`Remote stop sent to charger ${chargerId}, transaction ${transactionId}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in remoteStopTransaction: ${error}`);
        return { status: "Rejected", error: "Failed to send remote stop" };
    }
}
/**
 * Send GetConfiguration request to charger
 * OCPP 1.6 CALL format: [2, messageId, "GetConfiguration", payload]
 */
export async function getConfiguration(chargerId, key) {
    try {
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send GetConfiguration using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "GetConfiguration",
            { key: key || [] }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`GetConfiguration sent to charger ${chargerId}, key: ${key || "all"}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in getConfiguration: ${error}`);
        return { status: "Rejected" };
    }
}
/**
 * Send ChangeConfiguration request to charger
 * OCPP 1.6 CALL format: [2, messageId, "ChangeConfiguration", payload]
 */
export async function changeConfiguration(chargerId, configurationKey) {
    try {
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send ChangeConfiguration using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "ChangeConfiguration",
            { configurationKey }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`ChangeConfiguration sent to charger ${chargerId}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in changeConfiguration: ${error}`);
        return { status: "Rejected" };
    }
}
/**
 * Send Reset request to charger
 * OCPP 1.6 CALL format: [2, messageId, "Reset", payload]
 */
export async function resetCharger(chargerId, type) {
    try {
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send Reset using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "Reset",
            { type }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`Reset sent to charger ${chargerId}, type: ${type}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in resetCharger: ${error}`);
        return { status: "Rejected" };
    }
}
/**
 * Send UnlockConnector request to charger
 * OCPP 1.6 CALL format: [2, messageId, "UnlockConnector", payload]
 */
export async function unlockConnector(chargerId, connectorId) {
    try {
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send UnlockConnector using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "UnlockConnector",
            { connectorId }
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`Unlock sent to charger ${chargerId}, connector ${connectorId}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in unlockConnector: ${error}`);
        return { status: "Rejected" };
    }
}
/**
 * Send TriggerMessage request to charger
 * OCPP 1.6 CALL format: [2, messageId, "TriggerMessage", payload]
 */
export async function triggerMessage(chargerId, requestedMessage, connectorId) {
    try {
        if (!(await chargerRegistry.isConnectedGlobally(chargerId))) {
            return { status: "Rejected", error: "Charger not connected" };
        }
        // Send TriggerMessage using correct OCPP 1.6 CALL format
        const messageId = generateMessageId();
        const payload = { requestedMessage };
        if (connectorId !== undefined) {
            payload.connectorId = connectorId;
        }
        const message = [
            2, // MessageTypeId: CALL
            messageId,
            "TriggerMessage",
            payload
        ];
        await chargerRegistry.publishCommand(chargerId, message);
        logger.info(`TriggerMessage sent to charger ${chargerId}, message: ${requestedMessage}`);
        return { status: "Accepted" };
    }
    catch (error) {
        logger.error(`Error in triggerMessage: ${error}`);
        return { status: "Rejected" };
    }
}
/**
 * Get list of connected chargers
 */
export function getConnectedChargers() {
    return chargerRegistry.getConnectedChargers();
}
/**
 * Check if a charger is connected
 */
export async function isChargerConnected(chargerId) {
    return chargerRegistry.isConnectedGlobally(chargerId);
}
