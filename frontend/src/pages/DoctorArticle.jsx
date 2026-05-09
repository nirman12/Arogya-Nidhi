import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DoctorSidebar from "../components/DoctorSidebar";
import { AppContext } from "../context/AppContext";
import { supabase } from "../lib/supabaseClient";
import "./PatientPortal.css";

const INITIAL_FORM = {
  title: "",
  content: "",
  category: "",
  subcategory: "",
  language: "English",
  is_published: true,
};

const LANGUAGE_OPTIONS = ["English", "Nepali", "Hindi", "Other"];

const DoctorArticle = () => {
  const { token, userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);

  const userId = userData?.id || userData?.user?.id;

  useEffect(() => {
    if (!token) return navigate("/login");
    const role = userData?.role || userData?.user?.role;
    if (role !== "doctor") return navigate("/login");
  }, [token, userData, navigate]);

  const formatDate = useCallback((value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const loadArticles = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return toast.error("Supabase is not configured on the frontend.");
    }
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("learning_resources")
      .select(
        "id, title, content, category, subcategory, language, is_published, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message || "Failed to load articles");
      setArticles([]);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleChange = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) return toast.error("Supabase is not configured on the frontend.");
    if (!userId) return toast.error("User session not found. Please login again.");

    const title = form.title.trim();
    if (!title) return toast.error("Title is required.");

    const payload = {
      user_id: userId,
      title,
      content: form.content.trim() || null,
      category: form.category.trim() || null,
      subcategory: form.subcategory.trim() || null,
      language: form.language.trim() || null,
      is_published: !!form.is_published,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const { data, error } = await supabase
      .from("learning_resources")
      .insert(payload)
      .select(
        "id, title, content, category, subcategory, language, is_published, created_at, updated_at"
      )
      .single();

    if (error) {
      toast.error(error.message || "Failed to publish article");
      setSaving(false);
      return;
    }

    toast.success(payload.is_published ? "Article published" : "Draft saved");
    setArticles((prev) => [data, ...prev]);
    setForm(INITIAL_FORM);
    setSaving(false);
  };

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome">Share your medical knowledge with students</p>

          <section className="pp-section">
            <h2 className="pp-section-title">Write an Article</h2>
            <form className="pp-panel" onSubmit={handleSubmit}>
              <div className="pp-form-grid">
                <div className="pp-form-field">
                  <label className="pp-label">Title</label>
                  <input
                    className="pp-input"
                    value={form.title}
                    onChange={handleChange("title")}
                    placeholder="Enter a clear article title"
                  />
                </div>
                <div className="pp-form-field">
                  <label className="pp-label">Category</label>
                  <input
                    className="pp-input"
                    value={form.category}
                    onChange={handleChange("category")}
                    placeholder="Cardiology, Pediatrics, etc."
                  />
                </div>
                <div className="pp-form-field">
                  <label className="pp-label">Subcategory</label>
                  <input
                    className="pp-input"
                    value={form.subcategory}
                    onChange={handleChange("subcategory")}
                    placeholder="Hypertension, Neonatal care, ..."
                  />
                </div>
                <div className="pp-form-field">
                  <label className="pp-label">Language</label>
                  <select className="pp-select" value={form.language} onChange={handleChange("language")}>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pp-form-field">
                <label className="pp-label">Content</label>
                <textarea
                  className="pp-textarea"
                  rows={8}
                  value={form.content}
                  onChange={handleChange("content")}
                  placeholder="Write your article content here..."
                />
              </div>

              <div className="pp-form-actions">
                <label className="pp-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={handleChange("is_published")}
                  />
                  Publish immediately
                </label>
                <div className="pp-form-actions-right">
                  <button
                    type="button"
                    className="pp-btn pp-btn-secondary"
                    onClick={() => setForm(INITIAL_FORM)}
                    disabled={saving}
                  >
                    Clear
                  </button>
                  <button type="submit" className="pp-btn pp-btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Post Article"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="pp-section">
            <div className="pp-row-between">
              <h2 className="pp-section-title">Your Articles</h2>
              <button className="pp-btn pp-btn-outline pp-btn-sm" onClick={loadArticles}>
                Refresh
              </button>
            </div>

            <div className="pp-table-container">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading articles...</td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No articles yet. Publish your first one above.</td>
                    </tr>
                  ) : (
                    articles.map((article) => (
                      <tr key={article.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{article.title}</div>
                          {article.content ? (
                            <div className="pp-cell-note">
                              {article.content.length > 140
                                ? `${article.content.slice(0, 140)}...`
                                : article.content}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div>{article.category || "—"}</div>
                          {article.subcategory ? (
                            <div className="pp-cell-note">{article.subcategory}</div>
                          ) : null}
                        </td>
                        <td>{article.language || "—"}</td>
                        <td>
                          <span
                            className="pp-status-badge"
                            style={{
                              background: article.is_published ? "#dcfce7" : "#fef9c3",
                              color: article.is_published ? "#166534" : "#854d0e",
                            }}
                          >
                            {article.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td>{formatDate(article.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DoctorArticle;
