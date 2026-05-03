import express from "express";
import { getMCQs, getMetadata, getHealthQueries, getHealthQueryDetails } from "../controllers/studentsController.js";
import { validate } from '../middlewares/validate.js';
import { getQuestionsSchema } from '../validations/student.validation.js';
import authUser from '../middlewares/authUser.js';


const router = express.Router();

router.get("/mcqs", validate(getQuestionsSchema), getMCQs);
router.get("/metadata", getMetadata);
router.get("/queries", authUser, getHealthQueries);
router.get("/queries/:id", authUser, getHealthQueryDetails);

export default router;
