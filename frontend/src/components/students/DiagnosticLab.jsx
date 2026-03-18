import { useState } from "react";
import axios from "axios";

const DiagnosticLab = () => {
  const [conversation, setConversation] = useState([
    { role: "system", text: "You are a mock patient. Answer questions about your symptoms." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "student", text: input.trim() };
    const newConv = [...conversation, userMsg];
    setConversation(newConv);
    setInput("");
    setLoading(true);
    try {
      // POST to backend to get mock AI patient reply / diagnosis. Replace with Gemini integration later.
      const { data } = await axios.post("/api/ai/diagnose", { messages: newConv });
      setConversation((c) => [...c, { role: "patient", text: data.reply }]);
    } catch (err) {
      setConversation((c) => [...c, { role: "system", text: "Error contacting AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">Interact with an AI patient. The AI will role-play as a patient; your task is to ask questions and then submit a diagnosis. Provide Gemini credentials to enable real model responses.</p>

      <div className="space-y-3 mb-3">
        {conversation.map((m, i) => (
          <div key={i} className={`p-3 rounded ${m.role === 'patient' ? 'bg-gray-50' : m.role==='system' ? 'bg-yellow-50' : 'bg-white'} border border-gray-100`}>
            <div className="text-xs text-gray-500 mb-1">{m.role.toUpperCase()}</div>
            <div className="text-sm text-gray-800">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the patient..." className="flex-1 border border-gray-300 rounded px-3 py-2" />
        <button onClick={sendMessage} disabled={loading} className="bg-primary text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default DiagnosticLab;
