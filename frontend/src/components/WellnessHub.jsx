import { useState } from "react";
import WaterTracker    from "./WaterTracker";
import WeightLog       from "./WeightLog";
import FastingTimer    from "./FastingTimer";
import StreaksBadges   from "./StreaksBadges";
import DailySummary    from "./DailySummary";
import SubstituteFinder from "./SubstituteFinder";
import AISuggest       from "./AISuggest";

const TABS = [
  { id: "summary",  icon: "📋", label: "Summary"   },
  { id: "suggest",  icon: "✨", label: "AI Suggest" },
  { id: "streaks",  icon: "🏆", label: "Streaks"   },
  { id: "water",    icon: "💧", label: "Water"     },
  { id: "weight",   icon: "⚖️", label: "Weight"    },
  { id: "fasting",  icon: "⏱️", label: "Fasting"   },
  { id: "find",     icon: "🔄", label: "Find Meal" },
];

export default function WellnessHub(props) {
  const [tab, setTab] = useState("summary");

  return (
    <div className="wellness-wrap">
      {/* Sub-tab bar */}
      <div className="wellness-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`wellness-tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="wt-icon">{t.icon}</span>
            <span className="wt-label">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <DailySummary
          todayMeals={props.todayMeals}
          todayCalories={props.todayCalories}
          yesterdayCalories={props.yesterdayCalories}
          goal={props.goal}
          streak={props.streak}
          todayWaterMl={props.todayWaterMl}
          fastingState={props.fastingState}
        />
      )}
      {tab === "streaks" && (
        <StreaksBadges
          streak={props.streak}
          earnedBadges={props.earnedBadges}
          meals={props.meals}
          goal={props.goal}
        />
      )}
      {tab === "water" && (
        <WaterTracker
          waterLog={props.waterLog}
          todayWaterMl={props.todayWaterMl}
          addWater={props.addWater}
          removeWater={props.removeWater}
        />
      )}
      {tab === "weight" && (
        <WeightLog
          weightLog={props.weightLog}
          addWeight={props.addWeight}
          removeWeight={props.removeWeight}
        />
      )}
      {tab === "fasting" && (
        <FastingTimer
          fastingState={props.fastingState}
          startFast={props.startFast}
          stopFast={props.stopFast}
        />
      )}
      {tab === "suggest" && (
        <AISuggest
          todayMeals={props.todayMeals}
          todayCalories={props.todayCalories}
          todayMacros={props.todayMacros}
          macroGoals={props.macroGoals}
          goal={props.goal}
        />
      )}
      {tab === "find" && <SubstituteFinder />}
    </div>
  );
}
