import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
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
const ARTICLE_SELECT =
  "id, title, content, category, subcategory, language, is_published, created_at, updated_at";

const DoctorArticle = () => {
  const { token, userData } = useContext(AppContext);
  const navigate = useNavigate();
  const formSectionRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [deletingArticleId, setDeletingArticleId] = useState(null);

  const userId = userData?.id || userData?.user?.id;
  const isEditing = Boolean(editingArticleId);

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
      .select(ARTICLE_SELECT)
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

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setEditingArticleId(null);
  }, []);

  const handleEdit = (article) => {
    setEditingArticleId(article.id);
    setForm({
      title: article.title || "",
      content: article.content || "",
      category: article.category || "",
      subcategory: article.subcategory || "",
      language: LANGUAGE_OPTIONS.includes(article.language) ? article.language : "English",
      is_published: !!article.is_published,
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (article) => {
    if (!supabase) return toast.error("Supabase is not configured on the frontend.");
    if (!userId) return toast.error("User session not found. Please login again.");

    const confirmed = window.confirm(`Delete "${article.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingArticleId(article.id);
    const { error } = await supabase
      .from("learning_resources")
      .delete()
      .eq("id", article.id)
      .eq("user_id", userId);

    if (error) {
      toast.error(error.message || "Failed to delete article");
      setDeletingArticleId(null);
      return;
    }

    toast.success("Article deleted");
    setArticles((prev) => prev.filter((item) => item.id !== article.id));
    if (editingArticleId === article.id) resetForm();
    setDeletingArticleId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) return toast.error("Supabase is not configured on the frontend.");
    if (!userId) return toast.error("User session not found. Please login again.");

    const title = form.title.trim();
    if (!title) return toast.error("Title is required.");

    const payload = {
      title,
      content: form.content.trim() || null,
      category: form.category.trim() || null,
      subcategory: form.subcategory.trim() || null,
      language: form.language.trim() || null,
      is_published: !!form.is_published,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const request = isEditing
      ? supabase
          .from("learning_resources")
          .update(payload)
          .eq("id", editingArticleId)
          .eq("user_id", userId)
      : supabase.from("learning_resources").insert({ ...payload, user_id: userId });

    const { data, error } = await request.select(ARTICLE_SELECT).single();

    if (error) {
      toast.error(error.message || `Failed to ${isEditing ? "update" : "publish"} article`);
      setSaving(false);
      return;
    }

    toast.success(
      isEditing ? "Article updated" : payload.is_published ? "Article published" : "Draft saved"
    );
    setArticles((prev) =>
      isEditing ? prev.map((article) => (article.id === editingArticleId ? data : article)) : [data, ...prev]
    );
    resetForm();
    setSaving(false);
  };

  return (
    <div className="pp-page">
      <div className="pp-container">
        <DoctorSidebar />
        <main className="pp-main-content">
          <p className="pp-welcome">Share your medical knowledge with students</p>

          <section className="pp-section" ref={formSectionRef}>
            <h2 className="pp-section-title">{isEditing ? "Edit Article" : "Write an Article"}</h2>
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
                    onClick={resetForm}
                    disabled={saving}
                  >
                    {isEditing ? "Cancel Edit" : "Clear"}
                  </button>
                  <button type="submit" className="pp-btn pp-btn-primary" disabled={saving}>
                    {saving ? "Saving..." : isEditing ? "Update Article" : "Post Article"}
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>Loading articles...</td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No articles yet. Publish your first one above.</td>
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
                          <div>{article.category || "-"}</div>
                          {article.subcategory ? (
                            <div className="pp-cell-note">{article.subcategory}</div>
                          ) : null}
                        </td>
                        <td>{article.language || "-"}</td>
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
                        <td>
                          <div className="pp-table-actions">
                            <button
                              type="button"
                              className="pp-btn pp-btn-outline pp-btn-sm pp-btn-icon"
                              onClick={() => handleEdit(article)}
                              disabled={saving || deletingArticleId === article.id}
                            >
                              <PencilSquareIcon style={{ width: 14, height: 14 }} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="pp-btn pp-btn-danger pp-btn-sm pp-btn-icon"
                              onClick={() => handleDelete(article)}
                              disabled={saving || deletingArticleId === article.id}
                            >
                              <TrashIcon style={{ width: 14, height: 14 }} />
                              {deletingArticleId === article.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
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
