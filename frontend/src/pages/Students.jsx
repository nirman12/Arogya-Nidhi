import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  AcademicCapIcon,
  CubeIcon,
  BeakerIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PhotoIcon,
  HeartIcon,
  LanguageIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import MCQSection from "../components/students/MCQSection";
import OrganViewer from "../components/students/OrganViewer";
import DiagnosticLab from "../components/students/DiagnosticLab";
import MedicineInfo from "../components/students/MedicineInfo";
import FdaLabel from "../components/students/FdaLabel";
import MRI from "../components/students/MRI";
import Pneumonia from "../components/students/Pneumonia";
import DiseaseGlossary from "../components/students/DiseaseGlossary";
import StudentDashboard from "../components/students/StudentDashboard";
import LearningResources from "../components/students/LearningResources";
import "./PatientPortal.css";
import "../components/PatientSidebar.css";
import "./StudentPortal.css";

const NAV = [
  { id: "dashboard", label: "Dashboard",          Icon: HomeIcon },
  { id: "mcq",       label: "MCQs",               Icon: AcademicCapIcon },
  { id: "viewer",    label: "3D Organ Viewer",     Icon: CubeIcon },
  { id: "diag",      label: "Diagnostic Lab",      Icon: BeakerIcon },
  { id: "medicine",  label: "Medicine Info",       Icon: BookOpenIcon },
  { id: "fda",       label: "FDA Drug Labelling",  Icon: DocumentTextIcon },
  { id: "mri",       label: "MRI Viewer",          Icon: PhotoIcon },
  { id: "pneumonia", label: "Pneumonia",           Icon: HeartIcon },
  { id: "glossary",  label: "EN–NE Glossary",      Icon: LanguageIcon },
  { id: "learning",  label: "Learning Resources",  Icon: NewspaperIcon },
];

const NAV_DESC = {
  dashboard: "Overview & activity",
  mcq:       "Practice questions",
  viewer:    "Explore organs",
  diag:      "AI patient simulator",
  medicine:  "Drug information",
  fda:       "Indications, warnings & more",
  mri:       "MRI image prediction",
  pneumonia: "Chest X-ray AI",
  glossary:  "English ↔ Nepali terms",
  learning:  "Articles from doctors",
};

const Students = () => {
  const [active, setActive] = useState("mcq");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // prefer navigation state when present (works even if already on /student-portal)
    const fromState = location?.state?.initialTab;
    const fromStorage = (() => {
      try { return localStorage.getItem('studentPortalInitialTab'); } catch { return null; }
    })();

    const pick = fromState || fromStorage;
    if (!pick) return;
    const exists = NAV.some((n) => n.id === pick);
    if (exists) setActive(pick);

    // clear both sources
    try { localStorage.removeItem('studentPortalInitialTab'); } catch {}
    // replace history to clear state so repeated clicks behave predictably
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const activeNav = NAV.find((n) => n.id === active) || NAV[0];

  const renderActive = () => {
    switch (active) {
      case "dashboard": return <StudentDashboard />;
      case "mcq":       return <MCQSection />;
      case "viewer":    return <OrganViewer />;
      case "diag":      return <DiagnosticLab />;
      case "medicine":  return <MedicineInfo />;
      case "fda":       return <FdaLabel apiKey={import.meta.env.VITE_OPENFDA_KEY} />;
      case "mri":       return <MRI />;
      case "pneumonia": return <Pneumonia />;
      case "glossary":  return <DiseaseGlossary />;
      case "learning":  return <LearningResources />;
      default:          return null;
    }
  };

  return (
    <div className="pp-page">
      <div className="pp-container">
        <aside className="ps-sidebar">
          <ul className="ps-menu-list">
            {NAV.map(({ id, label, Icon }) => (
              <li key={id} className="ps-menu-item">
                <button
                  className={`ps-menu-link${active === id ? " active" : ""}`}
                  onClick={() => setActive(id)}
                >
                  <Icon className="ps-menu-icon" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="pp-main-content">
          <div className="sp-content-header">
            <h2 className="sp-content-title">{activeNav.label}</h2>
            <p className="sp-content-desc">{NAV_DESC[active]}</p>
          </div>

          {renderActive()}
        </main>
      </div>
    </div>
  );
};

export default Students;
