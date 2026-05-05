import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const AIBooking = () => {
  const { backendUrl, token, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("");

  const userId = useMemo(() => userData?.id || userData?.user?.id || "", [userData]);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please describe your symptoms first");
      return;
    }

    setLoading(true);
    setBookingStatus("");

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/ai-booking`,
        { message: trimmed, userId },
        { headers }
      );

      if (data?.success) {
        setAiResponse(data.data);
        toast.success("AI analysis completed");
      } else {
        toast.error(data?.message || "Unable to analyze symptoms");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Unable to analyze symptoms";
      toast.error(errorMessage);
      setBookingStatus(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!aiResponse?.doctor?.id || !aiResponse?.slot?.id) {
      toast.error("Please run analysis first");
      return;
    }

    setLoading(true);
    setBookingStatus("");

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/confirm-booking`,
        {
          userId,
          doctorId: aiResponse.doctor.id,
          slotId: aiResponse.slot.id,
          symptoms: message.trim(),
        },
        { headers }
      );

      if (data?.success) {
        setBookingStatus("Appointment booked successfully");
        toast.success("Appointment booked successfully");
      } else {
        toast.error(data?.message || "Booking failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Booking failed";
      toast.error(errorMessage);
      setBookingStatus(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg border border-slate-200 p-6 md:p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI Booking</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Describe your symptoms</h1>
          <p className="mt-2 text-sm text-slate-600">The assistant will suggest a doctor and the earliest available slot.</p>
        </div>

        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder='Example: "I have fever and headache"'
            className="w-full min-h-32 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
              Analyze
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Go Back
            </button>
          </div>

          {aiResponse && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <p className="text-base font-semibold text-slate-900">{aiResponse.message}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-700">
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <span className="block text-xs uppercase tracking-wider text-slate-500">Doctor</span>
                  <span className="mt-1 block font-semibold">{aiResponse.doctor?.name || 'Doctor'}</span>
                  <span className="block text-slate-600">{aiResponse.doctor?.specialization || 'General Medicine'}</span>
                </div>

                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <span className="block text-xs uppercase tracking-wider text-slate-500">Slot</span>
                  <span className="mt-1 block font-semibold">
                    {aiResponse.slot?.dateTime ? new Date(aiResponse.slot.dateTime).toLocaleString() : 'Not available'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                  Confirm Booking
                </button>

                {bookingStatus && <p className="text-sm font-medium text-slate-700">{bookingStatus}</p>}
              </div>

              <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(aiResponse.aiData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBooking;