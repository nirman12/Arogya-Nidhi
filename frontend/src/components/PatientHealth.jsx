import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PatientHealth = ({ userData, backendUrl, token, loadUserProfileData }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: userData?.bloodGroup || "",
    height: userData?.height || "",
    weight: userData?.weight || "",
    allergies: userData?.allergies || "",
    chronicConditions: userData?.chronicConditions || ""
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, height: formData.height ? Number(formData.height) : null, weight: formData.weight ? Number(formData.weight) : null };
      const { data } = await axios.patch(backendUrl + "/api/patient/profile/health", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success("Health info updated");
        loadUserProfileData();
        setIsEdit(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update health info");
    }
  };

  return (
    <div className="max-w-xl bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Health Info</h2>
      {!isEdit ? (
        <div className="space-y-4">
          <p><strong>Blood Group:</strong> {userData?.bloodGroup || 'Not provided'}</p>
          <p><strong>Height:</strong> {userData?.height ? `${userData?.height} cm` : 'Not provided'}</p>
          <p><strong>Weight:</strong> {userData?.weight ? `${userData?.weight} kg` : 'Not provided'}</p>
          <p><strong>Allergies:</strong> {userData?.allergies || 'None'}</p>
          <p><strong>Chronic Conditions:</strong> {userData?.chronicConditions || 'None'}</p>
          <button 
            onClick={() => setIsEdit(true)} 
            className="mt-4 bg-primary text-white px-4 py-2 rounded"
          >
            Edit Health Info
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Blood Group</label>
            <input type="text" className="border p-2 w-full rounded mt-1" value={formData.bloodGroup || ''} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Height (cm)</label>
            <input type="number" className="border p-2 w-full rounded mt-1" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Weight (kg)</label>
            <input type="number" className="border p-2 w-full rounded mt-1" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Allergies</label>
            <textarea className="border p-2 w-full rounded mt-1" value={formData.allergies || ''} onChange={e => setFormData({ ...formData, allergies: e.target.value })}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Chronic Conditions</label>
            <textarea className="border p-2 w-full rounded mt-1" value={formData.chronicConditions || ''} onChange={e => setFormData({ ...formData, chronicConditions: e.target.value })}></textarea>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Save</button>
            <button type="button" onClick={() => setIsEdit(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientHealth;
