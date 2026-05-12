import { useState, useRef, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import "../styles/AdminPortal.css";

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken } = useContext(DoctorContext);
  const { logout } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = !!aToken;
  const isDoctor = !!dToken;
  const role = isAdmin ? "Admin" : isDoctor ? "Doctor" : "Portal";
  const initials = isAdmin ? "A" : isDoctor ? "D" : "P";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("ap-sidebar-open", sidebarOpen);
    return () => document.body.classList.remove("ap-sidebar-open");
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setAToken("");
    localStorage.removeItem("aToken");
    setDToken("");
    localStorage.removeItem("dToken");
    await logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="ap-topbar">
        <div className="ap-topbar-brand" style={{ lineHeight: 0 }}>
          <button
            type="button"
            className="ap-menu-button"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <svg className="ap-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img
            className="ap-topbar-logo"
            style={{ cursor: "default" }}
            src={assets.logo}
            alt="ArogyaNidhi"
          />
        </div>

        <div className="ap-topbar-actions">
          <div ref={ref} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((value) => !value)}
              className="ap-role-button"
              style={{ background: open ? "var(--ap-primary-lighter)" : "transparent" }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--ap-primary-lighter)",
                  border: "1px solid var(--ap-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ap-primary)",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>

              <span className="ap-role-label">{role}</span>

              <svg
                style={{
                  width: 12,
                  height: 12,
                  color: "#94a3b8",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  minWidth: 160,
                  zIndex: 200,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.625rem 1rem",
                    background: "transparent",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#dc2626",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="ap-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
