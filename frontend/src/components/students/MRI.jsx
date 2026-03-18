import { useState, useEffect } from 'react';
import assets from '../../utils/studentAssets';

const MRI = () => {
  const cats = Object.keys(assets.MRI || {});
  const [category, setCategory] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // options are derived from available categories so the folder name is the correct label
  const options = [...cats, 'Other'];

  const images = (assets.MRI[category] || []);
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

  const isCorrect = () => {
    if (!submitted || selected === null) return null;
    const picked = options[selected];
    return picked === category;
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">Select an MRI image from the dataset, make a prediction, and submit.</p>

      {/* category and count hidden — user should only see the image */}

      {url && (
        <div className="mb-3">
          <img src={url} alt="mri" className="w-full max-h-96 object-contain rounded border" />
        </div>
      )}

      <div className="grid gap-2 mb-3">
        {options.map((o, idx) => (
          <label key={idx} className={`p-2 border rounded cursor-pointer ${selected===idx? 'bg-primary text-white' : ''}`}>
            <input type="radio" name="mri_opt" checked={selected===idx} onChange={() => setSelected(idx)} className="mr-2" /> {o}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={submit} className="bg-primary text-white px-3 py-2 rounded">Submit Prediction</button>
        <button onClick={() => {
            if (!cats.length) return;
            const newCat = cats[Math.floor(Math.random() * cats.length)];
            const imgs = assets.MRI[newCat] || [];
            const rnd = imgs.length ? Math.floor(Math.random() * imgs.length) : 0;
            setCategory(newCat);
            setIndex(rnd);
            setSelected(null);
            setSubmitted(false);
          }} className="bg-gray-100 px-3 py-2 rounded">Reset</button>
        <button onClick={() => {
            if (!cats.length) return;
            const newCat = cats[Math.floor(Math.random() * cats.length)];
            const imgs = assets.MRI[newCat] || [];
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
          <div className="mt-2">Correct label: <strong>{category}</strong></div>
          <div className="mt-2 text-gray-600">{isCorrect() ? 'Correct!' : 'Incorrect'}</div>
        </div>
      )}
    </div>
  );
};

export default MRI;
