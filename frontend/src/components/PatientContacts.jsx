import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PatientContacts = ({ userData, backendUrl, token, loadUserProfileData }) => {
  const [contacts, setContacts] = useState(userData?.emergencyContacts || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ contactName: "", relationship: "", contactPhone: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + "/api/patient/emergency-contacts", newContact, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success("Contact added");
        setShowAdd(false);
        loadUserProfileData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add contact");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      const { data } = await axios.delete(backendUrl + `/api/patient/emergency-contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success("Contact deleted");
        loadUserProfileData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete contact");
    }
  };

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Emergency Contacts</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary text-white px-4 py-2 rounded">{showAdd ? 'Cancel' : 'Add Contact'}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Contact Name *</label>
              <input required type="text" className="border p-2 w-full rounded mt-1" value={newContact.contactName} onChange={e => setNewContact({...newContact, contactName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Relationship *</label>
              <input required type="text" className="border p-2 w-full rounded mt-1" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone *</label>
              <input required type="text" className="border p-2 w-full rounded mt-1" value={newContact.contactPhone} onChange={e => setNewContact({...newContact, contactPhone: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Save Contact</button>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="text-gray-500">No emergency contacts added yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map(contact => (
            <div key={contact.id} className="border p-4 rounded-lg flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{contact.contactName}</h3>
                <p className="text-sm text-gray-600">{contact.relationship}</p>
                <p className="text-sm">{contact.contactPhone}</p>
              </div>
              <button onClick={() => handleDelete(contact.id)} className="text-red-500 text-sm hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientContacts;
