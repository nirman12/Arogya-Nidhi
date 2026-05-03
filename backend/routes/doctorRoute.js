import express from "express";
import {
  appointmentCancel,
  appointmentComplete,
  appointmentsDoctor,
  createHealthQueryResponse,
  doctorDashboard,
  doctorList,
  getHealthQueryDetails,
  getHealthQueries,
  doctorProfile,
  loginDoctor,
  updateDoctorProfile,
} from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";
import { validate } from '../middlewares/validate.js';
import { loginDoctorSchema, updateDoctorProfileSchema, appointmentIdSchema } from '../validations/doctor.validation.js';

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", validate(loginDoctorSchema), loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/complete-appointment", authDoctor, validate(appointmentIdSchema), appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, validate(appointmentIdSchema), appointmentCancel);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, validate(updateDoctorProfileSchema), updateDoctorProfile);
doctorRouter.get("/queries", authDoctor, getHealthQueries);
doctorRouter.get("/queries/:id", authDoctor, getHealthQueryDetails);
doctorRouter.post("/queries/:id/responses", authDoctor, createHealthQueryResponse);

export default doctorRouter;
