import { OCPPClient } from "ocpp-ws-io";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export interface SimulatorConfig {
  chargerId: string;
  protocol: "ocpp1.6" | "ocpp2.1";
  type: "AC" | "DC";
  maxPowerKw: number;
}

export type SimulatorState = "Offline" | "Available" | "Preparing" | "Charging" | "Finishing";

export class ChargePointSimulator {
  public config: SimulatorConfig;
  public client: OCPPClient;
  public state: SimulatorState = "Offline";
  public currentTransactionId: number | null = null;
  public energyConsumedWh: number = 0;

  private autoLoopInterval: NodeJS.Timeout | null = null;
  private autoChargingInterval: NodeJS.Timeout | null = null;

  constructor(cfg: SimulatorConfig) {
    this.config = cfg;

    // Convert to lowercase for the URL and ws subprotocol
    const protMap = {
      "ocpp1.6": "1.6",
      "ocpp2.1": "2.1"
    };

    const wsUrl = `ws://localhost:${config.ocppPort}/OCPP/${protMap[cfg.protocol]}/${cfg.chargerId}`;

    this.client = new OCPPClient({
      endpoint: wsUrl,
      protocols: [cfg.protocol],
      identity: cfg.chargerId,
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.client.on("connect", () => {
      logger.info(`Simulator ${this.config.chargerId} connected.`);
      this.state = "Available";
    });

    this.client.on("close", () => {
      logger.info(`Simulator ${this.config.chargerId} disconnected.`);
      this.state = "Offline";
      this.stopAutoMode();
    });

    this.client.on("error", (err: any) => {
      logger.error(`Simulator ${this.config.chargerId} error:`, err);
    });

    this.client.handle("RemoteStartTransaction", async (params: any) => {
      logger.info(`Simulator ${this.config.chargerId} received RemoteStartTransaction`);
      setTimeout(() => this.startTransaction(params.idTag || "SIM-CARD"), 1000);
      return { status: "Accepted" };
    });

    this.client.handle("RemoteStopTransaction", async (params: any) => {
      logger.info(`Simulator ${this.config.chargerId} received RemoteStopTransaction`);
      if (this.currentTransactionId === params.transactionId) {
        setTimeout(() => this.stopTransaction(), 1000);
        return { status: "Accepted" };
      }
      return { status: "Rejected" };
    });

    this.client.handle("Reset", async () => {
      logger.info(`Simulator ${this.config.chargerId} received Reset`);
      return { status: "Accepted" };
    });

    this.client.handle("ChangeAvailability", async () => {
      return { status: "Accepted" };
    });

    this.client.handle("SetChargingProfile", async () => {
      return { status: "Accepted" };
    });

    this.client.handle("ClearChargingProfile", async () => {
      return { status: "Accepted" };
    });

    this.client.handle("TriggerMessage", async (params: any) => {
      return { status: "Accepted" };
    });

    this.client.handle("GetConfiguration", async () => {
      return { configurationKey: [], unknownKey: [] };
    });

    this.client.handle("ChangeConfiguration", async () => {
      return { status: "Accepted" };
    });
  }

  public async connect() {
    if (this.state !== "Offline") return;
    try {
      await this.client.connect();
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} connect error`, err);
    }
  }

  public async disconnect() {
    this.stopAutoMode();
    // Assuming the library provides a close or similar method, or we disconnect via socket logic.
    // Looking at ocpp-ws-io, close() works for WebSocket. We can use client.socket.close() if client.disconnect() is not exposed.
    // If client.socket is not public, we can just clear references and allow garbage collection, but let's check.
    try {
      if ((this.client as any).socket) {
        (this.client as any).socket.close();
      } else if ((this.client as any).close) {
        (this.client as any).close();
      }
    } catch (e) {}

    this.state = "Offline";
  }

  public async sendBootNotification() {
    try {
      await this.client.call("BootNotification", {
        chargePointVendor: "SimVendor",
        chargePointModel: `SimModel-${this.config.type}`,
        firmwareVersion: "1.0.0",
      });
      await this.sendStatusNotification("Available");
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} BootNotification failed`, err);
    }
  }

