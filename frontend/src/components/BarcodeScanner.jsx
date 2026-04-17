import { useState, useRef, useEffect } from "react";

const OFF_API = "https://world.openfoodfacts.org/api/v0/product";

async function lookupBarcode(code) {
  const res = await fetch(`${OFF_API}/${code}.json`);
  const data = await res.json();
  if (data.status !== 1) return null;
  const p = data.product;
  const n = p.nutriments || {};
  return {
    name: p.product_name || "Unknown product",
    brand: p.brands || "",
    serving: p.serving_size || "100g",
    calories: Math.round(n["energy-kcal_serving"] || n["energy-kcal_100g"] || 0),
    protein: `${Math.round(n.proteins_serving || n.proteins_100g || 0)}g`,
    carbs: `${Math.round(n.carbohydrates_serving || n.carbohydrates_100g || 0)}g`,
    fat: `${Math.round(n.fat_serving || n.fat_100g || 0)}g`,
    fiber: `${Math.round(n.fiber_serving || n.fiber_100g || 0)}g`,
    image: p.image_front_small_url || null,
  };
}

const supportsDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

export default function BarcodeScanner({ addMeal }) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
    } catch {
      setError("Camera access denied or not available.");
    }
  };

  // Detect barcode frames
  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let stopped = false;

    const detect = async () => {
      if (stopped) return;
      try {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (codes.length > 0) {
          const code = codes[0].rawValue;
          stopCamera();
          setLoading(true);
          const data = await lookupBarcode(code);
          if (data) setResult(data);
          else setError(`No product found for barcode ${code}. Try manual entry.`);
          setLoading(false);
          return;
        }
      } catch { /* keep trying */ }
      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => { stopped = true; cancelAnimationFrame(rafRef.current); };
  }, [scanning]);

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    const data = await lookupBarcode(manualCode.trim());
    if (data) setResult(data);
    else setError("No product found for that barcode.");
    setLoading(false);
  };

  const handleSave = () => {
    if (!result) return;
    addMeal({ name: `${result.brand ? result.brand + " – " : ""}${result.name}`, calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat, source: "barcode" });
    setSaved(true);
  };

  return (
    <div className="barcode-container">
      <h2 className="section-title">Barcode Scanner</h2>
      <p className="section-sub">Scan any packaged food barcode to get nutrition facts</p>
      <p className="section-sub" style={{ marginTop: 2 }}>Powered by <strong>Open Food Facts</strong> (free, open data)</p>

      {supportsDetector ? (
        <div className="barcode-camera-area">
          {!scanning && !result && (
            <button className="btn-primary" onClick={startScanner}>Open Camera to Scan</button>
          )}
          {scanning && (
            <>
              <div className="scanner-frame">
                <video ref={videoRef} autoPlay playsInline className="scanner-video" />
                <div className="scanner-overlay">
                  <div className="scanner-line" />
                </div>
              </div>
              <button className="btn-secondary" onClick={stopCamera}>Cancel</button>
            </>
          )}
        </div>
      ) : (
        <p className="section-sub">Camera barcode detection not supported in this browser.</p>
      )}

      {/* Manual entry fallback */}
      <div className="barcode-divider">
        <span>or enter barcode manually</span>
      </div>
      <form onSubmit={handleManualLookup} className="search-form">
        <input
          className="search-input"
          placeholder="e.g. 8901030859038"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          type="number"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Look up"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {loading && <div className="loading"><div className="spinner" /><p>Looking up product...</p></div>}

      {result && (
        <div className="barcode-result">
          <div className="barcode-product-header">
            {result.image && <img src={result.image} alt={result.name} className="product-img" />}
            <div>
              <h3 className="nutrition-food-name">{result.name}</h3>
              {result.brand && <p className="nutrition-serving">{result.brand}</p>}
              <p className="nutrition-serving">Per {result.serving}</p>
            </div>
            <div className="nutrition-calories-badge">{result.calories} kcal</div>
          </div>

          <div className="macros-grid">
            {[
              { label: "Protein", val: result.protein },
              { label: "Carbs", val: result.carbs },
              { label: "Fat", val: result.fat },
              { label: "Fiber", val: result.fiber },
            ].map((m) => (
              <div key={m.label} className="macro-item">
                <span className="macro-value">{m.val}</span>
                <span className="macro-label">{m.label}</span>
              </div>
            ))}
          </div>

          <button className={saved ? "btn-saved" : "btn-analyze"} onClick={handleSave} disabled={saved}>
            {saved ? "✓ Saved to Log" : "Save to Today's Log"}
          </button>
        </div>
      )}
    </div>
  );
}
