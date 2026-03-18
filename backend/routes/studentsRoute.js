import express from "express";
import { getMCQs, getMetadata } from "../controllers/studentsController.js";

const router = express.Router();

router.get("/mcqs", getMCQs);
router.get("/metadata", getMetadata);

export default router;
