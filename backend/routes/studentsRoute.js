import express from "express";
import { getMCQs, getMetadata } from "../controllers/studentsController.js";
import { validate } from '../middlewares/validate.js';
import { getQuestionsSchema } from '../validations/student.validation.js';


const router = express.Router();

router.get("/mcqs", validate(getQuestionsSchema), getMCQs);
router.get("/metadata", getMetadata);

export default router;