  public async sendStatusNotification(status: string) {
    try {
      await this.client.call("StatusNotification", {
        connectorId: 1,
        errorCode: "NoError",
        status: status,
      });
      if (status === "Available") this.state = "Available";
      else if (status === "Preparing") this.state = "Preparing";
      else if (status === "Charging") this.state = "Charging";
      else if (status === "Finishing") this.state = "Finishing";
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} StatusNotification failed`, err);
    }
  }

  public async startTransaction(idTag: string) {
    if (this.state === "Charging") return;

    await this.sendStatusNotification("Preparing");

    try {
      const authRes: any = await this.client.call("Authorize", { idTag });
      if (authRes.idTagInfo?.status !== "Accepted") {
        logger.warn(`Simulator ${this.config.chargerId} Auth denied for ${idTag}`);
        await this.sendStatusNotification("Available");
        return;
      }

      const startRes: any = await this.client.call("StartTransaction", {
        connectorId: 1,
        idTag,
        meterStart: this.energyConsumedWh,
        timestamp: new Date().toISOString(),
      });

      this.currentTransactionId = startRes.transactionId;
      await this.sendStatusNotification("Charging");
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} StartTransaction failed`, err);
      await this.sendStatusNotification("Available");
    }
  }

  public async stopTransaction() {
    if (!this.currentTransactionId) return;

    await this.sendStatusNotification("Finishing");

    try {
      await this.client.call("StopTransaction", {
        transactionId: this.currentTransactionId,
        meterStop: Math.floor(this.energyConsumedWh),
        timestamp: new Date().toISOString(),
      });

      this.currentTransactionId = null;
      await this.sendStatusNotification("Available");
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} StopTransaction failed`, err);
    }
  }

  public async sendHeartbeat() {
    try {
      await this.client.call("Heartbeat", {});
    } catch (err) {}
  }

  public async sendMeterValues() {
    if (this.state !== "Charging" || !this.currentTransactionId) return;

    // Simulate power based on config. Add some noise.
    const currentPowerW = (this.config.maxPowerKw * 1000) * (0.8 + Math.random() * 0.2);

    // Add energy for 10 seconds interval (W * h)
    this.energyConsumedWh += currentPowerW * (10 / 3600);

    try {
      await this.client.call("MeterValues", {
        connectorId: 1,
        transactionId: this.currentTransactionId,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              {
                value: Math.floor(this.energyConsumedWh).toString(),
                context: "Sample.Periodic",
                measurand: "Energy.Active.Import.Register",
                unit: "Wh"
              },
              {
                value: Math.floor(currentPowerW).toString(),
                context: "Sample.Periodic",
                measurand: "Power.Active.Import",
                unit: "W"
              }
            ]
          }
        ]
      });
    } catch (err) {
      logger.error(`Simulator ${this.config.chargerId} MeterValues failed`, err);
    }
  }

  public startAutoMode() {
    if (this.autoLoopInterval) return;

    logger.info(`Simulator ${this.config.chargerId} starting auto mode`);

    this.autoLoopInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30s heartbeat

    this.autoChargingInterval = setInterval(() => {
      if (this.state === "Available") {
        // Start charging randomly
        if (Math.random() > 0.5) {
          this.startTransaction("SIM-CARD-" + Math.floor(Math.random() * 100));
        }
      } else if (this.state === "Charging") {
        this.sendMeterValues();

        // Stop charging randomly
        if (Math.random() > 0.9) {
          this.stopTransaction();
        }
      }
    }, 10000); // Check every 10s

    // Kick off
    this.sendBootNotification();
  }

  public stopAutoMode() {
    if (this.autoLoopInterval) clearInterval(this.autoLoopInterval);
    if (this.autoChargingInterval) clearInterval(this.autoChargingInterval);
    this.autoLoopInterval = null;
    this.autoChargingInterval = null;
    logger.info(`Simulator ${this.config.chargerId} stopped auto mode`);
  }
}
