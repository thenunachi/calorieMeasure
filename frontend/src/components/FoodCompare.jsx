import { useState } from "react";

const BACKEND_URL = "/api";

async function fetchFood(name) {
  const res = await fetch(`${BACKEND_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ food: name }),
  });
  return res.json();
}

function parseG(str) {
  return parseFloat((str || "0").replace(/[^0-9.]/g, "")) || 0;
}

function WinBadge({ wins }) {
  return wins ? <span className="win-badge">✓ Better</span> : null;
}

export default function FoodCompare() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftResult, setLeftResult] = useState(null);
  const [rightResult, setRightResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const compare = async (e) => {
    e.preventDefault();
    if (!left.trim() || !right.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const [l, r] = await Promise.all([fetchFood(left), fetchFood(right)]);
      setLeftResult(l);
      setRightResult(r);
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const metrics = leftResult && rightResult ? [
    {
      label: "Calories",
      left: leftResult.calories,
      right: rightResult.calories,
      unit: "kcal",
      lowerIsBetter: true,
    },
    {
      label: "Protein",
      left: parseG(leftResult.macros?.protein),
      right: parseG(rightResult.macros?.protein),
      unit: "g",
      lowerIsBetter: false,
    },
    {
      label: "Carbs",
      left: parseG(leftResult.macros?.carbohydrates),
      right: parseG(rightResult.macros?.carbohydrates),
      unit: "g",
      lowerIsBetter: true,
    },
    {
      label: "Fat",
      left: parseG(leftResult.macros?.fat),
      right: parseG(rightResult.macros?.fat),
      unit: "g",
      lowerIsBetter: true,
    },
    {
      label: "Fiber",
      left: parseG(leftResult.macros?.fiber),
      right: parseG(rightResult.macros?.fiber),
      unit: "g",
      lowerIsBetter: false,
    },
  ] : [];

  const leftWins = metrics.filter(m =>
    m.lowerIsBetter ? m.left < m.right : m.left > m.right
  ).length;
  const rightWins = metrics.filter(m =>
    m.lowerIsBetter ? m.right < m.left : m.right > m.left
  ).length;

  return (
    <div className="compare-container">
      <h2 className="section-title">Compare Foods</h2>
      <p className="section-sub">Enter two foods to see which is healthier</p>

      <form onSubmit={compare} className="compare-form">
        <input
          className="search-input"
          placeholder="Food A (e.g. rice)"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
        <span className="vs-badge">VS</span>
        <input
          className="search-input"
          placeholder="Food B (e.g. roti)"
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Compare"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {leftResult && rightResult && (
        <div className="compare-result">
          {/* Header */}
          <div className="compare-header">
            <div className="compare-food-name">
              {leftResult.food}
              {leftWins > rightWins && <span className="winner-badge">🏆 Winner</span>}
            </div>
            <div className="compare-food-name right">
              {rightWins > leftWins && <span className="winner-badge">🏆 Winner</span>}
              {rightResult.food}
            </div>
          </div>

          {/* Metrics */}
          {metrics.map((m, i) => {
            const leftWin = m.lowerIsBetter ? m.left < m.right : m.left > m.right;
            const rightWin = m.lowerIsBetter ? m.right < m.left : m.right > m.left;
            return (
              <div key={i} className="compare-row">
                <div className={`compare-cell ${leftWin ? "win" : ""}`}>
                  <span className="compare-val">{m.left}{m.unit}</span>
                  <WinBadge wins={leftWin} />
                </div>
                <div className="compare-label">{m.label}</div>
                <div className={`compare-cell right ${rightWin ? "win" : ""}`}>
                  <WinBadge wins={rightWin} />
                  <span className="compare-val">{m.right}{m.unit}</span>
                </div>
              </div>
            );
          })}

          <p className="compare-note">
            {leftWins > rightWins
              ? `${leftResult.food} wins on ${leftWins}/${metrics.length} metrics`
              : rightWins > leftWins
              ? `${rightResult.food} wins on ${rightWins}/${metrics.length} metrics`
              : "Both foods are evenly matched!"}
          </p>
        </div>
      )}
    </div>
  );
}
