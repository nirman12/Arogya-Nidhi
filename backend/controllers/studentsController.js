import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DEFAULT_TABLE = process.env.MCQ_TABLE || "mcqs";

export const getMCQs = async (req, res) => {
  try {
    const { subject, topic, year, limit } = req.query;
    const table = req.query.table || DEFAULT_TABLE;

    const select = `select=id,exam,subject,topic,q,options,answer,explanation,year,created_at`;
    const filters = [];
    if (subject) filters.push(`subject=eq.${encodeURIComponent(subject)}`);
    if (topic) filters.push(`topic=eq.${encodeURIComponent(topic)}`);
    if (year) filters.push(`year=eq.${encodeURIComponent(year)}`);
    const filterQuery = filters.length ? `&${filters.join("&")}` : "";
    const lim = limit ? `&limit=${Number(limit)}` : "";

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ success: false, message: "Supabase not configured on server" });
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${select}${filterQuery}${lim}`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ success: false, message: txt });
    }
    const data = await r.json();
    const mapped = data.map((row) => ({
      id: row.id,
      exam: row.exam,
      subject: row.subject,
      topic: row.topic,
      question: row.q,
      options: Array.isArray(row.options) ? row.options : (row.options ? JSON.parse(row.options) : []),
      answer: typeof row.answer === "number" ? row.answer : (row.answer ? Number(row.answer) : 0),
      explanation: row.explanation,
      year: row.year,
      created_at: row.created_at,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMetadata = async (req, res) => {
  try {
    const table = req.query.table || DEFAULT_TABLE;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ success: false, message: "Supabase not configured on server" });
    }

    // helper to fetch distinct values for a column
    const fetchDistinct = async (col) => {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(col)}&distinct=${encodeURIComponent(col)}`;
      const r = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
      });
      if (!r.ok) return [];
      const data = await r.json();
      return data.map((row) => row[col]).filter(Boolean);
    };

    const subjects = await fetchDistinct("subject");
    const topics = await fetchDistinct("topic");
    const years = await fetchDistinct("year");

    // get total count using Prefer: count=exact
    const countUrl = `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`;
    const countRes = await fetch(countUrl, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=exact",
      },
    });
    let total = null;
    const contentRange = countRes.headers.get("content-range");
    if (contentRange) {
      const parts = contentRange.split("/");
      total = parts.length === 2 ? Number(parts[1]) : null;
    }

    res.json({ success: true, data: { subjects, topics, years, total } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
