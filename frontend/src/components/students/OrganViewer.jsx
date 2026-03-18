import { useEffect, useState, useRef } from "react";
import modelsList from "../../utils/modelsList";

// Uses <model-viewer> via CDN for .glb preview. Loads available models from modelsList.
const OrganViewer = () => {
  const [modelUrl, setModelUrl] = useState(modelsList[0]?.url || "");
  const [selected, setSelected] = useState(modelsList[0]?.id || "");
  const [available, setAvailable] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exposure, setExposure] = useState(1);
  const viewerRef = useRef(null);

  useEffect(() => {
    // load model-viewer script if not present
    if (!window.customElements?.get("model-viewer")) {
      const s = document.createElement("script");
      // model-viewer distributed as an ES module; load with type="module"
      s.type = 'module';
      s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const m = modelsList.find((x) => x.id === selected);
    const url = m ? m.url : "";
    setModelUrl(url);
    if (url) {
      // quick HEAD check to ensure file exists
      fetch(url, { method: 'HEAD' }).then((res) => {
        setAvailable(res.ok);
      }).catch(() => setAvailable(false));
    } else {
      setAvailable(false);
    }
  }, [selected]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    if (autoRotate) el.setAttribute('auto-rotate', ''); else el.removeAttribute('auto-rotate');
    el.setAttribute('exposure', String(exposure));
  }, [autoRotate, exposure]);

  const downloadModel = () => {
    if (!modelUrl) return;
    const a = document.createElement('a');
    a.href = modelUrl;
    a.download = modelUrl.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="p-4 border border-gray-200 rounded bg-white">
      <p className="text-sm text-gray-500 mb-3">Select a 3D organ to preview. Models are served from the project's public/models folder.</p>

      <div className="flex gap-2 mb-3 items-center flex-wrap">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
          {modelsList.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm">Auto-rotate</label>
          <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Exposure</label>
          <input type="range" min="0.2" max="2" step="0.1" value={exposure} onChange={(e) => setExposure(Number(e.target.value))} />
        </div>
        <button onClick={downloadModel} className="ml-2 text-sm bg-gray-100 px-3 py-2 rounded">Download</button>
      </div>

      <div className="w-full h-96 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
        {modelUrl && available ? (
          // eslint-disable-next-line react/no-unknown-property
          <model-viewer ref={viewerRef} src={modelUrl} alt="3D model" camera-controls style={{ width: '100%', height: '100%' }} shadow-intensity="1" exposure={exposure}></model-viewer>
        ) : (
          <div className="text-sm text-gray-400">No model available or file not found.</div>
        )}
      </div>
    </div>
  );
};

export default OrganViewer;
