import { useEffect, useState, useContext } from "react";
import axios from "axios";
import DoctorSidebar from "../components/DoctorSidebar";
import { AppContext } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./PatientPortal.css";

const EarningsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--pp-border)", borderRadius: 6, padding: "8px 12px", boxShadow: "var(--pp-shadow)", fontSize: "0.8125rem" }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--pp-primary)" }}>Rs {payload[0].value.toLocaleString()}</div>
    </div>
  );
};

const DoctorEarnings = () => {
  const { token, backendUrl } = useContext(AppContext);
  const [dash, setDash] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}`, dtoken: token } : {};

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: dashData }, { data: apptData }] = await Promise.all([
          axios.get(backendUrl + "/api/doctor/dashboard", { headers }).catch(() => ({ data: {} })),
          axios.get(backendUrl + "/api/doctor/appointments", { headers }).catch(() => ({ data: {} })),
        ]);
        setDash(dashData?.success ? dashData.dashData : null);
        // Only keep appointments that have at least one PAID payment
        const paid = (apptData?.appointments || apptData?.data?.appointments || [])
          .filter((a) => (a.payment || []).some((p) => p.status === "PAID"));
        setTransactions(paid);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [backendUrl, token]);

  // Use backend-computed monthly earnings (already correct)
  const monthlyData = dash?.monthlyEarnings || [];

  // Helper: get the PAID payment record from an appointment
  const getPaidPayment = (appt) => (appt.payment || []).find((p) => p.status === "PAID");

  const patientName = (appt) =>
    appt?.patient?.users?.name || appt?.patient?.user?.name || appt?.patient_name || "—";

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome">Earnings &amp; Revenue</p>

          <section className="pp-section">
            {loading ? (
              <div className="pp-stats-grid">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="pp-stat-card">
                    <div className="pp-stat-label">Loading...</div>
                    <div className="pp-stat-value">-</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pp-stats-grid">
                <div className="pp-stat-card">
                  <div className="pp-stat-label">Total Earnings</div>
                  <div className="pp-stat-value">Rs {Number(dash?.earning ?? 0).toLocaleString()}</div>
                </div>
                <div className="pp-stat-card">
                  <div className="pp-stat-label">Paid Transactions</div>
                  <div className="pp-stat-value">{transactions.length}</div>
                </div>
              </div>
            )}
          </section>

          <section className="pp-section">
            <h2 className="pp-section-title">Monthly Earnings Trend</h2>
            <div className="pp-panel">
              {monthlyData.length === 0 ? (
                <div className="pp-stat-label" style={{ padding: "1rem", color: "#94a3b8" }}>No monthly earnings data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}k`} width={52} />
                    <Tooltip content={<EarningsTooltip />} cursor={{ fill: "#eff6ff" }} />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((_, index) => (
                        <Cell key={index} fill={index === monthlyData.length - 1 ? "#1e40af" : "#bfdbfe"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="pp-section">
            <h2 className="pp-section-title">Recent Transactions</h2>
            <div className="pp-table-container">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: "center", color: "#94a3b8" }}>No paid transactions yet.</td></tr>
                  ) : transactions.map((appt) => {
                    const payment = getPaidPayment(appt);
                    return (
                      <tr key={appt.id}>
                        <td>{payment?.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(appt.scheduled_at).toLocaleDateString()}</td>
                        <td>{patientName(appt)}</td>
                        <td>Consultation</td>
                        <td>Rs {payment?.amount != null ? Number(payment.amount).toLocaleString() : "—"}</td>
                        <td><span className="pp-status-badge pp-status-resolved">Paid</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DoctorEarnings;
