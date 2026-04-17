import { useState } from "react";
import MealTimeSelector from "./MealTimeSelector";

const BACKEND_URL = "/api";

function parseMacroNum(val) {
  if (!val) return undefined;
  return parseFloat(String(val).replace(/[^0-9.]/g, "")) || undefined;
}

export default function FoodSearch({ recentSearches, addRecentSearch, clearRecentSearches, addMeal }) {
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [saved, setSaved]     = useState(false);
  const [mealTime, setMealTime] = useState(null);

  const searchFood = async (foodName) => {
    const name = (foodName || query).trim();
    if (!name) return;
    setLoading(true); setError(null); setResult(null); setSaved(false);
    try {
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: name }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Something went wrong.");
      else { setResult(data); addRecentSearch(name); setQuery(name); }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLog = () => {
    if (!result) return;
    addMeal({
      name:     result.food,
      calories: result.calories,
      protein:  parseMacroNum(result.macros?.protein),
      carbs:    parseMacroNum(result.macros?.carbohydrates),
      fat:      parseMacroNum(result.macros?.fat),
      source:   "search",
      mealTime,
    });
    setSaved(true);
  };

  return (
    <div className="search-container">
      <h2 className="search-title">Search Food Nutrition</h2>

      <form onSubmit={(e) => { e.preventDefault(); searchFood(); }} className="search-form">
        <input
          type="text" className="search-input"
          placeholder="e.g. banana, grilled chicken, idli..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSaved(false); }}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      {recentSearches.length > 0 && !loading && (
        <div className="recent-searches">
          <div className="recent-header">
            <span className="recent-label">Recent</span>
            <button className="btn-link" onClick={clearRecentSearches}>Clear</button>
          </div>
          <div className="recent-chips">
            {recentSearches.map((s, i) => (
              <button key={i} className="chip" onClick={() => { setQuery(s); searchFood(s); }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div className="nutrition-card">
          <div className="nutrition-header">
            <div>
              <h3 className="nutrition-food-name">{result.food}</h3>
              <p className="nutrition-serving">Per {result.serving_size}</p>
            </div>
            <div className="nutrition-calories-badge">{result.calories} kcal</div>
          </div>

          <div className="macros-grid">
            {[
              { label: "Protein", val: result.macros?.protein },
              { label: "Carbs",   val: result.macros?.carbohydrates },
              { label: "Fat",     val: result.macros?.fat },
              { label: "Fiber",   val: result.macros?.fiber },
            ].map((m) => (
              <div key={m.label} className="macro-item">
                <span className="macro-value">{m.val}</span>
                <span className="macro-label">{m.label}</span>
              </div>
            ))}
          </div>

          {result.vitamins?.length > 0 && (
            <div className="nutrition-section">
              <p className="section-label">Vitamins & Minerals</p>
              <div className="tag-list">
                {result.vitamins.map((v, i) => <span key={i} className="tag">{v}</span>)}
              </div>
            </div>
          )}

          {result.benefits?.length > 0 && (
            <div className="nutrition-section">
              <p className="section-label">Health Benefits</p>
              <ul className="benefits-list">
                {result.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {result.notes && <p className="notes-text"><strong>Note:</strong> {result.notes}</p>}

          <MealTimeSelector value={mealTime} onChange={setMealTime} />

          <button
            className={saved ? "btn-saved" : "btn-analyze"}
            onClick={handleSaveToLog}
            disabled={saved}
          >
            {saved ? "✓ Saved to Today's Log" : "Save to Log"}
          </button>
        </div>
      )}
    </div>
  );
}
