import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { AppContext } from "../context/AppContext";
import "./Appointments.css";

const STATUS_FILTERS = [
  ["all", "All"],
  ["scheduled", "Scheduled"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

const Appointments = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const formatDateString = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeString = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeStatus = (status = "") => String(status || "").toLowerCase();
  const isScheduledStatus = (status) => ["pending", "confirmed", "scheduled"].includes(normalizeStatus(status));

  const getStatusLabel = (status = "") => {
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "Completed";
    if (normalized === "cancelled") return "Cancelled";
    if (normalized === "pending") return "Pending";
    if (normalized === "confirmed") return "Confirmed";
    return status || "Scheduled";
  };

  const getUserAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
        const aDate = new Date(a.scheduled_at || a.scheduledAt || 0).getTime();
        const bDate = new Date(b.scheduled_at || b.scheduledAt || 0).getTime();
        return bDate - aDate;
      });
      setAppointments(sorted);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  const getPaymentState = (appointment) => {
    const payments = Array.isArray(appointment?.payment) ? appointment.payment : [];
    const statuses = payments.map((p) => String(p?.status || "").toUpperCase()).filter(Boolean);
    if (statuses.includes("PAID")) return "PAID";
    if (statuses.includes("INITIATED")) return "INITIATED";
    if (statuses.includes("FAILED")) return "FAILED";
    return "UNPAID";
  };

  const buildFallbackMeetingLink = (appointmentId) => {
    if (!appointmentId) return "";
    const roomName = String(appointmentId).replace(/[^a-zA-Z0-9-]/g, "-");
    return `https://meet.jit.si/arogyanidhi-${roomName}`;
  };

  const getMeetingLink = (appointment) =>
    appointment.meeting_link ||
    appointment.meetingLink ||
    buildFallbackMeetingLink(appointment.id);

  const handlePayClick = (appointmentId) => {
    navigate(`/payment/${appointmentId}`);
  };

  const handleJoinClick = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    } else {
      toast.error("Meeting link not available");
    }
  };

  useEffect(() => {
    getUserAppointments();
  }, [getUserAppointments]);

  const scheduledCount = appointments.filter((appointment) => isScheduledStatus(appointment.status)).length;
  const completedCount = appointments.filter((appointment) => normalizeStatus(appointment.status) === "completed").length;
  const unpaidCount = appointments.filter((appointment) => getPaymentState(appointment) !== "PAID").length;

  const filteredAppointments = appointments.filter((appointment) => {
    const status = normalizeStatus(appointment.status);
    if (statusFilter === "all") return true;
    if (statusFilter === "scheduled") return isScheduledStatus(status);
    return status === statusFilter;
  });

  return (
    <div className="myappt-page">
      <div className="myappt-container">
        <header className="myappt-header">
          <div>
            <h1 className="myappt-title">My Appointments</h1>
            <p className="myappt-subtitle">Track visits, payment status, and meeting links in one place.</p>
          </div>
          <button type="button" className="myappt-btn myappt-btn--outline" onClick={getUserAppointments} disabled={loading}>
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </header>

        <section className="myappt-summary" aria-label="Appointment summary">
          <div className="myappt-summary-card">
            <CalendarDaysIcon className="myappt-summary-icon" />
            <span>Scheduled</span>
            <strong>{scheduledCount}</strong>
          </div>
          <div className="myappt-summary-card">
            <UserCircleIcon className="myappt-summary-icon" />
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="myappt-summary-card">
            <CurrencyDollarIcon className="myappt-summary-icon" />
            <span>Payment due</span>
            <strong>{unpaidCount}</strong>
          </div>
        </section>

        <div className="myappt-filters" aria-label="Filter appointments">
          {STATUS_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`myappt-filter ${statusFilter === key ? "myappt-filter--active" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="myappt-empty">
            <p className="myappt-empty-title">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="myappt-empty">
            <p className="myappt-empty-title">No appointments found</p>
            <p className="myappt-empty-subtitle">Book an appointment or change the filter to see more records.</p>
          </div>
        ) : (
          <div className="myappt-list">
            {filteredAppointments.map((appointment, index) => {
              const doctorAvatar =
                appointment.doctor?.user?.avatar_url ||
                appointment.doctor?.avatar_url ||
                appointment.doctor?.doctor_profile?.avatar_url ||
                "https://via.placeholder.com/96";

              const doctorName =
                appointment.doctor?.user?.name ||
                appointment.doctor?.name ||
                appointment.doctor?.full_name ||
                appointment.doctor?.doctor_profile?.name ||
                appointment.doctor?.doctor_profile?.[0]?.name ||
                "Doctor";

              const specialty =
                appointment.doctor?.specialty ||
                appointment.doctor?.doctor_profile?.specialty ||
                appointment.doctor?.doctor_profile?.[0]?.specialty ||
                "General physician";

              const meetingLink = getMeetingLink(appointment);
              const meetingAvailable = Boolean(meetingLink);
              const paymentState = getPaymentState(appointment);
              const status = normalizeStatus(appointment.status) || "scheduled";

              const scheduledAt = appointment.scheduled_at || appointment.scheduledAt || appointment.appointment_date;
              const dateLabel = formatDateString(scheduledAt);
              const timeLabel = formatTimeString(appointment.scheduled_at || appointment.scheduledAt || appointment.appointment_time);
              const reason = appointment.patient_notes || appointment.reason || appointment.ai_triage_summary;

              return (
                <article className="myappt-card" key={appointment.id || index}>
                  <div className="myappt-card-body">
                    <div className="myappt-avatar" aria-hidden>
                      <img src={doctorAvatar} alt={doctorName} loading="lazy" />
                    </div>

                    <div className="myappt-info">
                      <div className="myappt-top">
                        <div className="myappt-doctor">
                          <h3 className="myappt-doctor-name">{doctorName}</h3>
                          <p className="myappt-specialty">{specialty}</p>
                        </div>
                        <span className={`myappt-badge myappt-badge--${status}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>

                      <dl className="myappt-meta" aria-label="Appointment details">
                        <div className="myappt-meta-item">
                          <dt><CalendarDaysIcon className="myappt-meta-icon" /> Date</dt>
                          <dd>{dateLabel || "-"}</dd>
                        </div>
                        <div className="myappt-meta-item">
                          <dt><ClockIcon className="myappt-meta-icon" /> Time</dt>
                          <dd>{timeLabel || "-"}</dd>
                        </div>
                        <div className="myappt-meta-item">
                          <dt><VideoCameraIcon className="myappt-meta-icon" /> Duration</dt>
                          <dd>{appointment.duration_minutes || 30} minutes</dd>
                        </div>
                        {reason ? (
                          <div className="myappt-meta-item myappt-meta-item--wide">
                            <dt>Reason</dt>
                            <dd>{reason}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>

                    <div className="myappt-side" aria-label="Appointment status">
                      <div className="myappt-pill-group">
                        {paymentState === "PAID" ? (
                          <span className="myappt-pill myappt-pill--success">Payment Completed</span>
                        ) : paymentState === "INITIATED" ? (
                          <span className="myappt-pill myappt-pill--warning">Payment Initiated</span>
                        ) : paymentState === "FAILED" ? (
                          <span className="myappt-pill myappt-pill--danger">Payment Failed</span>
                        ) : (
                          <span className="myappt-pill myappt-pill--muted">Payment Pending</span>
                        )}
                      </div>

                      <div className="myappt-actions">
                        <button
                          type="button"
                          onClick={() => handleJoinClick(meetingLink)}
                          className="myappt-btn myappt-btn--primary"
                          disabled={!meetingAvailable || status === "cancelled"}
                        >
                          {meetingAvailable ? "Join Meeting" : "Meeting Unavailable"}
                        </button>

                        {paymentState !== "PAID" && status !== "cancelled" ? (
                          <button
                            type="button"
                            onClick={() => handlePayClick(appointment.id)}
                            className="myappt-btn myappt-btn--outline"
                          >
                            Pay Now
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
