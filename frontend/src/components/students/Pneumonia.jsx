import { useState, useEffect } from 'react';
import assets from '../../utils/studentAssets';

const Pneumonia = () => {
  const cats = Object.keys(assets.PNEUMONIA || {});
  const [category, setCategory] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const options = ['Normal', 'Bacterial Pneumonia', 'Viral Pneumonia', 'Other'];

  const images = (assets.PNEUMONIA[category] || []);
  const url = images[index] || '';

  // pick a random category & image on mount; whenever category changes pick a random image
  useEffect(() => {
    if (!category && cats.length) {
      const rc = cats[Math.floor(Math.random() * cats.length)];
      setCategory(rc);
      return;
    }
    if (images.length) {
      setIndex(Math.floor(Math.random() * images.length));
      setSubmitted(false);
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const getGroundTruth = () => {
    // If category is Normal -> Normal, else try to infer from filename for Infected
    if (category.toLowerCase() === 'normal') return 'Normal';
    const filename = url.split('/').pop().toLowerCase();
    if (filename.includes('virus')) return 'Viral Pneumonia';
    if (filename.includes('bacteria') || filename.includes('bacterial')) return 'Bacterial Pneumonia';
    return 'Bacterial Pneumonia';
  };

  const isCorrect = () => {
    if (!submitted || selected === null) return null;
    const picked = options[selected];
    return picked === getGroundTruth();
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">Choose a chest X-ray from the dataset, make a prediction, and submit.</p>

      {/* category and count hidden — user should only see the image */}

      {url && (
        <div className="mb-3">
          <img src={url} alt="pneumonia" className="w-full max-h-96 object-contain rounded border" />
        </div>
      )}

      <div className="grid gap-2 mb-3">
        {options.map((o, idx) => (
          <label key={idx} className={`p-2 border rounded cursor-pointer ${selected===idx? 'bg-primary text-white' : ''}`}>
            <input type="radio" name="pneu_opt" checked={selected===idx} onChange={() => setSelected(idx)} className="mr-2" /> {o}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={submit} className="bg-primary text-white px-3 py-2 rounded">Submit Prediction</button>
        <button onClick={() => {
            if (!cats.length) return;
            const newCat = cats[Math.floor(Math.random() * cats.length)];
            const imgs = assets.PNEUMONIA[newCat] || [];
            const rnd = imgs.length ? Math.floor(Math.random() * imgs.length) : 0;
            setCategory(newCat);
            setIndex(rnd);
            setSelected(null);
            setSubmitted(false);
          }} className="bg-gray-100 px-3 py-2 rounded">Reset</button>
        <button onClick={() => {
            if (!cats.length) return;
            const newCat = cats[Math.floor(Math.random() * cats.length)];
            const imgs = assets.PNEUMONIA[newCat] || [];
            setCategory(newCat);
            setIndex(imgs.length ? Math.floor(Math.random() * imgs.length) : 0);
            setSelected(null);
            setSubmitted(false);
          }} className="bg-white border px-3 py-2 rounded">Next Random</button>
      </div>

      {submitted && (
        <div className="mt-4 p-3 border rounded bg-white text-sm">
          <div className="font-medium">Result</div>
          <div className="mt-2">You selected: <strong>{options[selected]}</strong></div>
          <div className="mt-2">Ground truth: <strong>{getGroundTruth()}</strong></div>
          <div className="mt-2 text-gray-600">{isCorrect() ? 'Correct!' : 'Incorrect'}</div>
        </div>
      )}
    </div>
  );
};

export default Pneumonia;
