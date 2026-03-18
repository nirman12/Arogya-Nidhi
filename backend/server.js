import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import aiRouter from "./routes/aiRoute.js";
import studentsRouter from "./routes/studentsRoute.js";

// app config
const app = express();
const port = process.env.PORT || 8000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/students", studentsRouter);

// default route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Mahmud's Doctor Appointment Booking System API 🚀",
    status: "API is running successfully",
    // Local dev URLs — change to your dev ports if different
    frontend: "http://localhost:5173",
    admin_portal: "http://localhost:5174",
    portfolio: "https://mahmudalam.com/",
    documentation: "http://localhost:8000/api-docs",
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.listen(port, () => console.log(`Server is running on PORT ${port}`));
