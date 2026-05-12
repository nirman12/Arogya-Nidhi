import { useEffect, useMemo, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ChatPostForm from "../components/ChatPostForm";
import DiscussionCard from "../components/DiscussionCard";
import PageChanger from "../components/PageChanger";

const STORAGE_KEY = "arogyanidhi_chat_posts";

const sampleData = [
  {
    id: "p1",
    title: "How can I reduce fever at home?",
    body: "I've had a fever for 2 days. What can I try at home before visiting?",
    author: "patient",
    category: "General Health",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    votes: 12,
    views: 240,
    replies: [
      {
        id: "r1",
        body: "Stay hydrated, take paracetamol as per dose. If fever lasts more than 3 days or becomes severe, visit a doctor.",
        author: "doctor",
        createdAt: Date.now() - 1000 * 60 * 60 * 23,
      },
    ],
  },
  {
    id: "p2",
    title: "Skin rash after using cream",
    body: "I developed a rash after applying an OTC cream. What should I do?",
    author: "patient",
    category: "Dermatology",
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    votes: 3,
    views: 86,
    replies: [],
  },
  {
    id: "p3",
    title: "Best diet for high cholesterol?",
    body: "Looking for dietary changes to reduce cholesterol levels.",
    author: "student",
    category: "Nutrition",
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    votes: 6,
    views: 140,
    replies: [{ id: "r2", body: "Focus on fiber and healthy fats.", author: "doctor", createdAt: Date.now() }],
  },
];

const categories = [
  "All",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "General Health",
  "Nutrition",
  "Mental Health",
];

const subFilterOptions = [
  { key: "Hot", icon: FireIcon },
  { key: "New", icon: ClockIcon },
  { key: "Top", icon: TrophyIcon },
  { key: "Trending", icon: SparklesIcon },
];

const Chat = () => {
  const [posts, setPosts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : sampleData;
    } catch {
      return sampleData;
    }
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("new");
  const [chip, setChip] = useState("All");
  const [subFilter, setSubFilter] = useState("Hot");
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);

  const perPage = 5;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // Ignore storage failures and keep the forum usable.
    }
  }, [posts]);

  const filtered = useMemo(() => {
    let list = posts.slice();

    if (category !== "All") {
      list = list.filter((post) => post.category === category);
    }

    if (chip !== "All") {
      list = list.filter((post) => post.category === chip || post.category?.includes(chip));
    }

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(needle));
    }

    if (subFilter === "Hot") list = list.sort((left, right) => (right.votes || 0) - (left.votes || 0));
    else if (subFilter === "New") list = list.sort((left, right) => right.createdAt - left.createdAt);
    else if (subFilter === "Top") list = list.sort((left, right) => (right.replies?.length || 0) - (left.replies?.length || 0));
    else if (subFilter === "Trending") list = list.sort((left, right) => (right.views || 0) - (left.views || 0));

    if (sort === "old") list = list.reverse();

    return list;
  }, [category, chip, posts, query, sort, subFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => {
    const answered = posts.filter((post) => (post.replies?.length || 0) > 0).length;
    const uniqueCategories = new Set(posts.map((post) => post.category).filter(Boolean)).size;

    return [
      { label: "Total discussions", value: posts.length },
      { label: "Answered posts", value: answered },
      { label: "Categories", value: uniqueCategories },
    ];
  }, [posts]);

  const addPost = (title, body) => {
    const selectedCategory =
      category !== "All" ? category : chip !== "All" ? chip : "General Health";

    const newPost = {
      id: `p${Date.now()}`,
      title,
      body,
      author: "patient",
      category: selectedCategory,
      createdAt: Date.now(),
      replies: [],
      votes: 0,
      views: 0,
    };

    setPosts((previous) => [newPost, ...previous]);
    setPage(1);
    setShowComposer(false);
  };

  const handleView = (post) => {
    setPosts((previous) =>
      previous.map((item) =>
        item.id === post.id ? { ...item, views: (item.views || 0) + 1 } : item
      )
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVote = (id, delta) => {
    setPosts((previous) =>
      previous.map((post) =>
        post.id === id ? { ...post, votes: (post.votes || 0) + delta } : post
      )
    );
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setChip("All");
    setSort("new");
    setSubFilter("Hot");
    setPage(1);
  };

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(filtered.length, page * perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-sky-900 to-primary px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
              Community chat
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Health Discussion Forum
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100/85 sm:text-base">
              Ask practical health questions, scan active threads, and keep the conversation clear on every screen size.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
                >
                  <div className="text-2xl font-semibold">{item.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/70">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:hidden">
            <button
              type="button"
              onClick={() => setShowComposer((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              {showComposer ? <XMarkIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}
              {showComposer ? "Hide composer" : "Create New Post"}
            </button>
          </div>
        </div>
      </section>

      {showComposer && (
        <section className="mt-6 xl:hidden">
          <ChatPostForm onSubmit={addPost} />
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search discussions"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-auto"
              >
                <option>All</option>
                {categories
                  .filter((item) => item !== "All")
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-auto"
              >
                <option value="new">Newest first</option>
                <option value="old">Oldest first</option>
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setChip(item);
                    setCategory("All");
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    chip === item
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {subFilterOptions.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSubFilter(key);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      subFilter === key
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {key}
                  </button>
                ))}
              </div>

              <div className="text-sm text-slate-500">
                {filtered.length === 0
                  ? "No discussions matched your filters."
                  : `Showing ${showingFrom}-${showingTo} of ${filtered.length}`}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {pageItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-base font-medium text-slate-700">No discussions found.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try another category or create a new post to start the conversation.
                  </p>
                </div>
              ) : (
                pageItems.map((post) => (
                  <DiscussionCard key={post.id} post={post} onView={handleView} onVote={handleVote} />
                ))
              )}
            </div>

            <PageChanger
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-6"
            />
          </section>
        </div>

        <aside className="hidden space-y-4 xl:block">
          <div className="xl:sticky xl:top-6 xl:space-y-4">
            <ChatPostForm onSubmit={addPost} />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Posting Tips
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Use a short title that names the symptom or concern.</li>
                <li>Add timing, severity, and anything that makes it better or worse.</li>
                <li>Keep emergency symptoms out of the forum and seek urgent care instead.</li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Chat;
