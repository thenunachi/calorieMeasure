import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import ImageCapture from "./components/ImageCapture";
import CalorieResult from "./components/CalorieResult";
import FoodSearch from "./components/FoodSearch";
import FoodCompare from "./components/FoodCompare";
import BarcodeScanner from "./components/BarcodeScanner";
import RecipeAnalyzer from "./components/RecipeAnalyzer";
import MealHistory from "./components/MealHistory";
import MealPlanner from "./components/MealPlanner";
import WellnessHub from "./components/WellnessHub";
import UserProfile from "./components/UserProfile";
import NotificationSettings from "./components/NotificationSettings";
import { useMealLog } from "./hooks/useMealLog";
import "./App.css";

const BACKEND_URL = "/api";

const SEARCH_TABS = [
  { id: "search",  label: "Search"  },
  { id: "compare", label: "Compare" },
  { id: "barcode", label: "Barcode" },
  { id: "recipe",  label: "Recipe"  },
];

const NAV = [
  { id: "home",     icon: "⊙",  label: "Home"     },
  { id: "scan",     icon: "📷", label: "Scan"     },
  { id: "search",   icon: "🔍", label: "Search"   },
  { id: "planner",  icon: "📅", label: "Planner"  },
  { id: "history",  icon: "📊", label: "History"  },
  { id: "wellness", icon: "💪", label: "Wellness" },
  { id: "profile",  icon: "👤", label: "Profile"  },
];

export default function App() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [searchSubTab, setSearchSubTab] = useState("search");

  const {
    meals, todayMeals, todayCalories, yesterdayCalories, weeklyData,
    goal, setGoal, profile, setProfile,
    macroGoals, todayMacros,
    recentSearches, addRecentSearch, clearRecentSearches,
    addMeal, deleteMeal,
    planner, addPlannerMeal, removePlannerMeal,
    waterLog, todayWaterMl, addWater, removeWater,
    weightLog, addWeight, removeWeight,
    fastingState, startFast, stopFast,
    streak, earnedBadges,
  } = useMealLog();

  const handleImageReady = (file) => {
    setImage(file);
    setResult(null);
    setError(null);
    if (file) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(URL.createObjectURL(file));
    } else {
      setImageUrl(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("image", image);
    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setResult(data);
        // Auto-save the meal so it appears on the home page immediately
        const mealName = data.items && data.items.length > 0
          ? data.items.map(i => i.name).join(", ")
          : "Scanned Meal";
        addMeal({ name: mealName, calories: Math.round(data.total_calories), protein: data.total_protein, carbs: data.total_carbs, fat: data.total_fat, source: "scan" });
      }
    } catch {
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* ── Top Navbar ─────────────────────────────── */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <span className="logo-dot" />
            <span className="navbar-brand">CalorieLens</span>
          </div>
          <div className="navbar-actions">
            <div className="nav-cal-badge">
              <span className="ncb-num">{todayCalories}</span>
              <span className="ncb-slash"> / {goal}</span>
              <span className="ncb-unit"> kcal</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────── */}
      <main className="app-main">

        {activeTab === "home" && (
          <HomeScreen
            todayMeals={todayMeals}
            todayCalories={todayCalories}
            goal={goal}
            deleteMeal={deleteMeal}
            onScanClick={() => setActiveTab("scan")}
          />
        )}

        {activeTab === "scan" && (
          <div className="scan-wrap">
            <div className="scan-header" style={{padding:0}}>
              <h2 className="page-title">Scan Your Plate</h2>
              <p className="page-sub">Take or upload a photo for instant nutrition info</p>
            </div>
            <ImageCapture onImageReady={handleImageReady} />
            {image && !loading && (
              <button className="btn-analyze" onClick={analyzeImage}>Analyze Calories</button>
            )}
            {loading && <div className="loading"><div className="spinner"/><p>Analyzing your food...</p></div>}
            {error && <p className="error-text" style={{margin:0}}>{error}</p>}
            {result && <CalorieResult result={result} addMeal={addMeal} imageUrl={imageUrl} />}
          </div>
        )}

        {activeTab === "search" && (
          <>
            <div className="sub-tab-bar">
              {SEARCH_TABS.map(t => (
                <button
                  key={t.id}
                  className={searchSubTab === t.id ? "sub-tab active" : "sub-tab"}
                  onClick={() => setSearchSubTab(t.id)}
                >{t.label}</button>
              ))}
            </div>
            {searchSubTab === "search"  && <FoodSearch recentSearches={recentSearches} addRecentSearch={addRecentSearch} clearRecentSearches={clearRecentSearches} addMeal={addMeal} />}
            {searchSubTab === "compare" && <FoodCompare />}
            {searchSubTab === "barcode" && <BarcodeScanner addMeal={addMeal} />}
            {searchSubTab === "recipe"  && <RecipeAnalyzer addMeal={addMeal} />}
          </>
        )}

        {activeTab === "planner" && (
          <MealPlanner
            planner={planner}
            addPlannerMeal={addPlannerMeal}
            removePlannerMeal={removePlannerMeal}
            goal={goal}
          />
        )}


        {activeTab === "wellness" && (
          <WellnessHub
            meals={meals}
            todayMeals={todayMeals}
            todayCalories={todayCalories}
            yesterdayCalories={yesterdayCalories}
            goal={goal}
            streak={streak}
            earnedBadges={earnedBadges}
            waterLog={waterLog}
            todayWaterMl={todayWaterMl}
            addWater={addWater}
            removeWater={removeWater}
            weightLog={weightLog}
            addWeight={addWeight}
            removeWeight={removeWeight}
            fastingState={fastingState}
            startFast={startFast}
            stopFast={stopFast}
            todayMacros={todayMacros}
            macroGoals={macroGoals}
          />
        )}

        {activeTab === "history" && (
          <MealHistory
            meals={meals}
            todayMeals={todayMeals}
            todayCalories={todayCalories}
            weeklyData={weeklyData}
            goal={goal}
            deleteMeal={deleteMeal}
          />
        )}

        {activeTab === "profile" && (
          <>
            <UserProfile profile={profile} setProfile={setProfile} goal={goal} setGoal={setGoal} />
            <NotificationSettings />
          </>
        )}
      </main>

      {/* ── FAB ────────────────────────────────────── */}
      {activeTab === "home" && (
        <button className="fab" onClick={() => setActiveTab("scan")} aria-label="Scan meal">
          <span className="fab-icon">＋</span>
        </button>
      )}

      {/* ── Bottom Nav ─────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={activeTab === n.id ? "bnav-item active" : "bnav-item"}
            onClick={() => setActiveTab(n.id)}
          >
            <div className="bnav-icon-wrap">
              <span className="bnav-icon">{n.icon}</span>
              <span className="bnav-dot"/>
            </div>
            <span className="bnav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
