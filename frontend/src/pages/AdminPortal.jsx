import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";

const AdminPortal = () => {
  const { token, userData, logout, backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return navigate("/login");
    const role = userData?.role || userData?.user?.role;
    if (role !== "admin") return navigate("/login");
  }, [token, userData, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(backendUrl + "/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setDash(data.dashData || data.dashData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [backendUrl, token]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div>
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={logout}>Logout</button>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {dash && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded shadow">
            <p className="text-sm text-gray-500">Doctors</p>
            <p className="text-2xl font-bold">{dash.doctors}</p>
          </div>
          <div className="p-4 border rounded shadow">
            <p className="text-sm text-gray-500">Patients</p>
            <p className="text-2xl font-bold">{dash.patients}</p>
          </div>
          <div className="p-4 border rounded shadow">
            <p className="text-sm text-gray-500">Appointments</p>
            <p className="text-2xl font-bold">{dash.appointments}</p>
          </div>
        </div>
      )}

      {dash?.latestAppointments && dash.latestAppointments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Latest Appointments</h2>
          <ul className="space-y-2">
            {dash.latestAppointments.map((a) => (
              <li key={a._id || a.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{a.user?.name || a.user?.email || a.userId}</p>
                    <p className="text-sm text-gray-500">{a.slotDate} {a.slotTime}</p>
                  </div>
                  <div className="text-sm text-gray-600">{a.status || (a.cancelled ? 'cancelled' : 'pending')}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
