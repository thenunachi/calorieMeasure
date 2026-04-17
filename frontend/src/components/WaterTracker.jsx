import { useState } from "react";

const PRESETS = [150, 200, 250, 350, 500];
const DAILY_GOAL_ML = 2500;
const GLASS_ML = 250;

export default function WaterTracker({ waterLog, todayWaterMl, addWater, removeWater }) {
  const [custom, setCustom] = useState("");

  const todayStr  = new Date().toDateString();
  const todayLogs = waterLog.filter((w) => new Date(w.date).toDateString() === todayStr);

  const percent  = Math.min((todayWaterMl / DAILY_GOAL_ML) * 100, 100);
  const glasses  = Math.round(todayWaterMl / GLASS_ML);
  const goalGlasses = Math.ceil(DAILY_GOAL_ML / GLASS_ML);
  const remaining = Math.max(DAILY_GOAL_ML - todayWaterMl, 0);

  const handleCustom = (e) => {
    e.preventDefault();
    const ml = parseInt(custom);
    if (ml > 0 && ml <= 2000) { addWater(ml); setCustom(""); }
  };

  return (
    <div className="water-container">
      {/* Header */}
      <div className="water-header">
        <h2 className="section-title">Water Tracker</h2>
        <p className="section-sub">Daily goal: {DAILY_GOAL_ML / 1000}L</p>
      </div>

      {/* Big fill visual */}
      <div className="water-visual">
        <div className="water-bottle">
          <div className="water-fill" style={{ height: `${percent}%` }}>
            <div className="water-wave" />
          </div>
          <div className="water-bottle-label">
            <span className="water-ml">{(todayWaterMl / 1000).toFixed(2)}L</span>
            <span className="water-ml-sub">of {DAILY_GOAL_ML / 1000}L</span>
          </div>
        </div>

        <div className="water-stats">
          <div className="water-stat-item">
            <span className="wstat-val">{glasses}</span>
            <span className="wstat-lbl">glasses</span>
          </div>
          <div className="water-stat-item">
            <span className="wstat-val">{percent >= 100 ? "✓" : `${Math.round(percent)}%`}</span>
            <span className="wstat-lbl">of goal</span>
          </div>
          <div className="water-stat-item">
            <span className="wstat-val">{remaining > 0 ? `${remaining}ml` : "Done!"}</span>
            <span className="wstat-lbl">remaining</span>
          </div>
        </div>
      </div>

      {/* Goal met banner */}
      {todayWaterMl >= DAILY_GOAL_ML && (
        <div className="water-goal-met">💧 Daily water goal reached! Great job!</div>
      )}

      {/* Quick add presets */}
      <div className="water-presets-label">Quick Add</div>
      <div className="water-presets">
        {PRESETS.map((ml) => (
          <button key={ml} className="water-preset-btn" onClick={() => addWater(ml)}>
            +{ml}ml
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <form onSubmit={handleCustom} className="water-custom-form">
        <input
          className="planner-input"
          type="number"
          placeholder="Custom ml (e.g. 330)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          min="1" max="2000"
        />
        <button type="submit" className="btn-analyze" style={{ width: "auto", padding: "10px 20px" }}>
          Add
        </button>
      </form>

      {/* Glasses progress dots */}
      <div className="water-glasses-row">
        {Array.from({ length: goalGlasses }, (_, i) => (
          <div key={i} className={`water-glass-dot ${i < glasses ? "filled" : ""}`}>💧</div>
        ))}
      </div>

      {/* Today's log */}
      {todayLogs.length > 0 && (
        <div className="water-log-card">
          <h3 className="section-title" style={{ fontSize: ".88rem", marginBottom: 8 }}>Today's Log</h3>
          {todayLogs.map((w) => (
            <div key={w.id} className="water-log-item">
              <span className="water-log-time">
                {new Date(w.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="water-log-amount">💧 {w.ml}ml</span>
              <button className="planner-item-del" onClick={() => removeWater(w.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
