import { useState } from "react";

const EMPTY_FORM = { name: "", calories: "", protein: "", carbs: "", fat: "", notes: "" };

const CATEGORIES = ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Custom"];

export default function FoodLibrary({ foodLibrary, addToLibrary, removeFromLibrary, updateLibraryItem, addMeal }) {
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("All");
  const [savedId, setSavedId]       = useState(null);

  const filtered = foodLibrary.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "All" || (f.category || "Custom") === category;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name:     item.name     || "",
      calories: item.calories || "",
      protein:  item.protein  || "",
      carbs:    item.carbs    || "",
      fat:      item.fat      || "",
      notes:    item.notes    || "",
      category: item.category || "Custom",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.calories) return;
    const entry = {
      name:     form.name.trim(),
      calories: Number(form.calories),
      protein:  form.protein  ? Number(form.protein)  : undefined,
      carbs:    form.carbs    ? Number(form.carbs)    : undefined,
      fat:      form.fat      ? Number(form.fat)      : undefined,
      notes:    form.notes    || undefined,
      category: form.category || "Custom",
    };
    if (editingId) {
      updateLibraryItem(editingId, entry);
    } else {
      addToLibrary(entry);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleLogToday = (item) => {
    addMeal({ name: item.name, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, source: "library" });
    setSavedId(item.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  return (
    <div className="library-container">

      {/* Header */}
      <div className="library-header">
        <div>
          <h2 className="section-title">Food Library</h2>
          <p className="section-sub">{foodLibrary.length} saved food{foodLibrary.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-analyze" style={{ width: "auto", padding: "10px 20px" }} onClick={openAdd}>
          + Add Food
        </button>
      </div>

      {/* Search + filter */}
      <div className="library-search-row">
        <input
          className="search-input"
          placeholder="Search your foods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="library-cats">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`lib-cat-btn${category === c ? " active" : ""}`}
            onClick={() => setCategory(c)}
          >{c}</button>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="library-form-card">
          <h3 className="lib-form-title">{editingId ? "Edit Food" : "Add to Library"}</h3>
          <form onSubmit={handleSubmit} className="library-form">
            <div className="form-row">
              <label>Food Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Homemade Oats"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-row-2">
              <div className="form-row">
                <label>Calories (kcal) *</label>
                <input className="form-input" type="number" placeholder="350" value={form.calories}
                  onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Category</label>
                <select className="form-input" value={form.category || "Custom"}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lib-macros-row">
              <div className="form-row">
                <label>Protein (g)</label>
                <input className="form-input" type="number" placeholder="25" value={form.protein}
                  onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Carbs (g)</label>
                <input className="form-input" type="number" placeholder="45" value={form.carbs}
                  onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Fat (g)</label>
                <input className="form-input" type="number" placeholder="12" value={form.fat}
                  onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <label>Notes (optional)</label>
              <input className="form-input" placeholder="e.g. 1 cup serving" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="lib-form-actions">
              <button type="submit" className="btn-analyze" style={{ flex: 1, padding: "11px" }}>
                {editingId ? "Save Changes" : "Add to Library"}
              </button>
              <button type="button" className="btn-secondary"
                onClick={() => { setShowForm(false); setEditingId(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Food list */}
      {filtered.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon">📚</div>
          <p className="hs-empty-h">{foodLibrary.length === 0 ? "Your library is empty" : "No matches found"}</p>
          <p className="hs-empty-p">
            {foodLibrary.length === 0
              ? "Save home-cooked meals and favourite foods for quick logging"
              : "Try a different search or category"}
          </p>
          {foodLibrary.length === 0 && (
            <button className="hs-empty-cta" onClick={openAdd}>Add your first food</button>
          )}
        </div>
      ) : (
        <div className="library-list">
          {filtered.map((item) => (
            <div key={item.id} className="library-item">
              <div className="library-item-left">
                <div className="lib-item-cat-dot" data-cat={item.category || "Custom"} />
                <div>
                  <div className="lib-item-name">{item.name}</div>
                  {item.notes && <div className="lib-item-notes">{item.notes}</div>}
                  {(item.protein || item.carbs || item.fat) && (
                    <div className="lib-item-macros">
                      {item.protein != null ? <span>P {item.protein}g</span> : null}
                      {item.carbs   != null ? <span>C {item.carbs}g</span>   : null}
                      {item.fat     != null ? <span>F {item.fat}g</span>     : null}
                    </div>
                  )}
                </div>
              </div>
              <div className="library-item-right">
                <span className="lib-item-cal">{item.calories} <span className="lib-item-unit">kcal</span></span>
                <div className="lib-item-actions">
                  <button
                    className={`lib-log-btn${savedId === item.id ? " saved" : ""}`}
                    onClick={() => handleLogToday(item)}
                    disabled={savedId === item.id}
                  >
                    {savedId === item.id ? "✓" : "Log"}
                  </button>
                  <button className="lib-edit-btn" onClick={() => openEdit(item)}>✎</button>
                  <button className="lib-del-btn" onClick={() => removeFromLibrary(item.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
