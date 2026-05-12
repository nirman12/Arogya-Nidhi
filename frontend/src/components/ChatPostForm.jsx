import { useState } from "react";

const ChatPostForm = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;

    onSubmit(title.trim(), body.trim());
    setTitle("");
    setBody("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Ask a Question</h3>
        <p className="mt-1 text-sm text-slate-500">
          Share enough detail for a useful reply: duration, severity, and anything you have already tried.
        </p>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Short title (for example, Fever for 2 days)"
        className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Describe your symptoms or question in detail"
        className="mb-3 h-28 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:h-32"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">
          Post Question
        </button>
        <span className="text-xs leading-5 text-slate-500">
          Tip: mention how long it has been happening and whether it is getting worse.
        </span>
      </div>
    </form>
  );
};

export default ChatPostForm;
