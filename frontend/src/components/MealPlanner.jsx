import { useState } from "react";

const BACKEND_URL = "/api";

const SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "lunch",     label: "Lunch",     icon: "☀️"  },
  { key: "dinner",    label: "Dinner",    icon: "🌙"  },
  { key: "snacks",    label: "Snacks",    icon: "🍎"  },
];

function getWeekDates(offsetWeeks = 0) {
  const today  = new Date();
  const day    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7) + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateKey(d) { return d.toISOString().split("T")[0]; }

function dayTotal(dayPlan) {
  return Object.values(dayPlan || {}).flat().reduce((s, m) => s + (m.calories || 0), 0);
}

function parseMacroNum(val) {
  if (!val) return undefined;
  return parseFloat(String(val).replace(/[^0-9.]/g, "")) || undefined;
}

export default function MealPlanner({ planner, addPlannerMeal, removePlannerMeal, goal }) {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [addingSlot, setAddingSlot]   = useState(null);

  // Search state
  const [query, setQuery]       = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError]   = useState(null);

  const weekDates = getWeekDates(weekOffset);
  const todayKey  = dateKey(new Date());
  const dayPlan   = planner[selectedDate] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
  const total     = dayTotal(dayPlan);
  const over      = total > goal;

  const openSlot = (slotKey) => {
    setAddingSlot(slotKey);
    setQuery(""); setSearchResult(null); setSearchError(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setSearchResult(null); setSearchError(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setSearchError(data.error || "Not found.");
      else setSearchResult(data);
    } catch {
      setSearchError("Could not connect to server.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromResult = () => {
    if (!searchResult) return;
    addPlannerMeal(selectedDate, addingSlot, {
      name:     searchResult.food,
      calories: searchResult.calories,
      protein:  parseMacroNum(searchResult.macros?.protein),
      carbs:    parseMacroNum(searchResult.macros?.carbohydrates),
      fat:      parseMacroNum(searchResult.macros?.fat),
    });
    setAddingSlot(null);
    setQuery(""); setSearchResult(null);
  };

  return (
    <div className="planner-container">

      {/* ── Week strip ────────────────────────────── */}
      <div className="planner-week-header">
        <button className="planner-week-nav" onClick={() => setWeekOffset(w => w - 1)}>‹</button>
        <span className="planner-week-label">
          {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <button className="planner-week-nav" onClick={() => setWeekOffset(w => w + 1)}>›</button>
      </div>

      <div className="planner-days">
        {weekDates.map((d) => {
          const key      = dateKey(d);
          const dayTotal_ = dayTotal(planner[key]);
          const isToday  = key === todayKey;
          const isActive = key === selectedDate;
          return (
            <button
              key={key}
              className={`planner-day-btn${isActive ? " active" : ""}${isToday ? " today" : ""}`}
              onClick={() => setSelectedDate(key)}
            >
              <span className="pdb-weekday">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="pdb-date">{d.getDate()}</span>
              {dayTotal_ > 0 && <span className="pdb-cal">{dayTotal_}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Day summary bar ──────────────────────── */}
      <div className="planner-summary">
        <div className="planner-summary-left">
          <span className="planner-date-label">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </span>
          <span className={`planner-total ${over ? "over" : ""}`}>
            {total} <span>/ {goal} kcal</span>
          </span>
        </div>
        <div className="planner-progress-wrap">
          <div
            className="planner-progress-fill"
            style={{
              width: `${Math.min((total / goal) * 100, 100)}%`,
              background: over ? "var(--pink)" : "var(--orange)",
            }}
          />
        </div>
      </div>

      {/* ── Meal slots ───────────────────────────── */}
      <div className="planner-slots">
        {SLOTS.map((slot) => {
          const items     = dayPlan[slot.key] || [];
          const slotTotal = items.reduce((s, m) => s + (m.calories || 0), 0);
          const isAdding  = addingSlot === slot.key;

          return (
            <div key={slot.key} className="planner-slot">
              <div className="planner-slot-header">
                <span className="planner-slot-icon">{slot.icon}</span>
                <span className="planner-slot-label">{slot.label}</span>
                {slotTotal > 0 && <span className="planner-slot-cal">{slotTotal} kcal</span>}
                <button
                  className="planner-slot-add"
                  onClick={() => isAdding ? setAddingSlot(null) : openSlot(slot.key)}
                >{isAdding ? "✕" : "＋"}</button>
              </div>

              {items.length === 0 && !isAdding && (
                <p className="planner-slot-empty">No meals planned</p>
              )}

              {items.length > 0 && (
                <div className="planner-items">
                  {items.map((item) => (
                    <div key={item.id} className="planner-item">
                      <div className="planner-item-info">
                        <span className="planner-item-name">{item.name}</span>
                        {(item.protein || item.carbs || item.fat) && (
                          <span className="planner-item-macros">
                            {item.protein != null ? `P ${item.protein}g` : ""}
                            {item.carbs   != null ? ` · C ${item.carbs}g` : ""}
                            {item.fat     != null ? ` · F ${item.fat}g`   : ""}
                          </span>
                        )}
                      </div>
                      <div className="planner-item-right">
                        <span className="planner-item-cal">{item.calories} kcal</span>
                        <button
                          className="planner-item-del"
                          onClick={() => removePlannerMeal(selectedDate, slot.key, item.id)}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search-based add panel */}
              {isAdding && (
                <div className="planner-add-panel">
                  <form onSubmit={handleSearch} className="planner-search-form">
                    <input
                      className="planner-input"
                      placeholder="Search a food (e.g. chicken rice)"
                      value={query}
                      onChange={e => { setQuery(e.target.value); setSearchResult(null); setSearchError(null); }}
                      autoFocus
                    />
                    <button type="submit" className="planner-search-btn" disabled={searching}>
                      {searching ? "…" : "Search"}
                    </button>
                  </form>

                  {searching && <p className="planner-search-loading">Looking up nutrition…</p>}
                  {searchError && <p className="planner-search-error">{searchError}</p>}

                  {searchResult && (
                    <div className="planner-search-result">
                      <div className="planner-sr-top">
                        <div>
                          <div className="planner-sr-name">{searchResult.food}</div>
                          <div className="planner-sr-serving">{searchResult.serving_size}</div>
                        </div>
                        <div className="planner-sr-cal">{searchResult.calories} <span>kcal</span></div>
                      </div>
                      <div className="planner-sr-macros">
                        {searchResult.macros?.protein       && <span>P {searchResult.macros.protein}</span>}
                        {searchResult.macros?.carbohydrates && <span>C {searchResult.macros.carbohydrates}</span>}
                        {searchResult.macros?.fat            && <span>F {searchResult.macros.fat}</span>}
                      </div>
                      <button className="btn-analyze" style={{ padding: "10px", marginTop: 10 }} onClick={handleAddFromResult}>
                        Add to {slot.label}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
