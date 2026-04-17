export default function DailySummary({ todayMeals, todayCalories, yesterdayCalories, goal, streak, todayWaterMl, fastingState }) {
  const percent   = Math.min((todayCalories / goal) * 100, 100);
  const over      = todayCalories > goal;
  const diff      = todayCalories - yesterdayCalories;
  const waterPercent = Math.min((todayWaterMl / 2500) * 100, 100);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  // Most calorie-dense meal today
  const topMeal = todayMeals.length
    ? todayMeals.reduce((a, b) => (a.calories > b.calories ? a : b))
    : null;

  // Mood / status
  const status = over
    ? { icon: "⚠️", label: "Over goal", color: "var(--pink)" }
    : percent >= 90
    ? { icon: "✅", label: "Goal reached", color: "var(--green)" }
    : percent >= 50
    ? { icon: "🟡", label: "On track", color: "var(--amber)" }
    : { icon: "🔵", label: "Just started", color: "var(--cyan)" };

  // Keep fasting display color consistent

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="summary-container">
      <div className="summary-hero">
        <p className="summary-date">{dateStr}</p>
        <h2 className="summary-title">Good {timeOfDay} 👋</h2>
        <p className="summary-subtitle">Here's your day at a glance</p>
      </div>

      {/* Status card */}
      <div className="summary-status-card" style={{ borderColor: status.color + "33" }}>
        <span className="summary-status-icon">{status.icon}</span>
        <div>
          <div className="summary-status-label" style={{ color: status.color }}>{status.label}</div>
          <div className="summary-status-sub">
            {over
              ? `${todayCalories - goal} kcal over your daily goal`
              : `${goal - todayCalories} kcal remaining out of ${goal}`}
          </div>
        </div>
        <div className="summary-status-pct" style={{ color: status.color }}>
          {Math.round(percent)}%
        </div>
      </div>

      {/* Calorie ring */}
      <div className="summary-ring-card">
        <div className="summary-ring-wrap">
          {(() => {
            const R = 54, CIRC = 2 * Math.PI * R;
            const offset = CIRC * (1 - percent / 100);
            return (
              <svg viewBox="0 0 130 130" width="130" height="130">
                <defs>
                  <linearGradient id="sum-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={over ? "#FF3B30" : "#FF6000"} />
                    <stop offset="100%" stopColor={over ? "#FF6000" : "#FF9500"} />
                  </linearGradient>
                </defs>
                <circle cx="65" cy="65" r={R} fill="none" stroke="var(--s3)" strokeWidth="10" />
                <circle
                  cx="65" cy="65" r={R} fill="none"
                  stroke="url(#sum-grad)"
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={offset}
                  transform="rotate(-90 65 65)"
                  style={{ transition: "stroke-dashoffset .8s ease" }}
                />
              </svg>
            );
          })()}
          <div className="summary-ring-center">
            <span className="summary-ring-cal">{todayCalories}</span>
            <span className="summary-ring-lbl">kcal</span>
          </div>
        </div>

        <div className="summary-ring-stats">
          <div className="srs-item">
            <span className="srs-val">{todayMeals.length}</span>
            <span className="srs-lbl">Meals</span>
          </div>
          <div className="srs-item">
            <span className={`srs-val ${diff > 0 ? "up" : "down"}`}>
              {diff > 0 ? "+" : ""}{diff}
            </span>
            <span className="srs-lbl">vs yesterday</span>
          </div>
          <div className="srs-item">
            <span className="srs-val">{streak}🔥</span>
            <span className="srs-lbl">Day streak</span>
          </div>
        </div>
      </div>

      {/* Top meal */}
      {topMeal && (
        <div className="summary-card">
          <div className="summary-card-icon">🍽️</div>
          <div>
            <div className="summary-card-label">Biggest Meal</div>
            <div className="summary-card-val">{topMeal.name}</div>
            <div className="summary-card-sub">{topMeal.calories} kcal</div>
          </div>
        </div>
      )}

      {/* Water */}
      <div className="summary-card">
        <div className="summary-card-icon">💧</div>
        <div style={{ flex: 1 }}>
          <div className="summary-card-label">Water Intake</div>
          <div className="summary-card-val">{(todayWaterMl / 1000).toFixed(2)}L of 2.5L</div>
          <div className="summary-water-bar">
            <div className="summary-water-fill" style={{ width: `${waterPercent}%` }} />
          </div>
        </div>
        <div className="summary-card-sub" style={{ alignSelf: "center" }}>
          {Math.round(waterPercent)}%
        </div>
      </div>

      {/* Fasting */}
      {fastingState.active && (
        <div className="summary-card">
          <div className="summary-card-icon">⏱️</div>
          <div>
            <div className="summary-card-label">Fasting ({fastingState.protocol})</div>
            <div className="summary-card-val" style={{ color: "var(--orange)" }}>Active</div>
            <div className="summary-card-sub">
              Started {new Date(fastingState.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      )}

      {/* Yesterday comparison */}
      {yesterdayCalories > 0 && (
        <div className="summary-compare">
          <span className="summary-compare-label">Yesterday you had</span>
          <span className="summary-compare-val">{yesterdayCalories} kcal</span>
          <span className={`summary-compare-diff ${diff > 0 ? "more" : "less"}`}>
            {Math.abs(diff)} kcal {diff > 0 ? "more" : "less"} today
          </span>
        </div>
      )}

      {/* No meals yet */}
      {todayMeals.length === 0 && (
        <div className="summary-empty">
          <p>No meals logged today yet.</p>
          <p className="section-sub">Scan a photo or search for food to get started.</p>
        </div>
      )}
    </div>
  );
}
