import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PatientReports = ({ backendUrl, token }) => {
  const [reports, setReports] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ title: "", category: "blood_test", notes: "" });
  const [file, setFile] = useState(null);
  const validCategories = ['blood_test', 'x_ray', 'mri', 'ct_scan', 'prescription', 'other'];

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/patient/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setReports(data.data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Select a document type to upload");

    const dataForm = new FormData();
    dataForm.append("report_doc", file);
    dataForm.append("title", formData.title);
    dataForm.append("category", formData.category);
    if (formData.notes) dataForm.append("notes", formData.notes);

    try {
      const { data } = await axios.post(backendUrl + "/api/patient/reports", dataForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      if (data.success) {
        toast.success("Report uploaded");
        setShowUpload(false);
        setFile(null);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload report");
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await axios.get(backendUrl + `/api/patient/reports/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'report.pdf');
      document.body.appendChild(link);
      link.click();
    } catch(err) {
      toast.error("Download failed");
    }
  };

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Medical Reports</h2>
        <button onClick={() => setShowUpload(!showUpload)} className="bg-primary text-white px-4 py-2 rounded">
          {showUpload ? 'Cancel' : 'Upload Report'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Title *</label>
              <input required type="text" className="border p-2 w-full rounded mt-1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Category *</label>
              <select className="border p-2 w-full rounded mt-1" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {validCategories.map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Notes</label>
              <textarea className="border p-2 w-full rounded mt-1" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">File *</label>
              <input type="file" required className="border p-2 w-full rounded mt-1" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Upload</button>
        </form>
      )}

      {reports.length === 0 ? (
        <p className="text-gray-500">No reports found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <div key={report.id} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold">{report.title}</h3>
                <p className="text-xs text-gray-400">Category: {report.category.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600 mt-1">{(report.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => handleDownload(report.id, report.fileName)} className="text-primary hover:underline text-sm font-semibold">
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientReports;
