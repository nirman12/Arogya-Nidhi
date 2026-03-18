import { useState, useEffect } from 'react';
import assets from '../../utils/studentAssets';

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const parts = line.split(',');
    const obj = {};
    for (let i = 0; i < Math.min(header.length, parts.length); i++) {
      obj[header[i]] = (parts[i] || '').trim();
    }
    if (parts.length > header.length) {
      const extra = parts.slice(header.length).join(',').trim();
      const lastKey = header[header.length - 1];
      obj[lastKey] = (obj[lastKey] ? obj[lastKey] + ',' + extra : extra);
    }
    return {
      name: obj['medicine name'] || obj['name'] || '',
      composition: obj['composition'] || '',
      uses: obj['uses'] || '',
      sideEffects: obj['side_effects'] || obj['sideeffects'] || obj['side effects'] || '',
      image: obj['image url'] || obj['image'] || '',
      manufacturer: obj['manufacturer'] || '',
      reviewExcellent: obj['excellent review %'] || '',
      reviewAverage: obj['average review %'] || '',
      reviewPoor: obj['poor review %'] || '',
    };
  }).filter(r => r.name);
  return rows;
};

const MedicineInfo = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(assets.medicineCsv);
        if (!res.ok) {
          setAll([]);
          setResults([]);
          setLoading(false);
          return;
        }
        const txt = await res.text();
        const parsed = parseCsv(txt);
        setAll(parsed);
        setResults(parsed);
      } catch (err) {
        console.error(err);
        setAll([]);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    if (!q) return setResults(all);
    const lower = q.toLowerCase();
    setResults(all.filter(m => (m.name||'').toLowerCase().includes(lower) || (m.composition||'').toLowerCase().includes(lower) || (m.uses||'').toLowerCase().includes(lower)));
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">Search medicine by name. Data loaded from <span>/public/data/Medicine_Details.csv</span>.</p>

      <div className="flex gap-2 mb-4">
        <input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search medicine..." className="flex-1 border px-3 py-2 rounded" />
        <button onClick={() => handleSearch(query)} className="bg-primary text-white px-3 py-2 rounded">Search</button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-600">Loading medicines…</div>
      ) : (
        <div className="grid gap-3">
          {results.length === 0 ? (
            <div className="text-sm text-gray-500">No medicines found.</div>
          ) : (
            results.map((m, idx) => (
              <div key={idx} className="p-3 border rounded flex flex-col md:flex-row gap-4 items-start">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="w-full md:w-40 h-40 object-contain rounded border" />
                ) : (
                  <div className="w-full md:w-40 h-40 bg-gray-50 rounded border flex items-center justify-center text-xs text-gray-400">No image</div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-lg">{m.name}</div>
                  {m.composition ? <div className="text-sm text-gray-700 mt-1"><strong>Composition:</strong> {m.composition}</div> : null}
                  {m.uses ? <div className="text-sm text-gray-700 mt-2"><strong>Uses:</strong> {m.uses}</div> : null}
                  {m.sideEffects ? <div className="text-sm text-gray-700 mt-2"><strong>Side effects:</strong> {m.sideEffects}</div> : null}
                  {m.manufacturer ? <div className="text-xs text-gray-500 mt-2">Manufacturer: {m.manufacturer}</div> : null}
                  {(m.reviewExcellent || m.reviewAverage || m.reviewPoor) ? (
                    <div className="text-xs text-gray-500 mt-2">Reviews: {m.reviewExcellent}% excellent • {m.reviewAverage}% average • {m.reviewPoor}% poor</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineInfo;
