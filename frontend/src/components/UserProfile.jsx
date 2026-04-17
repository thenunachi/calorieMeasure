import { useState } from "react";

const ACTIVITY = [
  { value: 1.2,   label: "Sedentary (little/no exercise)" },
  { value: 1.375, label: "Lightly active (1–3 days/week)" },
  { value: 1.55,  label: "Moderately active (3–5 days/week)" },
  { value: 1.725, label: "Very active (6–7 days/week)" },
  { value: 1.9,   label: "Extra active (physical job)" },
];

const ACTIVITY_LABEL = Object.fromEntries(ACTIVITY.map((a) => [a.value, a.label]));

function calcBMR(profile) {
  const { age, weight, height, gender } = profile;
  const a = parseFloat(age), w = parseFloat(weight), h = parseFloat(height);
  if (!a || !w || !h) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === "male" ? base + 5 : base - 161;
}

const EMPTY = { name: "", age: "", gender: "male", weight: "", height: "" };

export default function UserProfile({ profile, setProfile, setGoal, goal }) {
  const isNew = !profile.name && !profile.age && !profile.weight && !profile.height;
  const [editing, setEditing] = useState(isNew);
  const [form, setForm]       = useState(profile);
  const [activity, setActivity] = useState(1.55);

  const bmr  = calcBMR(editing ? form : profile);
  const tdee = bmr ? Math.round(bmr * activity) : null;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = () => {
    setProfile(form);
    if (tdee) setGoal(tdee);
    setEditing(false);
  };

  const handleReset = () => {
    setForm(EMPTY);
    setProfile(EMPTY);
    setEditing(true);
  };

  /* ── Saved view ─────────────────────────────── */
  if (!editing) {
    const savedBMR  = calcBMR(profile);
    const savedTDEE = savedBMR ? Math.round(savedBMR * activity) : null;
    return (
      <div className="profile-container">
        <div className="profile-saved-header">
          <h2 className="section-title">Your Profile</h2>
          <div className="profile-saved-actions">
            <button className="btn-outline-sm" onClick={() => { setForm(profile); setEditing(true); }}>Edit</button>
            <button className="btn-danger-sm"  onClick={handleReset}>Reset</button>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">{profile.name ? profile.name[0].toUpperCase() : "?"}</div>
          <div className="profile-card-info">
            <div className="profile-card-name">{profile.name || "—"}</div>
            <div className="profile-card-sub">
              {profile.age ? `${profile.age} yrs` : ""}
              {profile.age && profile.gender ? " · " : ""}
              {profile.gender ? (profile.gender === "male" ? "Male" : "Female") : ""}
            </div>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat">
            <span className="pstat-val">{profile.weight || "—"}</span>
            <span className="pstat-lbl">kg</span>
          </div>
          <div className="profile-stat">
            <span className="pstat-val">{profile.height || "—"}</span>
            <span className="pstat-lbl">cm</span>
          </div>
          <div className="profile-stat">
            <span className="pstat-val">{savedBMR ? Math.round(savedBMR) : "—"}</span>
            <span className="pstat-lbl">BMR kcal</span>
          </div>
          <div className="profile-stat highlight">
            <span className="pstat-val">{savedTDEE || "—"}</span>
            <span className="pstat-lbl">TDEE kcal</span>
          </div>
        </div>

        <div className="profile-goal-row">
          <span className="profile-goal-label">Daily Goal</span>
          <span className="profile-goal-val">{goal} kcal</span>
        </div>

        <div className="profile-activity-row">
          <span className="pstat-lbl">Activity</span>
          <span className="profile-activity-tag">{ACTIVITY_LABEL[activity]}</span>
        </div>
      </div>
    );
  }

  /* ── Edit / New view ────────────────────────── */
  return (
    <div className="profile-container">
      <h2 className="section-title">Your Profile</h2>
      <p className="section-sub">We use this to calculate your daily calorie target (TDEE)</p>

      <div className="profile-form">
        <div className="form-row">
          <label>Name</label>
          <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handleChange} className="form-input" />
        </div>

        <div className="form-row-2">
          <div className="form-row">
            <label>Age</label>
            <input name="age" type="number" placeholder="e.g. 25" value={form.age} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="form-input">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-row">
            <label>Weight (kg)</label>
            <input name="weight" type="number" placeholder="e.g. 70" value={form.weight} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Height (cm)</label>
            <input name="height" type="number" placeholder="e.g. 170" value={form.height} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="form-row">
          <label>Activity Level</label>
          <select className="form-input" value={activity} onChange={(e) => setActivity(parseFloat(e.target.value))}>
            {ACTIVITY.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {bmr && (
        <div className="bmr-card">
          <div className="bmr-row">
            <span>BMR (base metabolism)</span>
            <strong>{Math.round(bmr)} kcal/day</strong>
          </div>
          <div className="bmr-row highlight">
            <span>TDEE (with activity)</span>
            <strong>{tdee} kcal/day</strong>
          </div>
          <p className="bmr-note">TDEE = calories to maintain your current weight</p>
        </div>
      )}

      <div className="goal-row">
        <label>Daily Calorie Goal</label>
        <div className="goal-input-row">
          <input
            type="number"
            className="form-input goal-input"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
          <span className="goal-unit">kcal</span>
        </div>
        {tdee && (
          <button className="btn-link" onClick={() => setGoal(tdee)}>
            Use TDEE ({tdee})
          </button>
        )}
      </div>

      <button className="btn-analyze" onClick={handleSave}>Save Profile</button>
    </div>
  );
}
