import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  TableCellsIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const COLORS = ["#5f6fff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const EMPTY_REPORTS = {
  generatedAt: null,
  overview: {},
  appointments: { stats: {}, weeklyCounts: [], statusTotals: [], specialtyMonthly: [], rows: [] },
  consultations: { stats: {}, monthlyTrend: [], rows: [] },
  triage: { stats: {}, weeklyCounts: [], rows: [] },
  revenue: { stats: {}, monthlyTrend: [], transactions: [] },
  users: { stats: {}, rows: [] },
};

const TABS = [
  { id: "appointment", label: "Appointment Analytics" },
  { id: "consultation", label: "Consultation History" },
  { id: "ai-triage", label: "AI Triage" },
  { id: "revenue", label: "Revenue" },
  { id: "user-activity", label: "User Activity" },
];

const backendUrl = (
  (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim()) ||
  (import.meta.env.DEV ? "http://localhost:3001" : "/_/backend")
).replace(/\/+$/, "");

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatCurrency = (value) => `NPR ${formatNumber(Math.round(Number(value || 0)))}`;
const formatPercent = (value) => `${Number(value || 0).toLocaleString()}%`;

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const badgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("paid") || normalized.includes("resolved")) return "ap-badge-verified";
  if (normalized.includes("confirm") || normalized.includes("progress")) return "ap-badge-in-progress";
  if (normalized.includes("cancel") || normalized.includes("reject") || normalized.includes("unpaid")) return "ap-badge-rejected";
  return "ap-badge-pending";
};

const BarChart = ({ data = [], labels = [], color = COLORS[0], height = 180, w = 500 }) => {
  const values = data.length ? data.map((value) => Number(value) || 0) : [0];
  const W = w;
  const H = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const max = Math.max(...values, 1);
  const slot = cW / values.length;
  const bW = Math.max(8, slot * 0.52);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.top + t * cH;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={pad.left + cW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} fontSize="9" textAnchor="end" fill="#94a3b8">
              {Math.round(max * (1 - t))}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const bH = (v / max) * cH;
        const x = pad.left + i * slot + (slot - bW) / 2;
        const y = pad.top + cH - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bW} height={bH} rx="3" fill={color} opacity="0.85" />
            <text x={x + bW / 2} y={H - 6} fontSize="9" textAnchor="middle" fill="#94a3b8">
              {labels[i] || ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ datasets = [], height = 180, w = 500 }) => {
  const safeDatasets = datasets.length ? datasets : [{ color: COLORS[0], values: [0], labels: [""] }];
  const W = w;
  const H = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const allVals = safeDatasets.flatMap((d) => (d.values || []).map((value) => Number(value) || 0));
  const max = Math.max(...allVals, 1);
  const min = Math.min(...allVals, 0);
  const range = max - min || 1;

  const getPoints = (values = []) =>
    (values.length ? values : [0]).map((value, i, arr) => ({
      x: pad.left + (arr.length === 1 ? cW / 2 : (i / (arr.length - 1)) * cW),
      y: pad.top + cH - (((Number(value) || 0) - min) / range) * cH,
    }));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.top + t * cH;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={pad.left + cW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} fontSize="9" textAnchor="end" fill="#94a3b8">
              {Math.round(max - t * range)}
            </text>
          </g>
        );
      })}
      {safeDatasets.map((dataset, index) => {
        const points = getPoints(dataset.values);
        const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        return (
          <g key={dataset.label || index}>
            <path d={path} fill="none" stroke={dataset.color || COLORS[index % COLORS.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={dataset.color || COLORS[index % COLORS.length]} />
            ))}
          </g>
        );
      })}
      {safeDatasets[0]?.labels?.map((label, i) => {
        const points = getPoints(safeDatasets[0].values);
        return (
          <text key={label || i} x={points[i]?.x || 0} y={H - 6} fontSize="9" textAnchor="middle" fill="#94a3b8">
            {label}
          </text>
        );
      })}
    </svg>
  );
};

const StatCard = ({ label, value, Icon, sub }) => (
  <div className="ap-stat-card">
    <div className="ap-stat-icon">
      <Icon style={{ width: "22px", height: "22px", strokeWidth: 1.75 }} />
    </div>
    <div className="ap-stat-content">
      <p style={{ margin: "0 0 0.2rem", fontSize: "0.6875rem", fontWeight: "700", color: "var(--ap-text-muted)", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: "700", color: "var(--ap-primary)", lineHeight: 1 }}>
        {value}
      </p>
      {sub ? <span style={{ fontSize: "0.75rem", color: "var(--ap-text-secondary)" }}>{sub}</span> : null}
    </div>
  </div>
);

