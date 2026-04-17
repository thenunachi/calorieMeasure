const TIMES = [
  { id: "breakfast", label: "Breakfast", icon: "🌅" },
  { id: "lunch",     label: "Lunch",     icon: "☀️"  },
  { id: "dinner",    label: "Dinner",    icon: "🌙"  },
  { id: "snack",     label: "Snack",     icon: "🍎"  },
];

export default function MealTimeSelector({ value, onChange }) {
  return (
    <div className="meal-time-selector">
      <span className="mts-label">Meal time</span>
      <div className="mts-buttons">
        {TIMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mts-btn${value === t.id ? " active" : ""}`}
            onClick={() => onChange(value === t.id ? null : t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
