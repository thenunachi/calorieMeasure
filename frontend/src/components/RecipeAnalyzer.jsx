import { useState } from "react";
import recipeBg from "../assets/recipe-bg.jpg";

const BACKEND_URL = "/api";

const PLACEHOLDER = `200g chicken breast
1 cup rice
2 tbsp olive oil
1 onion
3 garlic cloves`;

export default function RecipeAnalyzer({ addMeal }) {
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const analyze = async (e) => {
    e.preventDefault();
    if (!ingredients.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch(`${BACKEND_URL}/recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
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

  const handleSave = () => {
    if (!result) return;
    addMeal({ name: result.recipe_name, calories: result.per_serving.calories, protein: result.per_serving.protein, carbs: result.per_serving.carbohydrates, fat: result.per_serving.fat, source: "recipe" });
    setSaved(true);
  };

  return (
    <div
      className="recipe-container recipe-bg-full"
      style={{ backgroundImage: `url(${recipeBg})` }}
    >
      {/* full-card dark overlay — everything sits on top of this */}
      <div className="recipe-full-overlay">

        {/* Header */}
        <div className="recipe-full-header">
          <h2 className="recipe-hero-title">Recipe Analyzer</h2>
          <p className="recipe-hero-sub">Paste ingredients to get the full calorie breakdown</p>
        </div>

        {/* Input form */}
        <form onSubmit={analyze} style={{ marginTop: 16 }}>
          <textarea
            className="recipe-textarea"
            placeholder={PLACEHOLDER}
            value={ingredients}
            onChange={(e) => { setIngredients(e.target.value); setSaved(false); }}
            rows={6}
          />
          <button type="submit" className="btn-analyze" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Analyzing..." : "Analyze Recipe"}
          </button>
        </form>

        {error && <p className="error-text" style={{ margin: "12px 0 0" }}>{error}</p>}

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>Calculating nutrition...</p>
          </div>
        )}

        {result && (
          <div className="recipe-result">
            <div className="recipe-header">
              <h3 className="nutrition-food-name">{result.recipe_name}</h3>
              <span className="nutrition-serving">Serves {result.servings}</span>
            </div>

            <div className="recipe-section-label">Per Serving</div>
            <div className="macros-grid">
              {[
                { label: "Calories", val: `${result.per_serving.calories} kcal` },
                { label: "Protein",  val: result.per_serving.protein },
                { label: "Carbs",    val: result.per_serving.carbohydrates },
                { label: "Fat",      val: result.per_serving.fat },
              ].map((m) => (
                <div key={m.label} className="macro-item">
                  <span className="macro-value">{m.val}</span>
                  <span className="macro-label">{m.label}</span>
                </div>
              ))}
            </div>

            {result.items?.length > 0 && (
              <>
                <div className="recipe-section-label" style={{ marginTop: 16 }}>Ingredient Breakdown</div>
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Amount</th>
                      <th>Calories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.ingredient}</td>
                        <td>{item.amount}</td>
                        <td>{item.calories} kcal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="total-row" style={{ marginTop: 12 }}>
              <span>Total (whole recipe)</span>
              <span className="total-value">{result.total.calories} kcal</span>
            </div>

            {result.notes && (
              <p className="notes-text"><strong>Note:</strong> {result.notes}</p>
            )}

            <button
              className={saved ? "btn-saved" : "btn-analyze"}
              onClick={handleSave}
              disabled={saved}
              style={{ marginTop: 16 }}
            >
              {saved ? "✓ Saved to Log (1 serving)" : "Save 1 Serving to Log"}
            </button>
          </div>
        )}

      </div>{/* end recipe-full-overlay */}
    </div>
  );
}
