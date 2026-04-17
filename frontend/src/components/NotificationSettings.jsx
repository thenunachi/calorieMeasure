import { useNotifications } from "../hooks/useNotifications";

export default function NotificationSettings() {
  const {
    permission,
    reminders,
    requestPermission,
    updateReminder,
    testNotification,
    isSupported,
  } = useNotifications();

  if (!isSupported) {
    return (
      <div className="notif-unsupported">
        <span>🔔</span>
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="notif-container">
      <div className="notif-header">
        <div>
          <h3 className="section-title">Meal Reminders</h3>
          <p className="section-sub">Get notified when it's time to log your meals</p>
        </div>
        {permission === "granted" && (
          <button className="notif-test-btn" onClick={testNotification}>
            Test
          </button>
        )}
      </div>

      {/* Permission banner */}
      {permission === "default" && (
        <div className="notif-permission-banner">
          <span className="notif-banner-icon">🔔</span>
          <div className="notif-banner-text">
            <div className="notif-banner-title">Enable notifications</div>
            <div className="notif-banner-sub">Allow CalorieLens to remind you to log meals</div>
          </div>
          <button className="notif-allow-btn" onClick={requestPermission}>
            Allow
          </button>
        </div>
      )}

      {permission === "denied" && (
        <div className="notif-denied-banner">
          <span>🚫</span>
          <div>
            <div className="notif-banner-title">Notifications blocked</div>
            <div className="notif-banner-sub">Enable them in your browser site settings to use reminders</div>
          </div>
        </div>
      )}

      {permission === "granted" && (
        <div className="notif-granted-badge">
          <span>✅</span> Notifications enabled
        </div>
      )}

      {/* Reminder rows */}
      <div className="notif-list">
        {reminders.map((r) => (
          <div key={r.id} className={`notif-row${r.enabled ? " enabled" : ""}`}>
            <div className="notif-row-left">
              <span className="notif-row-icon">{r.icon}</span>
              <div className="notif-row-info">
                <span className="notif-row-label">{r.label}</span>
                <span className="notif-row-time">{formatTime(r.time)}</span>
              </div>
            </div>
            <div className="notif-row-right">
              <input
                type="time"
                className="notif-time-input"
                value={r.time}
                disabled={permission !== "granted"}
                onChange={(e) => updateReminder(r.id, { time: e.target.value })}
              />
              <button
                className={`notif-toggle${r.enabled ? " on" : ""}`}
                disabled={permission !== "granted"}
                onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                aria-label={r.enabled ? "Disable" : "Enable"}
              >
                <span className="notif-toggle-thumb" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="notif-note">
        ℹ️ Reminders fire while the browser is open. Install the app to your home screen for background reminders.
      </p>
    </div>
  );
}

function formatTime(str) {
  const [h, m] = str.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
