import { useState } from "react";
import MCQSection from "../components/students/MCQSection";
import OrganViewer from "../components/students/OrganViewer";
import DiagnosticLab from "../components/students/DiagnosticLab";
import StudentsSidebar from "../components/students/StudentsSidebar";
import MedicineInfo from "../components/students/MedicineInfo";
import MRI from "../components/students/MRI";
import Pneumonia from "../components/students/Pneumonia";

const Students = () => {
  const [active, setActive] = useState("mcq");

  return (
    <div className="my-8 md:mx-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold">Students Lab</h1>
        <p className="text-sm text-gray-500">Practice MCQs • Explore 3D organs • Diagnose AI patient</p>
      </div>

      <div className="md:flex md:gap-6">
        <div className="md:w-60 mb-6 md:mb-0">
          <StudentsSidebar active={active} setActive={setActive} />
        </div>
        <div className="flex-1">
          {active === 'mcq' && (
            <section>
              <h2 className="text-xl font-medium mb-3">1. MCQ Practice</h2>
              <MCQSection />
            </section>
          )}

          {active === 'viewer' && (
            <section>
              <h2 className="text-xl font-medium mb-3">2. 3D Organ Viewer</h2>
              <OrganViewer />
            </section>
          )}

          {active === 'diag' && (
            <section>
              <h2 className="text-xl font-medium mb-3">3. Diagnostic Lab (AI patient)</h2>
              <DiagnosticLab />
            </section>
          )}

          {active === 'medicine' && (
            <section>
              <h2 className="text-xl font-medium mb-3">Medicine Information</h2>
              <MedicineInfo />
            </section>
          )}

          {active === 'mri' && (
            <section>
              <h2 className="text-xl font-medium mb-3">MRI</h2>
              <MRI />
            </section>
          )}

          {active === 'pneumonia' && (
            <section>
              <h2 className="text-xl font-medium mb-3">Pneumonia</h2>
              <Pneumonia />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
