import { useState } from "react";
import { assets } from "../assets/assets_frontend/assets";

const DoctorIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#059669" />
    <path d="M4 20c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v1H4v-1z" fill="#10B981" opacity="0.2" />
  </svg>
);

const PatientIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="#374151" />
    <path d="M4 20c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v1H4v-1z" fill="#6B7280" opacity="0.08" />
  </svg>
);

const Reply = ({ r }) => (
  <div className={`flex gap-3 items-start p-3 rounded-lg ${r.author === "doctor" ? "bg-green-50 border-l-4 border-green-300" : "bg-gray-50 border border-gray-100"}`}>
    <div className="flex-shrink-0">
      {r.author === "doctor" ? (
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <DoctorIcon />
        </div>
      ) : (
        <img src={assets.profile_pic} alt="patient" className="w-12 h-12 rounded-full object-cover" />
      )}
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">{r.author === "doctor" ? "Dr. (Doctor)" : "Patient"}</div>
          {r.author === "doctor" && <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified</div>}
        </div>
        <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
      </div>
      <p className="mt-2 text-sm text-gray-800">{r.body}</p>
    </div>
  </div>
);

const ChatThread = ({ post, onReply }) => {
  const [reply, setReply] = useState("");

  if (!post) return null;

  return (
    <div className="space-y-4">
      <div className="p-5 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-start gap-4">
          <img src={assets.chats_icon} alt="chat" className="w-12 h-12" />
          <div>
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <div className="text-xs text-gray-400 mt-1">{new Date(post.createdAt).toLocaleString()}</div>
            <p className="mt-3 text-sm text-gray-700">{post.body}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Replies</h3>
        {post.replies.length === 0 && <p className="text-sm text-gray-500">No replies yet.</p>}
        <div className="flex flex-col gap-3">
          {post.replies.map((r) => (
            <Reply key={r.id} r={r} />
          ))}
        </div>
      </div>

      <div className="p-4 border border-gray-100 rounded-lg bg-white">
        <h4 className="font-medium mb-2">Add a reply</h4>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-24 resize-none" placeholder="Write your answer or follow-up question..." />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!reply.trim()) return;
                onReply(post.id, reply.trim(), "doctor");
                setReply("");
              }}
              className="bg-primary text-white px-4 py-2 rounded text-sm"
            >
              Reply as Doctor
            </button>
            <button
              onClick={() => {
                if (!reply.trim()) return;
                onReply(post.id, reply.trim(), "patient");
                setReply("");
              }}
              className="bg-gray-100 text-gray-800 px-3 py-2 rounded text-sm"
            >
              Reply as Patient
            </button>
          </div>
          <span className="text-xs text-gray-500">Tip: Doctor replies are highlighted — चिकित्सकको जवाफ हाइलाइट हुन्छ</span>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
