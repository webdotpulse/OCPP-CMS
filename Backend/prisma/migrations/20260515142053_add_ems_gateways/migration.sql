-- AlterTable
ALTER TABLE "Connector" ALTER COLUMN "connector_name" SET DEFAULT 'Channel 1';

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "idle_fee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "time_fee" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "MailConfig" (
    "id" SERIAL NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EmsGateway" (
    "id" SERIAL NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "auth_token" TEXT NOT NULL,
    "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmsGateway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailTemplate_type_key" ON "MailTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "EmsGateway_gateway_id_key" ON "EmsGateway"("gateway_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmsGateway_auth_token_key" ON "EmsGateway"("auth_token");

-- AddForeignKey
ALTER TABLE "EmsGateway" ADD CONSTRAINT "EmsGateway_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
