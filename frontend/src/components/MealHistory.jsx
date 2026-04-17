import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

function exportCSV(meals) {
  const header = ["Date", "Time", "Food Name", "Calories (kcal)", "Source"];
  const rows = meals.map((m) => {
    const d = new Date(m.date);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      `"${m.name.replace(/"/g, '""')}"`,
      m.calories,
      m.source || "manual",
    ];
  });
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  download("meal-history.csv", "text/csv", csv);
}

function exportJSON(meals) {
  const data = meals.map((m) => ({
    date:     m.date,
    name:     m.name,
    calories: m.calories,
    source:   m.source || "manual",
  }));
  download("meal-history.json", "application/json", JSON.stringify(data, null, 2));
}

function download(filename, type, content) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function MealHistory({ meals, todayMeals, todayCalories, weeklyData, goal, deleteMeal }) {
  const percent   = Math.min((todayCalories / goal) * 100, 100);
  const remaining = Math.max(goal - todayCalories, 0);
  const over      = todayCalories > goal;

  return (
    <div className="history-container">

      {/* Daily Goal Progress */}
      <div className="goal-card">
        <div className="goal-header">
          <span className="section-title">Today's Progress</span>
          <span className="goal-fraction">
            <strong style={{ color: over ? "var(--pink)" : "var(--green)" }}>{todayCalories}</strong>
            <span> / {goal} kcal</span>
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${percent}%`, background: over ? "var(--pink)" : "var(--orange)" }}
          />
        </div>
        <p className="goal-sub">
          {over
            ? `⚠️ ${todayCalories - goal} kcal over your goal`
            : remaining === 0
            ? "✓ Goal reached!"
            : `${remaining} kcal remaining`}
        </p>
      </div>

      {/* Weekly Chart */}
      <div className="chart-card">
        <h3 className="chart-title">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} barSize={28}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`${v} kcal`, "Calories"]}
              contentStyle={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
            <ReferenceLine y={goal} stroke="var(--green)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell key={i} fill={entry.isToday ? "var(--orange)" : "var(--s3)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="chart-legend">Dashed line = your daily goal</p>
      </div>

      {/* Today's Meal Log */}
      <div className="meal-log">
        <h3 className="section-title">Today's Meals</h3>
        {todayMeals.length === 0 ? (
          <div className="empty-log">
            <p>No meals logged yet today.</p>
            <p className="section-sub">Scan a photo or search a food, then tap "Save to Log".</p>
          </div>
        ) : (
          <div className="meal-list">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="meal-item">
                <div className="meal-info">
                  <span className="meal-name">{meal.name}</span>
                  <span className="meal-time">
                    {new Date(meal.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="meal-right">
                  <span className="meal-cal" style={{color:"var(--orange)"}}>{meal.calories} kcal</span>
                  <button className="btn-delete" onClick={() => deleteMeal(meal.id)} aria-label="Delete">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="export-card">
        <div className="export-card-header">
          <div>
            <h3 className="section-title">Export History</h3>
            <p className="section-sub">{meals.length} total meals logged</p>
          </div>
        </div>
        <div className="export-desc">
          Download your complete meal log — great for sharing with a nutritionist or tracking in a spreadsheet.
        </div>
        <div className="export-btns-row">
          <button
            className="export-btn-main"
            onClick={() => exportCSV(meals)}
            disabled={meals.length === 0}
          >
            <span className="export-btn-icon">📊</span>
            <div>
              <div className="export-btn-title">Download CSV</div>
              <div className="export-btn-sub">Opens in Excel, Sheets</div>
            </div>
          </button>
          <button
            className="export-btn-main"
            onClick={() => exportJSON(meals)}
            disabled={meals.length === 0}
          >
            <span className="export-btn-icon">📋</span>
            <div>
              <div className="export-btn-title">Download JSON</div>
              <div className="export-btn-sub">Raw data format</div>
            </div>
          </button>
        </div>
        {meals.length === 0 && (
          <p className="export-empty">Log some meals first to enable export.</p>
        )}
      </div>

    </div>
  );
}
