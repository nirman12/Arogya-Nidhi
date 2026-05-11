import { useState, useContext } from "react";
import axios from "axios";
import DoctorSidebar from "../components/DoctorSidebar";
import { AppContext } from "../context/AppContext";
import "./PatientPortal.css";

const PROFILE_FIELDS = [
  { label: "Date of Birth", key: "date_of_birth" },
  { label: "Blood Group", key: "blood_group" },
  { label: "Gender", key: "gender" },
  { label: "Medical History", key: "medical_history" },
  { label: "Allergies", key: "allergies" },
  { label: "Contact", key: "phone" },
];

const TABS = [
  { key: "consultations", label: "Consultations" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "labReports", label: "Lab Reports" },
];

const DoctorPatientHistory = () => {
  const { token, backendUrl } = useContext(AppContext);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("consultations");

  const headers = token ? { Authorization: `Bearer ${token}`, dtoken: token } : {};

  const search = async () => {
    if (!patientId.trim()) {
      setError("Enter patient ID, name, or email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const url = `${backendUrl}/api/doctor/patient/${encodeURIComponent(patientId.trim())}/history`;
      const { data } = await axios.get(url, { headers });
      if (!data?.success) throw new Error(data?.message || "Could not fetch patient data");
      const payload = data.data || data;
      setProfile(payload.profile || payload.patient || null);
      setConsultations(payload.consultations || []);
      setPrescriptions(payload.prescriptions || []);
      setLabReports(payload.labReports || payload.reports || []);
      setActiveTab("consultations");
    } catch (err) {
      setProfile(null);
      setConsultations([]);
      setPrescriptions([]);
      setLabReports([]);
      setError(err?.response?.data?.message || err.message || "Could not fetch patient data.");
    } finally {
      setLoading(false);
    }
  };

  const patientName = profile?.name || profile?.users?.name || profile?.user?.name || "Patient";

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome">Patient History</p>

          <section className="pp-section">
            <div className="pp-panel">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="pp-chat-input"
                  placeholder="Enter patient ID, name, or email"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && search()}
                />
                <button type="button" className="pp-btn pp-btn-primary" onClick={search} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
              {error && <div style={{ color: "#dc2626", marginTop: 8, fontSize: "0.875rem" }}>{error}</div>}
            </div>
          </section>

          {profile ? (
            <>
              <section className="pp-section">
                <div className="pp-panel">
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ width: 100, height: 100, background: "var(--pp-primary-lighter)", border: "1px solid var(--pp-primary-light)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pp-primary)", fontWeight: 700, fontSize: 36 }}>
                        {patientName.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 700 }}>{patientName}</div>
                      <div style={{ color: "var(--pp-text-secondary)", fontSize: "0.8125rem" }}>ID: {profile.id || "-"}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 12 }}>
                        <div className="pp-iot-item" style={{ flexDirection: "column", alignItems: "flex-start", borderColor: "var(--pp-primary-light)", background: "var(--pp-primary-lighter)" }}>
                          <div className="pp-panel-title" style={{ marginBottom: 4 }}>Medical History</div>
                          <div style={{ fontWeight: 700, lineHeight: 1.6 }}>{profile.medical_history || "No medical history recorded"}</div>
                        </div>
                        <div className="pp-iot-item" style={{ flexDirection: "column", alignItems: "flex-start", borderColor: "#fde68a", background: "#fffbeb" }}>
                          <div className="pp-panel-title" style={{ marginBottom: 4 }}>Allergies</div>
                          <div style={{ fontWeight: 700, lineHeight: 1.6 }}>{profile.allergies || "No allergies recorded"}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                        {PROFILE_FIELDS.map(({ label, key }) => (
                          <div key={key} className="pp-iot-item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                            <div className="pp-panel-title" style={{ marginBottom: 2 }}>{label}</div>
                            <div style={{ fontWeight: 600 }}>{profile[key] || "-"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pp-section">
                <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "2px solid var(--pp-border)", paddingBottom: 4 }}>
                  {TABS.map((tab) => (
                    <button key={tab.key} className={`pp-btn pp-btn-sm ${activeTab === tab.key ? "pp-btn-primary" : "pp-btn-outline"}`} onClick={() => setActiveTab(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "consultations" && (
                  <div>
                    <h2 className="pp-section-title">Consultation History</h2>
                    <div className="pp-appointment-list">
                      {consultations.length === 0 ? (
                        <div className="pp-appointment-item"><div className="pp-appointment-title">No consultations found.</div></div>
                      ) : consultations.map((consultation) => (
                        <div key={consultation.id} className="pp-appointment-item">
                          <div className="pp-appointment-info">
                            <div className="pp-appointment-title">{consultation.diagnosis || consultation.status || "Consultation"}</div>
                            <div className="pp-appointment-meta">{consultation.date || consultation.scheduled_at || ""}</div>
                            {(consultation.notes || consultation.doctor_notes) && (
                              <div style={{ fontSize: "0.8125rem", color: "var(--pp-text-secondary)", marginTop: 4 }}>
                                {consultation.notes || consultation.doctor_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "prescriptions" && (
                  <div>
                    <h2 className="pp-section-title">Prescription History</h2>
                    <div className="pp-table-container">
                      <table className="pp-table">
                        <thead>
                          <tr><th>Date</th><th>Diagnosis</th><th>Prescription</th><th>Follow Up</th></tr>
                        </thead>
                        <tbody>
                          {prescriptions.length === 0 ? (
                            <tr><td colSpan="4">No prescriptions found.</td></tr>
                          ) : prescriptions.map((prescription) => (
                            <tr key={prescription.id}>
                              <td>{prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : "-"}</td>
                              <td>{prescription.diagnosis || "-"}</td>
                              <td>{prescription.prescription || "-"}</td>
                              <td>{prescription.followup_date || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "labReports" && (
                  <div>
                    <h2 className="pp-section-title">Laboratory Reports</h2>
                    <div className="pp-appointment-list">
                      {labReports.length === 0 ? (
                        <div className="pp-appointment-item"><div className="pp-appointment-title">No lab reports found.</div></div>
                      ) : labReports.map((report) => (
                        <div key={report.id} className="pp-appointment-item">
                          <div className="pp-appointment-info">
                            <div className="pp-appointment-title">{report.title || report.test_type || "Lab Report"}</div>
                            <div className="pp-appointment-meta">{report.created_at || report.recorded_at || ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="pp-section">
              <div className="pp-panel">Search for a patient to view real history records.</div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorPatientHistory;