const EmptyRows = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", color: "var(--ap-text-muted)", padding: "1.25rem" }}>
      No report data available for the selected filters.
    </td>
  </tr>
);

const DataTable = ({ columns, rows, renderRow }) => (
  <div className="ap-table" style={{ overflowX: "auto" }}>
    <table>
      <thead>
        <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>{rows.length ? rows.map(renderRow) : <EmptyRows colSpan={columns.length} />}</tbody>
    </table>
  </div>
);

const AppointmentTab = ({ data }) => {
  const weekly = data.weeklyCounts || [];
  const monthly = data.specialtyMonthly || [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Appointments" value={formatNumber(data.stats?.total)} Icon={CalendarDaysIcon} />
        <StatCard label="Completed" value={formatNumber(data.stats?.completed)} Icon={CheckCircleIcon} />
        <StatCard label="Pending" value={formatNumber(data.stats?.pending)} Icon={ClockIcon} />
        <StatCard label="Cancelled" value={formatNumber(data.stats?.cancelled)} Icon={BoltIcon} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <p className="ap-card-title">Appointments by Day</p>
            <span style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)" }}>Last 7 days</span>
          </div>
          <BarChart data={weekly.map((item) => item.count)} labels={weekly.map((item) => item.label)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.625rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--ap-border-light)" }}>
            {(data.statusTotals || []).map((item, i) => (
              <div key={item.status || item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--ap-text-secondary)" }}>{item.label}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--ap-text-primary)", marginLeft: "auto" }}>{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <p className="ap-card-title">Appointments by Specialty</p>
            <span style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)" }}>Monthly trend</span>
          </div>
          <LineChart datasets={monthly} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--ap-border-light)" }}>
            {monthly.map((item, i) => (
              <div key={item.label || i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "24px", height: "3px", borderRadius: "2px", background: item.color || COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--ap-text-secondary)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={["Date", "Doctor", "Patient", "Specialty", "Status", "Payment"]}
        rows={data.rows || []}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{formatDate(row.date)}</td>
            <td>{row.doctor}</td>
            <td>{row.patient}</td>
            <td>{row.specialty}</td>
            <td><span className={`ap-badge ${badgeClass(row.status)}`}>{row.status}</span></td>
            <td><span className={`ap-badge ${badgeClass(row.paymentStatus)}`}>{row.paymentStatus}</span></td>
          </tr>
        )}
      />
    </div>
  );
};

const ConsultationTab = ({ data }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
      <StatCard label="Consultations" value={formatNumber(data.stats?.total)} Icon={ChatBubbleLeftRightIcon} />
      <StatCard label="Avg Duration" value={`${formatNumber(data.stats?.avgDuration)} min`} Icon={ClockIcon} />
      <StatCard label="Completed Rate" value={formatPercent(data.stats?.completedRate)} Icon={CheckCircleIcon} />
      <StatCard label="Revenue" value={formatCurrency(data.stats?.revenue)} Icon={BanknotesIcon} />
    </div>

    <div className="ap-card" style={{ marginBottom: "1.5rem" }}>
      <div className="ap-card-header">
        <p className="ap-card-title">Monthly Consultation Trend</p>
        <span style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)" }}>Last 12 months</span>
      </div>
      <LineChart datasets={data.monthlyTrend || []} height={150} w={900} />
    </div>

    <DataTable
      columns={["Date", "Doctor", "Patient", "Duration", "Type"]}
      rows={data.rows || []}
      renderRow={(row) => (
        <tr key={row.id}>
          <td>{formatDate(row.date)}</td>
          <td>{row.doctor}</td>
          <td>{row.patient}</td>
          <td>{row.duration}</td>
          <td>{row.type}</td>
        </tr>
      )}
    />
  </div>
);

const TriageTab = ({ data }) => {
  const weekly = data.weeklyCounts || [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="AI Decisions" value={formatNumber(data.stats?.total)} Icon={ChartBarIcon} />
        <StatCard label="Resolved Rate" value={formatPercent(data.stats?.resolvedRate)} Icon={CheckCircleIcon} />
        <StatCard label="Avg Confidence" value={formatPercent(data.stats?.avgConfidence)} Icon={BoltIcon} />
        <StatCard label="High Urgency" value={formatNumber(data.stats?.highUrgency)} Icon={ArrowTrendingUpIcon} />
      </div>

      <div className="ap-card" style={{ marginBottom: "1.5rem" }}>
        <div className="ap-card-header">
          <p className="ap-card-title">Weekly AI Triage Volume</p>
          <span style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)" }}>Last 7 days</span>
        </div>
        <BarChart data={weekly.map((item) => item.count)} labels={weekly.map((item) => item.label)} w={900} height={155} />
      </div>

      <DataTable
        columns={["Date", "Patient", "Symptoms", "AI Decision", "Outcome"]}
        rows={data.rows || []}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{formatDate(row.date)}</td>
            <td>{row.patient}</td>
            <td>{row.symptoms}</td>
            <td>{row.decision}</td>
            <td><span className={`ap-badge ${badgeClass(row.outcome)}`}>{row.outcome}</span></td>
          </tr>
        )}
      />
    </div>
  );
};

