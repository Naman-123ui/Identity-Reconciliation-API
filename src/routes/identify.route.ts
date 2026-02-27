import { Router } from "express";
import { identify } from "../controllers/identify.controller";

const router = Router();

// POST /identify
router.post("/identify", identify);

export default router;
