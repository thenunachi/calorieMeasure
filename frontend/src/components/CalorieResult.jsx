import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CalorieResult({ result, addMeal, imageUrl }) {
  const [portion, setPortion] = useState(1);
  const [saved, setSaved] = useState(true); // auto-saved by App.jsx after analysis
  const cardRef = useRef(null);

  if (!result) return null;

  const handleSave = () => {
    addMeal({ name: "Scanned Meal", calories: scale(result.total_calories), protein: result.total_protein, carbs: result.total_carbs, fat: result.total_fat, source: "scan" });
    setSaved(true);
  };

  const { items, total_calories, notes } = result;

  const scale = (val) => Math.round(val * portion);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = "meal-summary.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save("meal-summary.pdf");
  };

  const shareImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "meal-summary.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "My Meal Summary" });
        } else {
          // Fallback: download if share not supported
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "meal-summary.png";
          link.click();
        }
      }, "image/png");
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const portionLabels = { 0.5: "½x", 1: "1x", 1.5: "1.5x", 2: "2x" };

  return (
    <div className="result-wrapper result-fadein">
      {/* Portion Slider */}
      <div className="portion-container">
        <div className="portion-header">
          <span className="portion-label">Portion Size</span>
          <span className="portion-value">{portionLabels[portion] || `${portion}x`}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.5"
          value={portion}
          onChange={(e) => setPortion(parseFloat(e.target.value))}
          className="portion-slider"
        />
        <div className="portion-ticks">
          {Object.entries(portionLabels).map(([val, label]) => (
            <span key={val} className={parseFloat(val) === portion ? "tick active" : "tick"}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Result Card (captured for export) */}
      <div ref={cardRef} className="result-container">
        {imageUrl && (
          <div className="result-image-wrap">
            <img src={imageUrl} alt="Your meal" className="result-meal-img" />
          </div>
        )}
        <h2 className="result-title">Calorie Breakdown</h2>

        {items && items.length > 0 ? (
          <table className="result-table">
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Quantity</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{scale(item.calories)} kcal</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-food">No food items detected in the image.</p>
        )}

        <div className="total-row">
          <span>Total Calories {portion !== 1 && <span className="portion-tag">({portionLabels[portion]})</span>}</span>
          <span className="total-value">{scale(total_calories)} kcal</span>
        </div>

        {notes && (
          <p className="notes-text">
            <strong>Note:</strong> {notes}
          </p>
        )}
      </div>

      {/* Save to Log */}
      <button className={saved ? "btn-saved" : "btn-analyze"} onClick={handleSave} disabled={saved}>
        {saved ? "✓ Saved to Today's Log" : "Save to Today's Log"}
      </button>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button className="btn-export" onClick={downloadImage}>Download Image</button>
        <button className="btn-export" onClick={downloadPDF}>Download PDF</button>
        <button className="btn-export btn-share" onClick={shareImage}>Share</button>
      </div>
    </div>
  );
}