const RevenueTab = ({ data }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
      <StatCard label="Total Revenue" value={formatCurrency(data.stats?.total)} Icon={BanknotesIcon} />
      <StatCard label="This Month" value={formatCurrency(data.stats?.thisMonth)} Icon={CalendarDaysIcon} />
      <StatCard label="Growth Rate" value={formatPercent(data.stats?.growthRate)} Icon={ArrowTrendingUpIcon} />
      <StatCard label="Paid Bookings" value={formatNumber(data.stats?.paidCount)} Icon={CheckCircleIcon} />
    </div>

    <div className="ap-card" style={{ marginBottom: "1.5rem" }}>
      <div className="ap-card-header">
        <p className="ap-card-title">Monthly Revenue Trend</p>
        <span style={{ fontSize: "0.75rem", color: "var(--ap-text-muted)" }}>Paid payments only</span>
      </div>
      <LineChart datasets={data.monthlyTrend || []} height={150} w={900} />
    </div>

    <DataTable
      columns={["Date", "Patient", "Doctor", "Gateway", "Status", "Amount"]}
      rows={data.transactions || []}
      renderRow={(row) => (
        <tr key={row.id}>
          <td>{formatDate(row.date)}</td>
          <td>{row.patient}</td>
          <td>{row.doctor}</td>
          <td>{row.gateway}</td>
          <td><span className={`ap-badge ${badgeClass(row.status)}`}>{row.status}</span></td>
          <td>{formatCurrency(row.amount)}</td>
        </tr>
      )}
    />
  </div>
);

