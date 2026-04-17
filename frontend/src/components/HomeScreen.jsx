const R = 88;
const CIRC = 2 * Math.PI * R;
const EMOJIS = ["🍔","🍕","🍜","🥗","🍱","🌮","🍣","🥩","🍝","🥘","🍛","🥙","🧆","🥪","🌯"];
const getEmoji = (i) => EMOJIS[i % EMOJIS.length];

const SOURCE_META = {
  scan:    { label: "Scan",    color: "#FF6000" },
  search:  { label: "Search",  color: "#AF52DE" },
  barcode: { label: "Barcode", color: "#FF9500" },
  recipe:  { label: "Recipe",  color: "#34C759" },
};

export default function HomeScreen({ todayMeals, todayCalories, goal, deleteMeal, onScanClick }) {
  const remaining = Math.max(goal - todayCalories, 0);
  const percent   = Math.min(todayCalories / goal, 1);
  const offset    = CIRC * (1 - percent);
  const over      = todayCalories > goal;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr  = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="hs-root">

      {/* ── HERO ─────────────────────────────────────── */}
      <div className="hs-hero">
        <div className="hs-hero-text">
          <p className="hs-date">{dateStr}</p>
          <h2 className="hs-greeting">{greeting} <span>👋</span></h2>
        </div>

        {/* Ring */}
        <div className="hs-ring-wrap">
          <svg viewBox="0 0 220 220" className="hs-ring-svg">
            <defs>
              <linearGradient id="grad-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#FF6000"/>
                <stop offset="100%" stopColor="#FF9500"/>
              </linearGradient>
              <linearGradient id="grad-over" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#FF3B30"/>
                <stop offset="100%" stopColor="#FF6000"/>
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="110" cy="110" r={R} fill="none" stroke="#E5E5EA" strokeWidth="16"/>
            {/* Progress arc */}
            <circle
              cx="110" cy="110" r={R} fill="none"
              stroke={over ? "url(#grad-over)" : "url(#grad-ok)"}
              strokeWidth="16" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              transform="rotate(-90 110 110)"
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
            />
          </svg>

          <div className="hs-ring-center">
            <span className="hs-ring-num">{over ? todayCalories - goal : remaining}</span>
            <span className="hs-ring-lbl">kcal</span>
            <span className="hs-ring-sub">{over ? "⚠ over goal" : "remaining"}</span>
          </div>
        </div>

        {/* Goal summary row */}
        <div className="hs-ring-goal">
          <div className="hs-rg-item">
            <span className="hs-rg-val">{todayCalories}</span>
            <span className="hs-rg-lbl">Eaten</span>
          </div>
          <div className="hs-rg-sep"/>
          <div className="hs-rg-item">
            <span className="hs-rg-val">{goal}</span>
            <span className="hs-rg-lbl">Goal</span>
          </div>
          <div className="hs-rg-sep"/>
          <div className="hs-rg-item">
            <span className="hs-rg-val">{Math.round(percent * 100)}%</span>
            <span className="hs-rg-lbl">Done</span>
          </div>
        </div>
      </div>

      {/* ── BENTO STATS ──────────────────────────────── */}
      <div className="hs-bento">
        <div className="hs-bento-card" style={{"--accent":"#FF6000"}}>
          <span className="hbc-icon">🔥</span>
          <span className="hbc-num">{todayCalories}</span>
          <span className="hbc-lbl">eaten</span>
        </div>
        <div className="hs-bento-card" style={{"--accent":"#AF52DE"}}>
          <span className="hbc-icon">🍽️</span>
          <span className="hbc-num">{todayMeals.length}</span>
          <span className="hbc-lbl">meals</span>
        </div>
        <div className="hs-bento-card" style={{"--accent":"#34C759"}}>
          <span className="hbc-icon">🎯</span>
          <span className="hbc-num">{Math.max(goal - todayCalories, 0)}</span>
          <span className="hbc-lbl">left</span>
        </div>
      </div>


      {/* ── MEALS ────────────────────────────────────── */}
      <div className="hs-meals">
        <div className="hs-meals-header">
          <h3 className="hs-meals-title">Today's Meals</h3>
          <button className="hs-add-btn" onClick={onScanClick}>＋ Add</button>
        </div>

        {todayMeals.length === 0 ? (
          <div className="hs-empty">
            <div className="hs-empty-plate">🍽️</div>
            <p className="hs-empty-h">Nothing logged yet</p>
            <p className="hs-empty-p">Scan a photo or search a food to start tracking</p>
            <button className="hs-empty-cta" onClick={onScanClick}>Scan your plate</button>
          </div>
        ) : (
          <div className="hs-cards-grid">
            {todayMeals.map((meal, i) => {
              const src = SOURCE_META[meal.source] || SOURCE_META.scan;
              return (
                <div key={meal.id} className="hs-card" style={{"--c": src.color}}>
                  <div className="hs-card-glow"/>
                  <button className="hs-card-del" onClick={() => deleteMeal(meal.id)}>✕</button>
                  <span className="hs-card-emoji">{getEmoji(i)}</span>
                  <div className="hs-card-cal">
                    {meal.calories}
                    <span className="hs-card-unit"> kcal</span>
                  </div>
                  <div className="hs-card-name">{meal.name}</div>
                  <div className="hs-card-tag" style={{ color: src.color, borderColor: `${src.color}33` }}>
                    {src.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
