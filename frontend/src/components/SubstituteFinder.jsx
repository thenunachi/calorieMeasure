import { useState } from "react";

const BACKEND_URL = "/api";

const EXAMPLES = [
  "chicken, rice, broccoli",
  "eggs, spinach, cheese",
  "oats, banana, peanut butter",
  "salmon, asparagus, lemon",
];

export default function SubstituteFinder() {
  const [ingredients, setIngredients] = useState("");
  const [maxCal, setMaxCal]           = useState(600);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [expanded, setExpanded]       = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ingredients.trim()) return;
    setLoading(true); setError(null); setResult(null); setExpanded(null);
    try {
      const res = await fetch(`${BACKEND_URL}/substitute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredients.trim(), max_calories: maxCal }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setResult(data);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="substitute-container">
      <h2 className="section-title">Ingredient Finder</h2>
      <p className="section-sub">Tell us what you have — we'll suggest what to cook</p>

      {/* Example chips */}
      <div className="sub-examples">
        <span className="sub-examples-label">Try:</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" onClick={() => setIngredients(ex)}>{ex}</button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="sub-form">
        <div className="form-row">
          <label>Your ingredients</label>
          <textarea
            className="recipe-textarea"
            style={{ background: "var(--s2)", color: "var(--txt)", border: "1.5px solid var(--border2)", borderRadius: 14 }}
            rows={3}
            placeholder="e.g. chicken, rice, broccoli, garlic"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Max calories per serving: <strong style={{ color: "var(--purple)" }}>{maxCal} kcal</strong></label>
          <input
            type="range" min={200} max={1200} step={50}
            value={maxCal}
            onChange={(e) => setMaxCal(Number(e.target.value))}
            className="portion-slider"
          />
          <div className="sub-cal-labels">
            <span>200</span><span>500</span><span>800</span><span>1200</span>
          </div>
        </div>
        <button type="submit" className="btn-analyze" disabled={loading}>
          {loading ? "Finding meals..." : "Find Meal Ideas"}
        </button>
      </form>

      {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Asking AI for meal ideas...</p>
        </div>
      )}

      {/* Results */}
      {result?.meals && (
        <div className="sub-results">
          <h3 className="sub-results-title">
            {result.meals.length} meal idea{result.meals.length !== 1 ? "s" : ""} found
          </h3>
          {result.meals.map((meal, i) => (
            <div key={i} className={`sub-meal-card${expanded === i ? " open" : ""}`}>
              <button className="sub-meal-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="sub-meal-left">
                  <span className="sub-meal-num">{i + 1}</span>
                  <div>
                    <div className="sub-meal-name">{meal.name}</div>
                    <div className="sub-meal-desc">{meal.description}</div>
                  </div>
                </div>
                <div className="sub-meal-right">
                  <span className="sub-meal-cal">{meal.calories_per_serving} kcal</span>
                  <span className="sub-meal-time">{meal.prep_time}</span>
                  <span className="sub-meal-chevron">{expanded === i ? "▲" : "▼"}</span>
                </div>
              </button>

              {expanded === i && (
                <div className="sub-meal-body">
                  {/* Macros */}
                  {meal.macros && (
                    <div className="sub-macros">
                      {Object.entries(meal.macros).map(([k, v]) => (
                        <div key={k} className="sub-macro-item">
                          <span className="sub-macro-val">{v}</span>
                          <span className="sub-macro-lbl">{k}</span>
                        </div>
                      ))}
                      <div className="sub-macro-item">
                        <span className="sub-macro-val">{meal.servings}</span>
                        <span className="sub-macro-lbl">servings</span>
                      </div>
                    </div>
                  )}

                  {/* Ingredients used */}
                  {meal.ingredients_used?.length > 0 && (
                    <div className="sub-section">
                      <div className="sub-section-label">Ingredients used</div>
                      <div className="sub-ing-chips">
                        {meal.ingredients_used.map((ing, j) => (
                          <span key={j} className="sub-ing-chip">{ing}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {meal.instructions?.length > 0 && (
                    <div className="sub-section">
                      <div className="sub-section-label">How to make it</div>
                      <ol className="sub-steps">
                        {meal.instructions.map((step, j) => (
                          <li key={j}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
