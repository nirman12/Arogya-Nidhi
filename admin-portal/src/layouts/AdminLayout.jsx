import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/admin/Dashboard";
import AllAppointments from "../pages/admin/AllAppointments";
import AddDoctor from "../pages/admin/AddDoctor";
import DoctorsList from "../pages/admin/DoctorsList";
import NotAuthorized from "../pages/auth/NotAuthorized";

const AdminLayout = () => (
  <div className="bg-[#F8F9FD]">
    <Navbar />
    <div className="flex items-start">
      <Sidebar />
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="all-appointments" element={<AllAppointments />} />
        <Route path="add-doctor" element={<AddDoctor />} />
        <Route path="doctors-list" element={<DoctorsList />} />
        
        <Route path="*" element={<NotAuthorized />} />
      </Routes>
    </div>
  </div>
);

export default AdminLayout;
