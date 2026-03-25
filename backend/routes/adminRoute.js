import express from "express";
import {
  addDoctor,
  adminDashboard,
  appointmentCancelAdmin,
  appointmentsAdmin,
  getAllDoctors,
  loginAdmin,
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";
import { validate } from '../middlewares/validate.js';
import { addDoctorSchema, loginAdminSchema, appointmentIdSchema } from '../validations/admin.validation.js';
import { changeAvailabilitySchema } from '../validations/doctor.validation.js';

const adminRouter = express.Router();

// Route to add a doctor
adminRouter.post("/add-doctor", authAdmin, upload.single("image"), validate(addDoctorSchema), addDoctor);
adminRouter.post("/login", validate(loginAdminSchema), loginAdmin);
adminRouter.get("/all-doctors", authAdmin, getAllDoctors);
adminRouter.post("/change-availability", authAdmin, validate(changeAvailabilitySchema), changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, validate(appointmentIdSchema), appointmentCancelAdmin);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;
