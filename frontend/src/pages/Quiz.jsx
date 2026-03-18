import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Quiz = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const filters = state || {};

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(filters.timerPerQuestion || 30);
  const timerRef = useRef(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.tableName) params.set("table", filters.tableName);
    if (filters.filterSubject) params.set("subject", filters.filterSubject);
    if (filters.filterTopic) params.set("topic", filters.filterTopic);
    if (filters.filterYear) params.set("year", filters.filterYear);
    if (filters.numQuestions) params.set("limit", String(filters.numQuestions));
    return params.toString() ? `?${params.toString()}` : "";
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = buildQuery();
      const res = await fetch(`/api/students/mcqs${q}`);
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const mapped = payload.data.map((r) => ({
          id: r.id,
          question: r.question,
          options: r.options || [],
          answer: typeof r.answer === 'number' ? r.answer : Number(r.answer || 0),
          explanation: r.explanation || "",
        }));
        // shuffle and slice to requested limit
        const pool = mapped.slice();
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const chosen = pool.slice(0, Math.max(1, Math.min(filters.numQuestions || 10, pool.length)));
        setQuestions(chosen);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error(err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.timed) {
      setTimeLeft(filters.timerPerQuestion || 30);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [questions]);

  useEffect(() => {
    if (timeLeft <= 0 && filters.timed) {
      // treat as incorrect and advance
      setResults((r) => [...r, { id: questions[current]?.id, selected: null, correct: false }]);
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowAnswer(false);
        setTimeLeft(filters.timerPerQuestion || 30);
      } else {
        setFinished(true);
        clearInterval(timerRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const submitAnswer = () => {
    if (selected === null) return;
    if (filters.mode === 'casual') {
      setShowAnswer(true);
      const correct = selected === questions[current].answer;
      setResults((r) => [...r, { id: questions[current].id, selected, correct }]);
      if (correct) setScore((s) => s + 1);
    } else {
      // exam: record and advance
      const correct = selected === questions[current].answer;
      setResults((r) => [...r, { id: questions[current].id, selected, correct }]);
      if (correct) setScore((s) => s + 1);
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowAnswer(false);
        setTimeLeft(filters.timerPerQuestion || 30);
      } else {
        setFinished(true);
        clearInterval(timerRef.current);
      }
    }
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowAnswer(false);
      setTimeLeft(filters.timerPerQuestion || 30);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="my-8">
      <div className="max-w-3xl mx-auto p-4 border rounded bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium">Quiz</h2>
            <div className="text-sm text-gray-600">Mode: {filters.mode || 'casual'} {filters.timed ? `• Timed (${filters.timerPerQuestion}s)` : ''}</div>
          </div>
          <div>
            <button onClick={() => navigate('/students')} className="px-3 py-2 border rounded">Back</button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading questions…</div>
        ) : questions.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No questions available for selected filters.</div>
        ) : finished ? (
          <div className="p-4">
            <div className="font-medium">Quiz finished — Score {score} / {questions.length}</div>
            <div className="mt-3">
              {results.map((r, idx) => (
                <div key={idx} className="border-b py-2">
                  <div className="text-sm">Q: {questions[idx]?.question || '—'}</div>
                  <div className="text-xs text-gray-600">Your answer: {r.selected !== null ? (questions[idx]?.options[r.selected] ?? r.selected) : 'No answer'}. Correct: {questions[idx]?.options[questions[idx]?.answer]}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Question {current + 1} of {questions.length}</div>
                {filters.timed ? <div className="text-sm text-red-600">Time left: {timeLeft}s</div> : null}
              </div>
              <div className="mt-2 text-base">{questions[current].question}</div>
            </div>
            <div className="grid gap-2">
              {questions[current].options.map((opt, i) => {
                const isCorrect = showAnswer && i === questions[current].answer;
                const isSelected = selected === i;
                return (
                  <button key={i} onClick={() => setSelected(i)} className={`text-left p-2 rounded border ${isSelected? 'border-primary bg-primary/10' : 'border-gray-200'} ${isCorrect? 'bg-green-50 border-green-300' : ''}`}>
                    {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={submitAnswer} className="bg-primary text-white px-4 py-2 rounded">Submit</button>
              {filters.mode === 'casual' && showAnswer ? (
                <button onClick={nextQuestion} className="bg-gray-100 px-3 py-2 rounded">Next</button>
              ) : null}
              <div className="text-sm text-gray-600">Score: {score}</div>
            </div>
            {showAnswer && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded text-sm">
                <strong>Answer:</strong> {questions[current].options[questions[current].answer]}<br />
                <em>{questions[current].explanation}</em>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
