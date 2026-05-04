import { useState } from "react";
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
<<<<<<< HEAD
import { Link } from "react-router-dom";
=======
import "./PatientPortal.css";
import "../components/PatientSidebar.css";
import "./StudentPortal.css";
>>>>>>> 7288240fb42a353ce19d6ebc95ff513a5b45f2cf

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
};

const Students = () => {
  const [active, setActive] = useState("mcq");

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
      default:          return null;
    }
  };

  return (
    <div className="pp-page">
      <div className="pp-container">
        <aside className="ps-sidebar">
          <div className="ps-menu-title">Tools</div>
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

<<<<<<< HEAD
        <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <nav className="md:col-span-1">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Tools</h3>
              <div className="mt-3 space-y-2">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActive(n.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors duration-150
                      ${active === n.id ? "bg-indigo-50 border border-indigo-100 text-indigo-700" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{n.label}</div>
                      <div className="text-xs text-gray-400">{n.desc}</div>
                    </div>
                    <div className="text-xs text-gray-300">›</div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <section className="md:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-lg min-h-[40vh]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{NAV.find((n) => n.id === active)?.label}</h2>
                  <p className="text-sm text-gray-400">{NAV.find((n) => n.id === active)?.desc}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Link to="/student-portal/health-queries" className="text-indigo-600 font-medium hover:underline">Health Queries</Link>
                  <span>Quick • Minimal • Focused</span>
                </div>
              </div>

              <div className="mt-2">{renderActive()}</div>
            </div>
          </section>
=======
          {renderActive()}
>>>>>>> 7288240fb42a353ce19d6ebc95ff513a5b45f2cf
        </main>
      </div>
    </div>
  );
};

export default Students;
