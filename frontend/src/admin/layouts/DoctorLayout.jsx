import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import NotAuthorized from "../pages/auth/NotAuthorized";
import "../styles/AdminPortal.css";

const DoctorLayout = () => (
  <div className="ap-page ap-page-shell">
    <Navbar />
    <div className="ap-content-shell">
      <Sidebar />
      <main className="ap-main-content">
        <Routes>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="*" element={<NotAuthorized />} />
        </Routes>
      </main>
    </div>
  </div>
);

export default DoctorLayout;
