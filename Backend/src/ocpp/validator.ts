import Ajv from "ajv";
import addFormats from "ajv-formats";
import { Ocpp16Schemas } from "ocpp-standard-schema";
import { logger } from "../utils/logger.js";

const ajv = new Ajv({ strict: false });
addFormats(ajv);

/**
 * Validates incoming OCPP payloads against standard JSON schemas.
 * Currently supports OCPP 1.6 in a permissive, warning-only mode.
 */
export function validateOcppMessage(actionName: string, payload: any, protocol: string): void {
  try {
    // Only validate OCPP 1.6 messages for now
    if (protocol !== "ocpp1.6") {
      return;
    }

    const schemaKey = `${actionName}Request`;
    const schema = (Ocpp16Schemas as any)[schemaKey];

    if (!schema) {
      // Schema not found for the given action, skip validation
      return;
    }

    const valid = ajv.validate(schema, payload);

    if (!valid) {
      const errorText = ajv.errorsText(ajv.errors, { dataVar: 'payload' });
      logger.warn(`Schema Violation [Warning Only] for ${actionName}: ${errorText}`);
    }
  } catch (error) {
    logger.error(`Error during OCPP payload validation for ${actionName}: ${error}`);
  }
}
