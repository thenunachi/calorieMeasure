import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function WeightLog({ weightLog, addWeight, removeWeight }) {
  const [kg, setKg]       = useState("");
  const [date, setDate]   = useState(() => new Date().toISOString().split("T")[0]);
  const [showAll, setShowAll] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!kg || isNaN(parseFloat(kg))) return;
    addWeight(kg, new Date(date + "T12:00:00").toISOString());
    setKg("");
  };

  const chartData = weightLog.map((w) => ({
    date:  new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    kg:    w.kg,
    id:    w.id,
  }));

  const latest   = weightLog[weightLog.length - 1];
  const first    = weightLog[0];
  const change   = latest && first && weightLog.length > 1
    ? (latest.kg - first.kg).toFixed(1)
    : null;
  const avg      = weightLog.length
    ? (weightLog.reduce((s, w) => s + w.kg, 0) / weightLog.length).toFixed(1)
    : null;

  const displayLog = showAll ? [...weightLog].reverse() : [...weightLog].reverse().slice(0, 7);

  return (
    <div className="weight-container">
      <div className="weight-header">
        <h2 className="section-title">Weight Log</h2>
        <p className="section-sub">{weightLog.length} entries</p>
      </div>

      {/* Stats strip */}
      {weightLog.length > 0 && (
        <div className="weight-stats">
          <div className="weight-stat">
            <span className="wt-val">{latest?.kg}kg</span>
            <span className="wt-lbl">Current</span>
          </div>
          {change !== null && (
            <div className="weight-stat">
              <span className={`wt-val ${parseFloat(change) < 0 ? "down" : "up"}`}>
                {parseFloat(change) > 0 ? "+" : ""}{change}kg
              </span>
              <span className="wt-lbl">Total change</span>
            </div>
          )}
          <div className="weight-stat">
            <span className="wt-val">{avg}kg</span>
            <span className="wt-lbl">Average</span>
          </div>
          <div className="weight-stat">
            <span className="wt-val">{Math.min(...weightLog.map(w=>w.kg))}kg</span>
            <span className="wt-lbl">Lowest</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {weightLog.length >= 2 && (
        <div className="weight-chart-card">
          <h3 className="chart-title">Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false} tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(v) => [`${v} kg`, "Weight"]}
                contentStyle={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
              />
              {avg && <ReferenceLine y={parseFloat(avg)} stroke="var(--purple)" strokeDasharray="4 4" strokeOpacity={0.5} />}
              <Line
                type="monotone" dataKey="kg"
                stroke="var(--purple)" strokeWidth={2.5}
                dot={{ fill: "var(--purple)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-legend">Dashed line = average weight</p>
        </div>
      )}

      {/* Add entry */}
      <div className="weight-add-card">
        <h3 className="section-title" style={{ fontSize: ".9rem", marginBottom: 12 }}>Log Weight</h3>
        <form onSubmit={handleAdd} className="weight-add-form">
          <div className="weight-form-row">
            <div className="form-row" style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input
                className="form-input"
                type="number" step="0.1" placeholder="e.g. 72.5"
                value={kg} onChange={(e) => setKg(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-row" style={{ flex: 1 }}>
              <label>Date</label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-analyze" style={{ marginTop: 4 }}>Log Weight</button>
        </form>
      </div>

      {/* History */}
      {weightLog.length > 0 && (
        <div className="weight-history-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 className="section-title" style={{ fontSize: ".9rem" }}>History</h3>
            {weightLog.length > 7 && (
              <button className="btn-link" onClick={() => setShowAll(s => !s)}>
                {showAll ? "Show less" : `Show all (${weightLog.length})`}
              </button>
            )}
          </div>
          {displayLog.map((w) => (
            <div key={w.id} className="weight-log-item">
              <span className="weight-log-date">
                {new Date(w.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <span className="weight-log-val">{w.kg} kg</span>
              <button className="planner-item-del" onClick={() => removeWeight(w.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {weightLog.length === 0 && (
        <div className="library-empty">
          <div className="library-empty-icon">⚖️</div>
          <p className="hs-empty-h">No weight logged yet</p>
          <p className="hs-empty-p">Track your weight over time to see trends</p>
        </div>
      )}
    </div>
  );
}
