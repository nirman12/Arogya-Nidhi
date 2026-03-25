import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  getUserProfile,
  listAppointment,
  loginUser,
  makePayment,
  registerUser,
  updateUserProfile,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";
import { validate } from '../middlewares/validate.js';
import { registerUserSchema, loginUserSchema, updateUserProfileSchema, bookAppointmentSchema, appointmentIdSchema } from '../validations/user.validation.js';

const userRouter = express.Router();

userRouter.post("/register", validate(registerUserSchema), registerUser);
userRouter.post("/login", validate(loginUserSchema), loginUser);

userRouter.get("/get-profile", authUser, getUserProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  validate(updateUserProfileSchema),
  updateUserProfile
);
userRouter.post("/book-appointment", authUser, validate(bookAppointmentSchema), bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, validate(appointmentIdSchema), cancelAppointment);
userRouter.post("/make-payment", authUser, validate(appointmentIdSchema), makePayment);

export default userRouter;
