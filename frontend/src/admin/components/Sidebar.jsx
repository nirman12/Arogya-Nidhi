import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import {
  Squares2X2Icon,
  UsersIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import "../styles/AdminPortal.css";

const adminNavLinks = [
  { to: "/admin-portal/admin/dashboard", Icon: Squares2X2Icon, label: "Dashboard" },
  { to: "/admin-portal/admin/manage-users", Icon: UsersIcon, label: "Manage Users" },
  { to: "/admin-portal/admin/verify-doctors", Icon: ShieldCheckIcon, label: "Verify Doctors" },
  { to: "/admin-portal/admin/system-reports", Icon: DocumentChartBarIcon, label: "System Reports" },
];

const doctorNavLinks = [
  { to: "/admin-portal/doctor/dashboard", Icon: Squares2X2Icon, label: "Dashboard" },
  { to: "/admin-portal/doctor/appointments", Icon: CalendarDaysIcon, label: "My Appointments" },
  { to: "/admin-portal/doctor/profile", Icon: UserCircleIcon, label: "Profile" },
];

const Sidebar = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);

  const navLinks = aToken ? adminNavLinks : doctorNavLinks;

  return (
    <aside className="ap-sidebar">
      {(aToken || dToken) && (
        <nav className="ap-sidebar-nav">
          <ul>
            {navLinks.map(({ to, Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => `ap-nav-link ${isActive ? "ap-nav-link-active" : ""}`}
                >
                  <Icon style={{ width: "18px", height: "18px", flexShrink: 0, strokeWidth: 1.75 }} />
                  <span className="ap-sidebar-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  );
};

export default Sidebar;
