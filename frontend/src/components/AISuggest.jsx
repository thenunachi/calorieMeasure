import { useState } from "react";

const BACKEND_URL = "/api";
const PREFS = ["None", "Vegetarian", "Vegan", "Low-carb", "High-protein", "Gluten-free"];

export default function AISuggest({ todayMeals, todayCalories, todayMacros, macroGoals, goal }) {
  const [pref, setPref]       = useState("None");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const remaining   = Math.max(goal - todayCalories, 0);
  const eatenList   = todayMeals.map((m) => m.name).join(", ") || "nothing yet";
  const remProtein  = Math.max((macroGoals?.protein || 150) - (todayMacros?.protein || 0), 0);
  const remCarbs    = Math.max((macroGoals?.carbs   || 200) - (todayMacros?.carbs   || 0), 0);
  const remFat      = Math.max((macroGoals?.fat     || 65)  - (todayMacros?.fat     || 0), 0);

  const handleSuggest = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remaining_calories: remaining,
          eaten_today:        eatenList,
          remaining_protein:  remProtein,
          remaining_carbs:    remCarbs,
          remaining_fat:      remFat,
          preferences:        pref === "None" ? "none" : pref,
        }),
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
    <div className="suggest-container">
      <h2 className="section-title">AI Meal Suggestions</h2>
      <p className="section-sub">
        {remaining > 0
          ? `You have ${remaining} kcal left — let AI suggest what to eat next`
          : "You've hit your goal! AI can still suggest a light option."}
      </p>

      {/* Remaining macros snapshot */}
      <div className="suggest-stats">
        <div className="suggest-stat">
          <span className="suggest-stat-val">{remaining}</span>
          <span className="suggest-stat-lbl">kcal left</span>
        </div>
        <div className="suggest-stat">
          <span className="suggest-stat-val">{remProtein}g</span>
          <span className="suggest-stat-lbl">protein</span>
        </div>
        <div className="suggest-stat">
          <span className="suggest-stat-val">{remCarbs}g</span>
          <span className="suggest-stat-lbl">carbs</span>
        </div>
        <div className="suggest-stat">
          <span className="suggest-stat-val">{remFat}g</span>
          <span className="suggest-stat-lbl">fat</span>
        </div>
      </div>

      {/* Dietary preference chips */}
      <div className="form-row" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: 8, display: "block" }}>
          Dietary preference
        </label>
        <div className="suggest-prefs">
          {PREFS.map((p) => (
            <button
              key={p}
              className={`chip${pref === p ? " active" : ""}`}
              onClick={() => setPref(p)}
            >{p}</button>
          ))}
        </div>
      </div>

      <button className="btn-analyze" onClick={handleSuggest} disabled={loading}>
        {loading ? "Asking AI..." : "Suggest Meals"}
      </button>

      {error && <p className="error-text" style={{ margin: "12px 0 0" }}>{error}</p>}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Finding the best meals for you...</p>
        </div>
      )}

      {result?.suggestions && (
        <div className="suggest-results">
          <p className="suggest-results-label">
            {result.suggestions.length} suggestion{result.suggestions.length !== 1 ? "s" : ""} for you
          </p>
          {result.suggestions.map((s, i) => (
            <div key={i} className="suggest-card">
              <div className="suggest-card-top">
                <div className="suggest-card-left">
                  <div className="suggest-card-name">{s.name}</div>
                  <div className="suggest-card-desc">{s.description}</div>
                </div>
                <div className="suggest-card-cal">
                  {s.calories}
                  <span className="suggest-card-unit"> kcal</span>
                </div>
              </div>
              <div className="suggest-macros">
                {s.protein && <span>P {s.protein}</span>}
                {s.carbs   && <span>C {s.carbs}</span>}
                {s.fat     && <span>F {s.fat}</span>}
              </div>
              {s.why && <div className="suggest-why">💡 {s.why}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
