-- CreateTable
CREATE TABLE "EmsTelemetryRecord" (
    "id" SERIAL NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "solar_kw" DOUBLE PRECISION NOT NULL,
    "battery_kw" DOUBLE PRECISION NOT NULL,
    "grid_kw" DOUBLE PRECISION NOT NULL,
    "house_kw" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmsTelemetryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmsTelemetryRecord_gateway_id_timestamp_idx" ON "EmsTelemetryRecord"("gateway_id", "timestamp");

-- AddForeignKey
ALTER TABLE "EmsTelemetryRecord" ADD CONSTRAINT "EmsTelemetryRecord_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "EmsGateway"("gateway_id") ON DELETE CASCADE ON UPDATE CASCADE;
