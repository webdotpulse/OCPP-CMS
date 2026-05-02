import { Router } from "express";
import {
  getAllChargeGroups,
  getChargeGroupById,
  createChargeGroup,
  updateChargeGroup,
  deleteChargeGroup
} from "./chargeGroups.controller.js";

const router = Router();

router.get("/", getAllChargeGroups);
router.get("/:id", getChargeGroupById);
router.post("/", createChargeGroup);
router.put("/:id", updateChargeGroup);
router.delete("/:id", deleteChargeGroup);

export default router;
