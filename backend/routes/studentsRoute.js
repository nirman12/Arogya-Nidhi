import express from "express";
import { getMCQs, getMetadata, getHealthQueries, getHealthQueryDetails } from "../controllers/studentsController.js";
import { validate } from '../middlewares/validate.js';
import { getQuestionsSchema } from '../validations/student.validation.js';
import { authenticate, requireRole } from '../middlewares/auth.js';


const router = express.Router();

router.get("/mcqs", validate(getQuestionsSchema), getMCQs);
router.get("/metadata", getMetadata);
router.get("/queries", authenticate, requireRole('student'), getHealthQueries);
router.get("/queries/:id", authenticate, requireRole('student'), getHealthQueryDetails);

export default router;
