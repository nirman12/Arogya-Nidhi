import { useEffect, useMemo, useState } from "react";

const DiseaseGlossary = () => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/data/disease-glossary.json")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setItems(data || []);
      })
      .catch(() => {
        if (mounted) setItems([]);
      });
    return () => (mounted = false);
  }, []);

  // fuzzy subsequence match: returns array of matched char indices or null
  const subsequenceMatch = (text = "", q = "") => {
    if (!q) return [];
    const lower = text.toLowerCase();
    const qlower = q.toLowerCase();
    const positions = [];
    let idx = 0;
    for (let i = 0; i < qlower.length; i++) {
      const ch = qlower[i];
      idx = lower.indexOf(ch, idx);
      if (idx === -1) return null;
      positions.push(idx);
      idx += 1;
    }
    return positions;
  };

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items.map((it) => ({ item: it, pos: null }));

    const matches = items
      .map((it) => {
        const eng = it.english || "";
        const nep = it.nepali || "";
        const engPos = subsequenceMatch(eng, q);
        const nepPos = subsequenceMatch(nep, q);
        let pos = null;
        if (engPos) pos = { field: "english", indices: engPos };
        if (nepPos && (!pos || nepPos.length < pos.indices.length)) pos = { field: "nepali", indices: nepPos };

        const engInc = eng.toLowerCase().includes(q.toLowerCase());
        const nepInc = nep.toLowerCase().includes(q.toLowerCase());

        if (!pos && !engInc && !nepInc) return null;

        const span = pos ? pos.indices[pos.indices.length - 1] - pos.indices[0] : 9999;
        const score = (engInc || nepInc ? 0 : 1) + span / 1000;

        return { item: it, pos, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score);

    return matches;
  }, [items, query]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(0);
  }, [query, items]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const getPageButtons = () => {
    const n = totalPages;
    if (n <= 7) return Array.from({ length: n }).map((_, i) => i);
    const pages = [0];
    const left = Math.max(1, page - 1);
    const right = Math.min(n - 2, page + 1);
    if (left > 1) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < n - 2) pages.push("...");
    pages.push(n - 1);
    return pages;
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search diseases</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type English or Nepali name..."
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8">No matches found.</div>
        )}

        {pageItems.map(({ item, pos }, idx) => {
          const renderHighlighted = (text, positions) => {
            if (!positions || positions.length === 0) return text;
            const parts = [];
            let last = 0;
            positions.forEach((p) => {
              if (p > last) parts.push({ t: text.slice(last, p), m: false });
              parts.push({ t: text[p], m: true });
              last = p + 1;
            });
            if (last < text.length) parts.push({ t: text.slice(last), m: false });
            return parts.map((part, i) =>
              part.m ? (
                <span key={i} className="bg-yellow-200 rounded-sm">
                  {part.t}
                </span>
              ) : (
                <span key={i}>{part.t}</span>
              )
            );
          };

          const engPositions = pos && pos.field === "english" ? pos.indices : null;
          const nepPositions = pos && pos.field === "nepali" ? pos.indices : null;

          return (
            <div key={idx} className="p-3 md:p-4 border rounded-lg bg-gray-50">
              <div className="text-xs md:text-sm text-gray-500">English</div>
              <div className="text-base md:text-lg font-medium text-gray-800">{renderHighlighted(item.english, engPositions)}</div>
              <div className="mt-2 text-xs md:text-sm text-gray-500">Nepali</div>
              <div className="text-base md:text-lg font-medium text-emerald-600">{renderHighlighted(item.nepali, nepPositions)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="text-sm text-gray-500">Showing {Math.min(total, page * pageSize + 1)}–{Math.min(total, page * pageSize + pageItems.length)} of {total}</div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded px-2 py-1 text-sm w-full md:w-auto"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex-1 md:flex-none px-3 py-2 rounded bg-white border text-sm disabled:opacity-50"
            >
              Prev
            </button>

            <div className="text-sm text-gray-600 px-2">
              <span className="md:hidden">Page {page + 1} of {totalPages}</span>
              <span className="hidden md:inline">Page {page + 1} of {totalPages}</span>
            </div>

            <div className="hidden md:flex items-center gap-1 max-w-xs overflow-x-auto">
              {getPageButtons().map((p, idx) =>
                p === "..." ? (
                  <span key={"e-" + idx} className="px-2 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2 py-1 rounded text-sm ${p === page ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
                  >
                    {p + 1}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex-1 md:flex-none px-3 py-2 rounded bg-white border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseGlossary;
