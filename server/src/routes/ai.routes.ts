import { Router } from "express";
import { parseText } from "../controllers/ai.controller";

const router = Router();

router.post("/parse", parseText);

export default router;