const UserActivityTab = ({ data }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
      <StatCard label="Total Users" value={formatNumber(data.stats?.totalUsers)} Icon={UsersIcon} />
      <StatCard label="Active Users" value={formatNumber(data.stats?.activeUsers)} Icon={CheckCircleIcon} />
      <StatCard label="New In Range" value={formatNumber(data.stats?.newThisMonth)} Icon={ArrowTrendingUpIcon} />
      <StatCard label="Engagement" value={formatPercent(data.stats?.engagementRate)} Icon={BoltIcon} />
    </div>

    <DataTable
      columns={["User Type", "Total Users", "Active Users", "New In Range", "Engagement Rate"]}
      rows={data.rows || []}
      renderRow={(row) => (
        <tr key={row.role}>
          <td style={{ fontWeight: "600" }}>{row.type}</td>
          <td>{formatNumber(row.total)}</td>
          <td>{formatNumber(row.active)}</td>
          <td>{formatNumber(row.newMonth)}</td>
          <td><span className={`ap-badge ${row.rate >= 80 ? "ap-badge-verified" : "ap-badge-pending"}`}>{formatPercent(row.rate)}</span></td>
        </tr>
      )}
    />
  </div>
);

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const AdminSystemReports = () => {
  const [activeTab, setActiveTab] = useState("appointment");
  const [reportType, setReportType] = useState("appointment");
  const [fromDate, setFromDate] = useState("");
  const [category, setCategory] = useState("All");
  const [reports, setReports] = useState(EMPTY_REPORTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLabel = useMemo(() => TABS.find((tab) => tab.id === activeTab)?.label || "System Reports", [activeTab]);

  const fetchReports = async (nextTab = activeTab) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("aToken") || "";
      const { data } = await axios.get(`${backendUrl}/api/admin/system-reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...(fromDate ? { from: fromDate } : {}),
          ...(category && category !== "All" ? { category } : {}),
        },
      });
      if (data?.success) {
        setReports(data.reports || EMPTY_REPORTS);
        setActiveTab(nextTab);
      } else {
        setError(data?.message || "Failed to load report data");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports("appointment");
  }, []);

  const handleGenerate = () => {
    fetchReports(reportType || activeTab);
  };

  const getCsvRows = () => {
    if (activeTab === "appointment") {
      return [["Date", "Doctor", "Patient", "Specialty", "Status", "Payment"], ...(reports.appointments?.rows || []).map((row) => [formatDate(row.date), row.doctor, row.patient, row.specialty, row.status, row.paymentStatus])];
    }
    if (activeTab === "consultation") {
      return [["Date", "Doctor", "Patient", "Duration", "Type"], ...(reports.consultations?.rows || []).map((row) => [formatDate(row.date), row.doctor, row.patient, row.duration, row.type])];
    }
    if (activeTab === "ai-triage") {
      return [["Date", "Patient", "Symptoms", "AI Decision", "Outcome"], ...(reports.triage?.rows || []).map((row) => [formatDate(row.date), row.patient, row.symptoms, row.decision, row.outcome])];
    }
    if (activeTab === "revenue") {
      return [["Date", "Patient", "Doctor", "Gateway", "Status", "Amount"], ...(reports.revenue?.transactions || []).map((row) => [formatDate(row.date), row.patient, row.doctor, row.gateway, row.status, row.amount])];
    }
    return [["User Type", "Total Users", "Active Users", "New In Range", "Engagement Rate"], ...(reports.users?.rows || []).map((row) => [row.type, row.total, row.active, row.newMonth, `${row.rate}%`])];
  };

  const exportCsv = () => {
    const rows = getCsvRows();
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTab}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderTab = () => {
    if (activeTab === "consultation") return <ConsultationTab data={reports.consultations || EMPTY_REPORTS.consultations} />;
    if (activeTab === "ai-triage") return <TriageTab data={reports.triage || EMPTY_REPORTS.triage} />;
    if (activeTab === "revenue") return <RevenueTab data={reports.revenue || EMPTY_REPORTS.revenue} />;
    if (activeTab === "user-activity") return <UserActivityTab data={reports.users || EMPTY_REPORTS.users} />;
    return <AppointmentTab data={reports.appointments || EMPTY_REPORTS.appointments} />;
  };

  return (
    <div style={{ fontFamily: "Outfit, sans-serif" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <Link
          to="/admin-portal/admin/dashboard"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--ap-text-secondary)", textDecoration: "none", marginBottom: "0.625rem", fontWeight: "500" }}
        >
          <ArrowLeftIcon style={{ width: "14px", height: "14px", strokeWidth: 2.5 }} />
          Back to Dashboard
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: "700", color: "var(--ap-text-primary)" }}>System Reports</h1>
            <p className="ap-list-meta" style={{ margin: "0.35rem 0 0" }}>
              Last updated {reports.generatedAt ? new Date(reports.generatedAt).toLocaleString() : "after generation"}
            </p>
          </div>
          <button className="ap-btn ap-btn-secondary" onClick={() => fetchReports(activeTab)} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowPathIcon style={{ width: "16px", height: "16px" }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="ap-card" style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", alignItems: "center" }}>
          <select
            className="ap-form-select"
            value={reportType}
            onChange={(event) => {
              setReportType(event.target.value);
              setActiveTab(event.target.value);
            }}
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
          <input
            type="date"
            className="ap-form-input"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <select className="ap-form-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All</option>
            <option>Patients</option>
            <option>Doctors</option>
            <option>Students</option>
            <option>Admin</option>
          </select>
          <button className="ap-btn ap-btn-primary" onClick={handleGenerate} disabled={loading} style={{ whiteSpace: "nowrap" }}>
            {loading ? "Generating..." : "Generate"}
          </button>
          <button className="ap-btn ap-btn-secondary" onClick={exportCsv} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
            <TableCellsIcon style={{ width: "16px", height: "16px" }} />
            Export CSV
          </button>
        </div>
        {error ? <p className="ap-list-meta" style={{ color: "var(--ap-danger)", margin: "0.85rem 0 0" }}>{error}</p> : null}
      </div>

      <div style={{ borderBottom: "2px solid var(--ap-border)", marginBottom: "1.75rem", display: "flex", gap: 0, overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setReportType(tab.id);
            }}
            style={{
              padding: "0.75rem 1.125rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--ap-primary)" : "3px solid transparent",
              color: activeTab === tab.id ? "var(--ap-primary)" : "var(--ap-text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: activeTab === tab.id ? "700" : "500",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginBottom: "-2px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.125rem", fontWeight: "700", color: "var(--ap-text-primary)", textTransform: "uppercase" }}>
        {selectedLabel}
      </h2>

      {loading && !reports.generatedAt ? (
        <div className="ap-card"><p className="ap-list-meta">Loading report data...</p></div>
      ) : (
        renderTab()
      )}
    </div>
  );
};

export default AdminSystemReports;
