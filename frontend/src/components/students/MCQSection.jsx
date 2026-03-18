import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const sampleQuestions = [
  {
    id: "q1",
    question: "Which organ produces insulin?",
    options: ["Liver", "Pancreas", "Kidney", "Spleen"],
    answer: 1,
    explanation: "Pancreas secretes insulin from beta cells.",
  },
  {
    id: "q2",
    question: "What is the normal resting heart rate range (adult)?",
    options: ["30-50 bpm", "60-100 bpm", "100-140 bpm", "140-180 bpm"],
    answer: 1,
    explanation: "Normal adult resting heart rate is commonly 60-100 bpm.",
  },
];

const MCQSection = () => {
  const [allQuestions, setAllQuestions] = useState(sampleQuestions);
  const [questions, setQuestions] = useState(sampleQuestions);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]); // {id, selected, correct}

  // Filters / options
  const [tableName, setTableName] = useState("mcqs");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [years, setYears] = useState([]);
  const [availableCount, setAvailableCount] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);

  // Quiz controls
  const [mode, setMode] = useState("casual"); // casual | exam
  const [timed, setTimed] = useState(false);
  const [timerPerQuestion, setTimerPerQuestion] = useState(30);
  const [timeLeft, setTimeLeft] = useState(timerPerQuestion);
  const [quizStarted, setQuizStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setSelected(null);
    setShowAnswer(false);
  }, [current]);

  useEffect(() => {
    setTimeLeft(timerPerQuestion);
  }, [timerPerQuestion]);

  useEffect(() => {
    if (quizStarted && timed) {
      clearInterval(timerRef.current);
      setTimeLeft(timerPerQuestion);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted, timed, current]);

  useEffect(() => {
    if (timeLeft <= 0 && quizStarted && timed) {
      handleTimeExpired();
    }
  }, [timeLeft, quizStarted, timed]);

  const buildFilterQuery = () => {
    const params = new URLSearchParams();
    if (filterSubject.trim()) params.set("subject", filterSubject.trim());
    if (filterTopic.trim()) params.set("topic", filterTopic.trim());
    if (filterYear.trim()) params.set("year", filterYear.trim());
    if (numQuestions) params.set("limit", String(numQuestions));
    if (tableName) params.set("table", tableName);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const fetchFromBackend = async () => {
    setLoading(true);
    try {
      const q = buildFilterQuery();
      const res = await fetch(`/api/students/mcqs${q}`);
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const payload = await res.json();
      if (payload.success) {
        const mapped = payload.data.map((r) => ({
          id: r.id,
          question: r.question,
          options: r.options || [],
          answer: typeof r.answer === "number" ? r.answer : Number(r.answer || 0),
          explanation: r.explanation || "",
          meta: { exam: r.exam, subject: r.subject, topic: r.topic, year: r.year, created_at: r.created_at },
        }));
        setAllQuestions(mapped.length ? mapped : sampleQuestions);
        setQuestions(mapped.length ? mapped : sampleQuestions);
        setCurrent(0);
        setScore(0);
        setResults([]);
      } else {
        setAllQuestions(sampleQuestions);
        setQuestions(sampleQuestions);
      }
    } catch (err) {
      console.error(err);
      setAllQuestions(sampleQuestions);
      setQuestions(sampleQuestions);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    setMetaLoading(true);
    try {
      const res = await fetch(`/api/students/metadata?table=${encodeURIComponent(tableName)}`);
      if (!res.ok) return;
      const payload = await res.json();
      if (payload.success && payload.data) {
        setSubjects(payload.data.subjects || []);
        setTopics(payload.data.topics || []);
        setYears(payload.data.years || []);
        setAvailableCount(payload.data.total ?? null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await fetchMetadata();
      if (mounted) await fetchFromBackend();
    };
    load();
    return () => { mounted = false; };
  }, [tableName]);

  // Re-fetch questions when the user changes filters or number of questions
  useEffect(() => {
    let mounted = true;
    const refetch = async () => {
      if (mounted) await fetchFromBackend();
    };
    refetch();
    return () => { mounted = false; };
  }, [filterSubject, filterTopic, filterYear, numQuestions, tableName]);

  const navigate = useNavigate();

  const startQuiz = async () => {
    // navigate to dedicated quiz page, passing selected filters and mode
    navigate('/students/quiz', {
      state: {
        tableName,
        filterSubject,
        filterTopic,
        filterYear,
        numQuestions,
        mode,
        timed,
        timerPerQuestion,
      }
    });
  };

  const finishQuiz = () => {
    setQuizStarted(false);
    setFinished(true);
    clearInterval(timerRef.current);
    setShowAnswer(true);
  };

  const recordAndAdvance = (sel) => {
    const q = questions[current];
    const correct = sel === q.answer;
    setResults((r) => [...r, { id: q.id, selected: sel, correct }]);
    if (correct) setScore((s) => s + 1);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
      setTimeLeft(timerPerQuestion);
    } else {
      finishQuiz();
    }
  };

  const submitAnswer = () => {
    if (selected === null) return;
    if (mode === "casual") {
      // reveal immediately, don't advance until user presses Next
      setShowAnswer(true);
      // record result now
      const q = questions[current];
      const correct = selected === q.answer;
      setResults((r) => [...r, { id: q.id, selected, correct }]);
      if (correct) setScore((s) => s + 1);
    } else {
      // exam mode: record and advance without revealing
      recordAndAdvance(selected);
    }
  };

  const nextQuestion = () => {
    if (mode === "casual") {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowAnswer(false);
        setTimeLeft(timerPerQuestion);
      } else {
        finishQuiz();
      }
    }
  };

  const handleTimeExpired = () => {
    // treat as no answer (incorrect) and advance
    setResults((r) => [...r, { id: questions[current].id, selected: null, correct: false }]);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
      setTimeLeft(timerPerQuestion);
    } else {
      finishQuiz();
    }
  };

  const revealAll = () => {
    setShowAnswer(true);
    setFinished(true);
    setQuizStarted(false);
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">MCQ practice — choose mode, optionally enable timed mode, set number of questions, then click <strong>Start Quiz</strong>.</p>

      <div className="grid gap-2 mb-4 md:grid-cols-3">
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="border px-3 py-2 rounded">
          <option value="casual">Casual — reveal after each</option>
          <option value="exam">Exam — reveal at end</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="timed" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          <label htmlFor="timed" className="text-sm">Timed</label>
        </div>
        <input type="number" min={1} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="border px-3 py-2 rounded" placeholder="# questions" />
        <input type="number" min={5} value={timerPerQuestion} onChange={(e) => setTimerPerQuestion(Number(e.target.value))} className="border px-3 py-2 rounded" placeholder="Seconds per question" />
        <select value={tableName} onChange={(e) => setTableName(e.target.value)} className="border px-3 py-2 rounded">
          <option value="mcqs">mcqs</option>
        </select>
        <div className="flex gap-2">
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2">
            <option value="">Select subject</option>
            {subjects.map((s, idx) => (<option key={idx} value={s}>{s}</option>))}
          </select>
          <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="flex-1 border border-gray-300 rounded px-3 py-2">
            <option value="">Select topic</option>
            {topics.map((t, idx) => (<option key={idx} value={t}>{t}</option>))}
          </select>
        </div>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
          <option value="">Select year</option>
          {years.map((y, idx) => (<option key={idx} value={y}>{y}</option>))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm text-gray-600">Questions available: {availableCount !== null ? availableCount : '—'}</div>
        {metaLoading ? (
          <div className="text-sm text-gray-500">Fetching…</div>
        ) : null}
        <button onClick={startQuiz} className="bg-primary text-white px-4 py-2 rounded">Start Quiz</button>
      </div>

      {/* Auto-refetch when filters change */}
      

      <div className="p-6 border border-dashed border-gray-200 rounded text-sm text-gray-500">Only the number of available questions is shown here. Click <strong>Start Quiz</strong> to open the full quiz.</div>
    </div>
  );
};

export default MCQSection;
