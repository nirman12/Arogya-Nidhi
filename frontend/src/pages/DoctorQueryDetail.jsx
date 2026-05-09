import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DoctorSidebar from "../components/DoctorSidebar";
import { ChatBubbleLeftRightIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import "./PatientPortal.css";

const DoctorQueryDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, token, userData } = useContext(AppContext);
  const [query, setQuery] = useState(location.state?.query || null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${token}`, dtoken: token };
        const res = await fetch(`${backendUrl}/api/doctor/queries/${id}`, { headers });
        const data = await res.json().catch(() => null);
        if (!data?.success) throw new Error(data?.message || "Query not found");
        setQuery(data.data || data.query || null);
      } catch (err) {
        setQuery(null);
        setError(err.message || "Failed to load query");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token, backendUrl]);

  const submitAnswer = async () => {
    if (!answer.trim() || !query) return;
    setSubmitting(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        dtoken: token,
      };
      const res = await fetch(`${backendUrl}/api/doctor/queries/${id}/responses`, {
        method: "POST",
        headers,
        body: JSON.stringify({ responseText: answer.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.message || "Failed to post response");
      const created = data.data || data.response || {
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        response_text: answer.trim(),
        doctor: { user: { name: userData?.name || "Doctor" } },
      };
      setQuery((prev) => ({ ...prev, responses: [...(prev?.responses || []), created] }));
      setAnswer("");
    } catch (err) {
      setError(err.message || "Failed to post response");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDateTime = (date) =>
    date ? new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

  const getPatientName = (item) =>
    item?.patient?.user?.name || item?.patient?.users?.name || item?.patient?.name || "Anonymous";

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="pp-btn pp-btn-outline pp-btn-sm" onClick={() => navigate("/doctor-portal/queries")}>
              Back
            </button>
            Patient Query
          </p>

          {loading ? (
            <div className="pp-panel"><div className="pp-stat-label">Loading query...</div></div>
          ) : error && !query ? (
            <div className="pp-panel" style={{ color: "#dc2626" }}>{error}</div>
          ) : query ? (
            <>
              {error && <div className="pp-panel" style={{ color: "#dc2626" }}>{error}</div>}
              <section className="pp-section">
                <div className="pp-panel">
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div className="pp-appointment-icon"><UserCircleIcon style={{ width: 22, height: 22 }} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{query.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--pp-text-muted)", marginBottom: 12 }}>
                        {getPatientName(query)} | {fmtDateTime(query.created_at || query.createdAt)}
                      </div>
                      <div style={{ background: "var(--pp-background)", padding: 12, borderRadius: 6, fontSize: "0.875rem", color: "var(--pp-text-secondary)", lineHeight: 1.7, borderLeft: "3px solid var(--pp-primary)" }}>
                        {query.symptom_text || query.symptomText || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pp-section">
                <h2 className="pp-section-title">Responses ({(query.responses || []).length})</h2>
                {(query.responses || []).length === 0 ? (
                  <div className="pp-appointment-list">
                    <div className="pp-appointment-item"><div className="pp-appointment-title">No responses yet.</div></div>
                  </div>
                ) : (
                  <div className="pp-appointment-list">
                    {(query.responses || []).map((response) => (
                      <div key={response.id} className="pp-appointment-item" style={{ alignItems: "flex-start" }}>
                        <div className="pp-appointment-icon"><ChatBubbleLeftRightIcon style={{ width: 20, height: 20 }} /></div>
                        <div className="pp-appointment-info">
                          <div className="pp-appointment-title">{response.doctor?.user?.name || response.doctor?.users?.name || "Doctor"}</div>
                          <div className="pp-appointment-meta">{fmtDateTime(response.created_at || response.createdAt)}</div>
                          <div style={{ marginTop: 8, fontSize: "0.875rem", color: "var(--pp-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                            {response.response_text || response.responseText}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="pp-section">
                <h2 className="pp-section-title">Post Your Response</h2>
                <div className="pp-ai-container">
                  <div className="pp-chat-area">
                    <textarea
                      rows={5}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "vertical", fontSize: "0.875rem", color: "var(--pp-text-primary)", lineHeight: 1.7 }}
                      placeholder="Write your medical response here..."
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                    />
                  </div>
                  <div className="pp-chat-input-container">
                    <button className="pp-btn pp-btn-primary" onClick={submitAnswer} disabled={submitting || !answer.trim()}>
                      {submitting ? "Posting..." : "Post Response"}
                    </button>
                    <button className="pp-btn pp-btn-outline" onClick={() => setAnswer("")}>Clear</button>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="pp-panel">Query not found.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorQueryDetail;
