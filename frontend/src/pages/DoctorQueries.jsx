import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DoctorSidebar from "../components/DoctorSidebar";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import "./PatientPortal.css";

const DoctorQueries = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${token}`, dtoken: token };
        const res = await fetch(`${backendUrl}/api/doctor/queries`, { headers });
        const data = await res.json().catch(() => null);
        if (!data?.success) throw new Error(data?.message || "Failed to load queries");
        const payload = data.data || {};
        setQueries(Array.isArray(payload) ? payload : payload.queries || []);
      } catch (err) {
        setQueries([]);
        setError(err.message || "Failed to load queries");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, backendUrl]);

  const fmtDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  const getPatientName = (query) =>
    query?.patient?.user?.name || query?.patient?.users?.name || query?.patient?.name || "Anonymous";

  const filtered = queries.filter(
    (query) =>
      !searchQ ||
      (query.title || "").toLowerCase().includes(searchQ.toLowerCase()) ||
      getPatientName(query).toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome">Patient Queries</p>

          <section className="pp-section">
            <div className="pp-ai-container">
              <div className="pp-ai-header">
                <div className="pp-ai-avatar">
                  <ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="pp-ai-title">Health Query Inbox</div>
                  <div className="pp-ai-subtitle">Respond to patient questions and concerns</div>
                </div>
              </div>
              <input
                className="pp-chat-input"
                style={{ width: "100%" }}
                placeholder="Search by patient name or query title..."
                value={searchQ}
                onChange={(event) => setSearchQ(event.target.value)}
              />
            </div>
          </section>

          <section className="pp-section">
            <h2 className="pp-section-title">Open Queries</h2>
            {loading ? (
              <div className="pp-appointment-list">
                <div className="pp-appointment-item"><div className="pp-appointment-title">Loading queries...</div></div>
              </div>
            ) : error ? (
              <div className="pp-panel" style={{ color: "#dc2626" }}>{error}</div>
            ) : filtered.length === 0 ? (
              <div className="pp-appointment-list">
                <div className="pp-appointment-item"><div className="pp-appointment-title">No queries found.</div></div>
              </div>
            ) : (
              <div className="pp-appointment-list">
                {filtered.map((query) => (
                  <div key={query.id} className="pp-appointment-item">
                    <div className="pp-appointment-icon">
                      <ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} />
                    </div>
                    <div className="pp-appointment-info">
                      <div className="pp-appointment-title">{query.title}</div>
                      <div className="pp-appointment-meta">
                        {getPatientName(query)} | {fmtDate(query.created_at || query.createdAt)} | {query.responses?.length || 0} response{query.responses?.length === 1 ? "" : "s"}
                      </div>
                      {(query.symptom_text || query.symptomText) && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--pp-text-muted)", marginTop: 4 }}>
                          {(query.symptom_text || query.symptomText).slice(0, 100)}
                          {(query.symptom_text || query.symptomText).length > 100 ? "..." : ""}
                        </div>
                      )}
                    </div>
                    <div className="pp-appointment-actions">
                      <span className={`pp-status-badge ${query.isResolved ? "pp-status-resolved" : "pp-status-progress"}`}>
                        {query.isResolved ? "Resolved" : "Open"}
                      </span>
                      <Link to={`/doctor-portal/queries/${query.id}`} state={{ query }}>
                        <button className="pp-btn pp-btn-primary pp-btn-sm">Respond</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default DoctorQueries;
