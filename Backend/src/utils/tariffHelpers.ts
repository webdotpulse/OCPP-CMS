import { prisma } from "../config/database.js";
import { Tariff } from "@prisma/client";

/**
 * Retrieves the specific Tariff assigned to the User for that particular Charger or ChargeGroup.
 */
export async function getTariffForTransaction(
  chargerId: number,
  idTag?: string | null
): Promise<Tariff | null> {
  // 1. Fetch Charger and its relations
  const charger = await prisma.charger.findUnique({
    where: { charger_id: chargerId },
    include: { tariffs: true },
  });

  if (!charger) {
    return prisma.tariff.findFirst();
  }

  // 2. If we have an idTag, find the user and check ChargeGroupUser
  if (idTag) {
    const rfidUser = await prisma.rfidUser.findUnique({
      where: { rfid_tag: idTag },
    });

    if (rfidUser && charger.chargeGroupId) {
      const chargeGroupUser = await prisma.chargeGroupUser.findUnique({
        where: {
          chargeGroupId_userId: {
            chargeGroupId: charger.chargeGroupId,
            userId: rfidUser.owner_id,
          },
        },
        include: { tariff: true },
      });

      if (chargeGroupUser?.tariff) {
        return chargeGroupUser.tariff;
      }
    }
  }

  // 3. Fallback to the Charger's assigned Tariff (if any)
  if (charger.tariffs && charger.tariffs.length > 0) {
    return charger.tariffs[0]; // Assuming one active tariff per charger
  }

  // 4. Default to any existing tariff as a last resort
  return prisma.tariff.findFirst();
}
