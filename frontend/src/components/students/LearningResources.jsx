import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabaseClient";

const LearningResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const loadResources = async () => {
    if (!supabase) {
      setLoading(false);
      return toast.error("Supabase is not configured on the frontend.");
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("learning_resources")
      .select(
        "id, title, content, category, subcategory, language, created_at, user_id, users(name, email)"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message || "Failed to load learning resources");
      setResources([]);
    } else {
      setResources(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set();
    resources.forEach((resource) => {
      if (resource.category) unique.add(resource.category);
    });
    return ["all", ...Array.from(unique)];
  }, [resources]);

  const languages = useMemo(() => {
    const unique = new Set();
    resources.forEach((resource) => {
      if (resource.language) unique.add(resource.language);
    });
    return ["all", ...Array.from(unique)];
  }, [resources]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((item) => {
      const inSearch =
        !query ||
        [item.title, item.content, item.category, item.subcategory]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const inCategory = category === "all" || item.category === category;
      const inLanguage = language === "all" || item.language === language;

      return inSearch && inCategory && inLanguage;
    });
  }, [resources, search, category, language]);

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="sp-section">
      <div className="sp-section-header">
        <div>
          <h3 className="sp-section-title">Learning Resources</h3>
          <p className="sp-content-desc">Articles shared by doctors for deeper learning</p>
        </div>
        <button className="sp-btn-secondary" onClick={loadResources}>
          Refresh
        </button>
      </div>

      <div className="sp-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="sp-row" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="sp-label">Search</label>
            <input
              className="sp-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, category, or keyword"
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="sp-label">Category</label>
            <select className="sp-select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All" : value}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="sp-label">Language</label>
            <select className="sp-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
              {languages.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All" : value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sp-panel">Loading learning resources...</div>
      ) : filtered.length === 0 ? (
        <div className="sp-panel">No published articles found yet.</div>
      ) : (
        <div className="sp-article-grid">
          {filtered.map((item) => {
            const author = item?.users?.name || item?.users?.email || "Doctor";
            const isExpanded = expandedId === item.id;
            const content = item.content || "";
            const preview = content.length > 220 ? `${content.slice(0, 220)}...` : content;

            return (
              <article key={item.id} className="sp-panel sp-article-card">
                <div className="sp-row-between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <h4 className="sp-article-title">{item.title}</h4>
                    <div className="sp-article-meta">
                      {formatDate(item.created_at)} · {author}
                    </div>
                  </div>
                  <button
                    className="sp-btn-secondary"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {isExpanded ? "Hide" : "Read more"}
                  </button>
                </div>

                <p className="sp-article-content">{isExpanded ? content || "No content" : preview || "No content"}</p>

                <div className="sp-article-tags">
                  {item.category ? <span className="sp-tag">{item.category}</span> : null}
                  {item.subcategory ? <span className="sp-tag sp-tag-light">{item.subcategory}</span> : null}
                  {item.language ? <span className="sp-tag sp-tag-outline">{item.language}</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LearningResources;
