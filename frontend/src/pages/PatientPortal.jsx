import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import PatientProfile from "../components/PatientProfile";
import PatientHealth from "../components/PatientHealth";
import PatientContacts from "../components/PatientContacts";
import PatientReports from "../components/PatientReports";

const PatientPortal = () => {
  const { userData, backendUrl, token, loadUserProfileData } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    }
  }, [token]);

  if (!userData) {
    return <div className="p-8 text-center text-gray-500\">Loading portal...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Patient Portal</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setActiveTab("profile")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Basic Profile
        </button>
        <button 
          onClick={() => setActiveTab("health")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'health' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Health Info
        </button>
        <button 
          onClick={() => setActiveTab("contacts")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'contacts' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Emergency Contacts
        </button>
        <button 
          onClick={() => setActiveTab("reports")} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'reports' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Medical Reports
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {activeTab === "profile" && <PatientProfile userData={userData} backendUrl={backendUrl} token={token} loadUserProfileData={loadUserProfileData} />}
        {activeTab === "health" && <PatientHealth userData={userData} backendUrl={backendUrl} token={token} loadUserProfileData={loadUserProfileData} />}
        {activeTab === "contacts" && <PatientContacts userData={userData} backendUrl={backendUrl} token={token} loadUserProfileData={loadUserProfileData} />}
        {activeTab === "reports" && <PatientReports backendUrl={backendUrl} token={token} />}
      </div>
    </div>
  );
};

export default PatientPortal;
