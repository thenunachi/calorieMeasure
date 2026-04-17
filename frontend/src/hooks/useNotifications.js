import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "meal_reminders";

const DEFAULT_REMINDERS = [
  { id: "breakfast", label: "Breakfast",  icon: "🌅", time: "08:00", enabled: true  },
  { id: "lunch",     label: "Lunch",      icon: "☀️",  time: "13:00", enabled: true  },
  { id: "dinner",    label: "Dinner",     icon: "🌙",  time: "19:00", enabled: true  },
  { id: "snack",     label: "Snack",      icon: "🍎",  time: "16:00", enabled: false },
];

function load() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : DEFAULT_REMINDERS;
  } catch { return DEFAULT_REMINDERS; }
}

function save(reminders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

// ms until next occurrence of HH:MM
function msUntil(timeStr) {
  const [h, m]  = timeStr.split(":").map(Number);
  const now     = new Date();
  const target  = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // tomorrow
  return target - now;
}

async function sendNotification(label, icon) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({
    type:  "SHOW_NOTIFICATION",
    title: `${icon} Time to log your ${label}!`,
    body:  "Tap to open CalorieLens and log what you ate.",
    tag:   `meal-reminder-${label.toLowerCase()}`,
  });
}

export function useNotifications() {
  const [permission, setPermission] = useState(
    () => ("Notification" in window ? Notification.permission : "unsupported")
  );
  const [reminders, setReminders] = useState(load);
  const timersRef = useRef([]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const updateReminder = useCallback((id, changes) => {
    setReminders((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, ...changes } : r);
      save(updated);
      return updated;
    });
  }, []);

  // Schedule all enabled reminders
  const scheduleAll = useCallback((rems) => {
    // Clear existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (permission !== "granted") return;

    rems.forEach((r) => {
      if (!r.enabled) return;

      const schedule = () => {
        const delay = msUntil(r.time);
        const id = setTimeout(() => {
          sendNotification(r.label, r.icon);
          // Reschedule for tomorrow
          const nextId = setTimeout(schedule, 1000);
          timersRef.current.push(nextId);
        }, delay);
        timersRef.current.push(id);
      };

      schedule();
    });
  }, [permission]);

  // Re-schedule whenever reminders or permission changes
  useEffect(() => {
    scheduleAll(reminders);
    return () => timersRef.current.forEach(clearTimeout);
  }, [reminders, scheduleAll]);

  // Send a test notification
  const testNotification = useCallback(async () => {
    if (permission !== "granted") return;
    await sendNotification("Meal", "🍽️");
  }, [permission]);

  return {
    permission,
    reminders,
    requestPermission,
    updateReminder,
    testNotification,
    isSupported: "Notification" in window && "serviceWorker" in navigator,
  };
}
