import express from "express";
import { diagnose } from "../controllers/aiController.js";
import { validate } from '../middlewares/validate.js';
import { chatSchema } from '../validations/ai.validation.js';


const router = express.Router();

router.post("/diagnose", validate(chatSchema), diagnose);

export default router;
