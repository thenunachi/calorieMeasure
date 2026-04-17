import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY   = "calorie_meals";
const GOAL_KEY      = "calorie_goal";
const MACRO_GOAL_KEY= "macro_goals";
const PROFILE_KEY   = "user_profile";
const RECENT_KEY    = "recent_searches";
const PLANNER_KEY   = "meal_planner";
const WATER_KEY     = "water_log";
const WEIGHT_KEY    = "weight_log";
const FASTING_KEY   = "fasting_state";

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// Parse "30g" → 30
function parseMacro(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
}

// ── Streak helpers ─────────────────────────────
export function calcStreak(meals, goal) {
  const dayMap = {};
  meals.forEach((m) => {
    const d = new Date(m.date).toDateString();
    dayMap[d] = (dayMap[d] || 0) + (m.calories || 0);
  });
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toDateString();
    if (dayMap[key] !== undefined && dayMap[key] > 0 && dayMap[key] <= goal) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

export const BADGES = [
  { id: "first_bite",  label: "First Bite",      desc: "Logged your first meal",  icon: "🍽️", check: (m) => m.length >= 1   },
  { id: "week_streak", label: "One Week Strong",  desc: "7-day calorie streak",    icon: "🔥", streak: 7   },
  { id: "two_weeks",   label: "Two Week Warrior", desc: "14-day calorie streak",   icon: "⚡", streak: 14  },
  { id: "month",       label: "Month Champion",   desc: "30-day calorie streak",   icon: "🏆", streak: 30  },
  { id: "meals_10",    label: "Food Tracker",     desc: "Logged 10+ meals",        icon: "📊", check: (m) => m.length >= 10  },
  { id: "meals_50",    label: "Dedicated",        desc: "Logged 50+ meals",        icon: "💪", check: (m) => m.length >= 50  },
  { id: "century",     label: "Century",          desc: "100-day streak",          icon: "💯", streak: 100 },
  { id: "hydrated",    label: "Hydrated",         desc: "Hit water goal 3 days",   icon: "💧", special: "water" },
];

export function useMealLog() {
  const [meals, setMeals]               = useState(() => load(STORAGE_KEY, []));
  const [goal, setGoalState]            = useState(() => load(GOAL_KEY, 2000));
  const [macroGoals, setMacroGoalsState]= useState(() =>
    load(MACRO_GOAL_KEY, { protein: 150, carbs: 200, fat: 65 })
  );
  const [profile, setProfileState]      = useState(() =>
    load(PROFILE_KEY, { name: "", age: "", weight: "", height: "", gender: "male" })
  );
  const [recentSearches, setRecent]     = useState(() => load(RECENT_KEY, []));
  const [planner, setPlannerState]      = useState(() => load(PLANNER_KEY, {}));
  const [waterLog, setWaterLog]         = useState(() => load(WATER_KEY, []));
  const [weightLog, setWeightLog]       = useState(() => load(WEIGHT_KEY, []));
  const [fastingState, setFastingState] = useState(() =>
    load(FASTING_KEY, { active: false, protocol: "16:8", startTime: null })
  );

  // ── Meal log ──────────────────────────────────
  const addMeal = useCallback((meal) => {
    const entry = { id: Date.now(), date: new Date().toISOString(), ...meal };
    setMeals((prev) => { const u = [entry, ...prev]; save(STORAGE_KEY, u); return u; });
  }, []);
  const deleteMeal = useCallback((id) => {
    setMeals((prev) => { const u = prev.filter((m) => m.id !== id); save(STORAGE_KEY, u); return u; });
  }, []);

  // ── Goals ─────────────────────────────────────
  const setGoal = useCallback((v) => { setGoalState(v); save(GOAL_KEY, v); }, []);
  const setMacroGoals = useCallback((v) => { setMacroGoalsState(v); save(MACRO_GOAL_KEY, v); }, []);

  // ── Profile ───────────────────────────────────
  const setProfile = useCallback((v) => { setProfileState(v); save(PROFILE_KEY, v); }, []);

  // ── Recent searches ───────────────────────────
  const addRecentSearch = useCallback((food) => {
    setRecent((prev) => {
      const u = [food, ...prev.filter((f) => f.toLowerCase() !== food.toLowerCase())].slice(0, 6);
      save(RECENT_KEY, u); return u;
    });
  }, []);
  const clearRecentSearches = useCallback(() => { setRecent([]); save(RECENT_KEY, []); }, []);

  // ── Planner ───────────────────────────────────
  const addPlannerMeal = useCallback((dateKey, slot, item) => {
    setPlannerState((prev) => {
      const day = prev[dateKey] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
      const u = { ...prev, [dateKey]: { ...day, [slot]: [...(day[slot]||[]), { id: Date.now(), ...item }] } };
      save(PLANNER_KEY, u); return u;
    });
  }, []);
  const removePlannerMeal = useCallback((dateKey, slot, itemId) => {
    setPlannerState((prev) => {
      const day = prev[dateKey] || {};
      const u = { ...prev, [dateKey]: { ...day, [slot]: (day[slot]||[]).filter((i) => i.id !== itemId) } };
      save(PLANNER_KEY, u); return u;
    });
  }, []);


  // ── Water ─────────────────────────────────────
  const addWater = useCallback((ml) => {
    const entry = { id: Date.now(), date: new Date().toISOString(), ml };
    setWaterLog((prev) => { const u = [entry, ...prev]; save(WATER_KEY, u); return u; });
  }, []);
  const removeWater = useCallback((id) => {
    setWaterLog((prev) => { const u = prev.filter((w) => w.id !== id); save(WATER_KEY, u); return u; });
  }, []);

  // ── Weight ────────────────────────────────────
  const addWeight = useCallback((kg, date) => {
    const entry = { id: Date.now(), date: date || new Date().toISOString(), kg: parseFloat(kg) };
    setWeightLog((prev) => {
      const u = [entry, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date));
      save(WEIGHT_KEY, u); return u;
    });
  }, []);
  const removeWeight = useCallback((id) => {
    setWeightLog((prev) => { const u = prev.filter((w) => w.id !== id); save(WEIGHT_KEY, u); return u; });
  }, []);

  // ── Fasting ───────────────────────────────────
  const startFast = useCallback((protocol) => {
    const s = { active: true, protocol, startTime: new Date().toISOString() };
    setFastingState(s); save(FASTING_KEY, s);
  }, []);
  const stopFast = useCallback(() => {
    const s = { active: false, protocol: fastingState.protocol, startTime: null };
    setFastingState(s); save(FASTING_KEY, s);
  }, [fastingState.protocol]);

  // ── Derived: today ────────────────────────────
  const todayStr       = new Date().toDateString();
  const todayMeals     = meals.filter((m) => new Date(m.date).toDateString() === todayStr);
  const todayCalories  = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);

  const yesterdayStr   = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toDateString(); })();
  const yesterdayCalories = meals
    .filter((m) => new Date(m.date).toDateString() === yesterdayStr)
    .reduce((s, m) => s + (m.calories || 0), 0);

  // ── Derived: today macros ─────────────────────
  const todayMacros = useMemo(() => {
    return todayMeals.reduce((acc, m) => ({
      protein: acc.protein + parseMacro(m.protein),
      carbs:   acc.carbs   + parseMacro(m.carbs),
      fat:     acc.fat     + parseMacro(m.fat),
    }), { protein: 0, carbs: 0, fat: 0 });
  }, [todayMeals]);

  // ── Weekly chart ──────────────────────────────
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label   = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.toDateString();
    const calories = meals.filter((m) => new Date(m.date).toDateString() === dateStr)
      .reduce((s, m) => s + (m.calories || 0), 0);
    return { day: label, calories, isToday: dateStr === todayStr };
  });

  // ── Water today ───────────────────────────────
  const todayWaterMl = waterLog
    .filter((w) => new Date(w.date).toDateString() === todayStr)
    .reduce((s, w) => s + w.ml, 0);

  // ── Streak & badges ───────────────────────────
  const streak       = useMemo(() => calcStreak(meals, goal), [meals, goal]);
  const earnedBadges = useMemo(() => BADGES.filter((b) => {
    if (b.streak) return streak >= b.streak;
    if (b.check)  return b.check(meals);
    return false;
  }), [meals, streak]);

  return {
    meals, todayMeals, todayCalories, yesterdayCalories, weeklyData,
    goal, setGoal,
    macroGoals, setMacroGoals, todayMacros,
    profile, setProfile,
    recentSearches, addRecentSearch, clearRecentSearches,
    addMeal, deleteMeal,
    planner, addPlannerMeal, removePlannerMeal,
    waterLog, todayWaterMl, addWater, removeWater,
    weightLog, addWeight, removeWeight,
    fastingState, startFast, stopFast,
    streak, earnedBadges,
  };
}
