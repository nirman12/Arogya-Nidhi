import { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PatientSidebar from "../components/PatientSidebar";
import { SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import "./PatientPortalAiAssistant.css";

const INITIAL_MESSAGE = {
  from: "ai",
  text: "Hello! I am your AI Health Assistant. I can help you check symptoms, provide medication information, offer health tips, or assist you in finding the right specialist. How can I help you today?",
};

const PatientPortalAiAssistant = () => {
  const { setToken, backendUrl } = useContext(AppContext);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { from: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const { data } = await axios.post(backendUrl + "/api/ai/diagnose", {
        messages: newMessages.map((m) => ({ text: m.text })),
      });
      if (data.success) {
        setMessages((prev) => [...prev, { from: "ai", text: data.reply }]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get AI response");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="paa-page">
      <header className="paa-header">
        <Link to="/patient-portal" className="paa-logo">
          PATIENT PORTAL
        </Link>

        <nav>
          <ul className="paa-nav-top">
            <li>
              <Link to="/patient-portal">Dashboard</Link>
            </li>
            <li>
              <Link to="/patient-portal/profile">Profile</Link>
            </li>
            <li>
              <a href="#">Settings</a>
            </li>
            <li>
              <button type="button" className="paa-link-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <div className="paa-container">
        <PatientSidebar />

        <main className="paa-main-content">
          <Link to="/patient-portal" className="paa-back-link">
            Back to Dashboard
          </Link>

          <h1 className="paa-page-title">AI Health Assistant</h1>

          <div className="paa-content-grid">
            <div className="paa-chat-container">
              <div className="paa-chat-header">
                <div className="paa-ai-avatar"><SparklesIcon style={{ width: 20, height: 20 }} /></div>
                <div className="paa-ai-info">
                  <h3>AI Health Assistant</h3>
                  <p>{sending ? "Thinking..." : "Online - Ready to help"}</p>
                </div>
              </div>

              <div className="paa-chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`paa-message${msg.from === "user" ? " paa-message-user" : ""}`}>
                    <div className="paa-message-avatar">{msg.from === "user" ? <UserIcon style={{ width: 14, height: 14 }} /> : <SparklesIcon style={{ width: 14, height: 14 }} />}</div>
                    <div className="paa-message-content">{msg.text}</div>
                  </div>
                ))}
                {sending && (
                  <div className="paa-message">
                    <div className="paa-message-avatar"><SparklesIcon style={{ width: 14, height: 14 }} /></div>
                    <div className="paa-message-content">Thinking...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="paa-chat-input-container">
                <input
                  type="text"
                  className="paa-chat-input"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  type="button"
                  className="paa-btn paa-btn-primary"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>

            <div className="paa-side-panel-group">
              <div className="paa-panel">
                <h3 className="paa-panel-title">Quick Actions</h3>

                <button type="button" className="paa-quick-action-btn" onClick={() => handleQuickAction("I want to check my symptoms")}>
                  Symptom Check
                </button>
                <button type="button" className="paa-quick-action-btn" onClick={() => handleQuickAction("I need information about my medication")}>
                  Medication Info
                </button>
                <button type="button" className="paa-quick-action-btn" onClick={() => handleQuickAction("Give me some health tips")}>
                  Health Tips
                </button>
                <button type="button" className="paa-quick-action-btn" onClick={() => handleQuickAction("Help me find the right specialist")}>
                  Find Specialist
                </button>
                <button type="button" className="paa-quick-action-btn paa-quick-action-danger" onClick={() => handleQuickAction("I need emergency help")}>
                  Emergency Help
                </button>
              </div>

              <div className="paa-panel">
                <h3 className="paa-panel-title">Health Insights</h3>

                <div className="paa-insight-item">
                  <div className="paa-insight-label">Conversations</div>
                  <div className="paa-insight-value">{messages.length - 1} messages</div>
                </div>
                <div className="paa-insight-item">
                  <div className="paa-insight-label">Session</div>
                  <div className="paa-insight-value">Active</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientPortalAiAssistant;
