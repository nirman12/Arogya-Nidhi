import { useState } from "react";

const ChatPostForm = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit(title.trim(), body.trim());
    setTitle("");
    setBody("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-200 rounded bg-white">
      <h3 className="font-medium mb-2">Ask a Question</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Short title (e.g. Fever for 2 days)"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe your symptoms or question in detail (e.g. temperature, duration, meds tried)"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm h-28 resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <button className="bg-primary text-white px-4 py-2 rounded text-sm">Post Question</button>
        <span className="text-xs text-gray-500">Tip: Add clear details for better answers — स्पष्ट जानकारी राख्नुहोस्</span>
      </div>
    </form>
  );
};

export default ChatPostForm;
