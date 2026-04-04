import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PatientProfile = ({ userData, backendUrl, token, loadUserProfileData }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.user?.name || "",
    email: userData?.user?.email || "",
    phone: userData?.user?.phone || "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.patch(backendUrl + "/api/patient/profile", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success("Profile updated");
        loadUserProfileData();
        setIsEdit(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="max-w-xl bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Basic Profile</h2>
      {!isEdit ? (
        <div className="space-y-4">
          <p><strong>Name:</strong> {userData?.user?.name}</p>
          <p><strong>Email:</strong> {userData?.user?.email}</p>
          <p><strong>Phone:</strong> {userData?.user?.phone}</p>
          <button 
            onClick={() => setIsEdit(true)} 
            className="mt-4 bg-primary text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input 
              type="text" 
              className="border p-2 w-full rounded mt-1" 
              value={formData.name || ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input 
              type="text" 
              className="border p-2 w-full rounded mt-1" 
              value={formData.phone || ''} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
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

export default PatientProfile;
