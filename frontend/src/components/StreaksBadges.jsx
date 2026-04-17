import { BADGES } from "../hooks/useMealLog";

function StreakRing({ streak, goal = 30 }) {
  const R = 70, CIRC = 2 * Math.PI * R;
  const percent = Math.min(streak / goal, 1);
  const offset  = CIRC * (1 - percent);
  return (
    <svg viewBox="0 0 180 180" className="streak-ring-svg">
      <defs>
        <linearGradient id="streak-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r={R} fill="none" stroke="var(--s3)" strokeWidth="12" />
      <circle
        cx="90" cy="90" r={R} fill="none"
        stroke="url(#streak-grad)"
        strokeWidth="12" strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
        style={{ transition: "stroke-dashoffset .8s ease" }}
      />
    </svg>
  );
}

const MILESTONES = [1, 3, 7, 14, 30, 60, 100];

export default function StreaksBadges({ streak, earnedBadges, meals, goal }) {
  const nextMilestone = MILESTONES.find((m) => m > streak) || null;

  // Most eaten food today
  const todayStr  = new Date().toDateString();
  const todayMeals = meals.filter((m) => new Date(m.date).toDateString() === todayStr);

  return (
    <div className="streaks-container">
      <h2 className="section-title">Streaks & Badges</h2>
      <p className="section-sub">Stay consistent to earn rewards</p>

      {/* Current streak ring */}
      <div className="streak-hero">
        <div className="streak-ring-wrap">
          <StreakRing streak={streak} goal={nextMilestone || 30} />
          <div className="streak-ring-center">
            <span className="streak-num">{streak}</span>
            <span className="streak-lbl">day{streak !== 1 ? "s" : ""}</span>
            <span className="streak-fire">🔥</span>
          </div>
        </div>
        <div className="streak-meta">
          <div className="streak-meta-item">
            <span className="sm-val">{streak}</span>
            <span className="sm-lbl">Current streak</span>
          </div>
          {nextMilestone && (
            <div className="streak-meta-item">
              <span className="sm-val">{nextMilestone - streak}</span>
              <span className="sm-lbl">days to next badge</span>
            </div>
          )}
          <div className="streak-meta-item">
            <span className="sm-val">{earnedBadges.length}</span>
            <span className="sm-lbl">badges earned</span>
          </div>
          <div className="streak-meta-item">
            <span className="sm-val">{meals.length}</span>
            <span className="sm-lbl">meals logged</span>
          </div>
        </div>
      </div>

      {/* Next milestone progress */}
      {nextMilestone && (
        <div className="streak-milestone">
          <div className="streak-milestone-header">
            <span>Next milestone: <strong>{nextMilestone}-day streak</strong></span>
            <span className="streak-milestone-pct">{streak}/{nextMilestone}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(streak / nextMilestone) * 100}%`,
                background: "linear-gradient(90deg,#f59e0b,#ef4444)",
              }}
            />
          </div>
        </div>
      )}

      {/* Earned badges */}
      <div className="badges-section">
        <h3 className="badges-title">
          Earned Badges <span className="badges-count">{earnedBadges.length}/{BADGES.length}</span>
        </h3>
        <div className="badges-grid">
          {BADGES.map((badge) => {
            const earned = earnedBadges.some((b) => b.id === badge.id);
            return (
              <div key={badge.id} className={`badge-card${earned ? " earned" : " locked"}`}>
                <span className="badge-icon">{earned ? badge.icon : "🔒"}</span>
                <span className="badge-label">{badge.label}</span>
                <span className="badge-desc">{badge.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak tips */}
      {streak === 0 && (
        <div className="streak-tip">
          🎯 Log today's meals and stay within your {goal} kcal goal to start your streak!
        </div>
      )}
      {streak > 0 && streak < 7 && (
        <div className="streak-tip">
          🔥 You're on a {streak}-day streak! Keep going to unlock the 7-day badge!
        </div>
      )}
    </div>
  );
}
