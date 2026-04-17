import { useState, useEffect } from "react";

const PROTOCOLS = [
  { id: "16:8",  label: "16 : 8",  fast: 16, eat: 8,  desc: "Fast 16h, eat in 8h window" },
  { id: "18:6",  label: "18 : 6",  fast: 18, eat: 6,  desc: "Fast 18h, eat in 6h window" },
  { id: "20:4",  label: "20 : 4",  fast: 20, eat: 4,  desc: "Fast 20h, eat in 4h window" },
  { id: "omad",  label: "OMAD",    fast: 23, eat: 1,  desc: "One meal a day" },
];

function pad(n) { return String(Math.floor(n)).padStart(2, "0"); }

function formatCountdown(ms) {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export default function FastingTimer({ fastingState, startFast, stopFast }) {
  const [now, setNow]           = useState(Date.now());
  const [selectedProto, setSelectedProto] = useState(fastingState.protocol || "16:8");

  useEffect(() => {
    if (!fastingState.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [fastingState.active]);

  const proto = PROTOCOLS.find((p) => p.id === (fastingState.active ? fastingState.protocol : selectedProto));

  // Time calculations
  const fastMs    = proto.fast * 3600 * 1000;
  const startTime = fastingState.startTime ? new Date(fastingState.startTime).getTime() : null;
  const elapsed   = startTime ? now - startTime : 0;
  const remaining = fastingState.active ? Math.max(fastMs - elapsed, 0) : fastMs;
  const percent   = fastingState.active ? Math.min((elapsed / fastMs) * 100, 100) : 0;
  const done      = fastingState.active && elapsed >= fastMs;

  // Eating window
  const eatStart  = startTime ? new Date(startTime + fastMs) : null;
  const eatEnd    = eatStart  ? new Date(eatStart.getTime() + proto.eat * 3600 * 1000) : null;

  const fmt = (d) => d?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const countdown = formatCountdown(remaining);

  // Arc for SVG
  const R = 90, CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - percent / 100);

  return (
    <div className="fasting-container">
      <h2 className="section-title">Intermittent Fasting</h2>
      <p className="section-sub">Track your fasting window</p>

      {/* Protocol picker (only when not active) */}
      {!fastingState.active && (
        <div className="fasting-protocols">
          {PROTOCOLS.map((p) => (
            <button
              key={p.id}
              className={`fasting-proto-btn${selectedProto === p.id ? " active" : ""}`}
              onClick={() => setSelectedProto(p.id)}
            >
              <span className="fproto-label">{p.label}</span>
              <span className="fproto-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Ring timer */}
      <div className="fasting-ring-wrap">
        <svg viewBox="0 0 220 220" className="fasting-ring-svg">
          <defs>
            <linearGradient id="fast-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={done ? "#10b981" : "#7c3aed"} />
              <stop offset="100%" stopColor={done ? "#34d399" : "#06b6d4"} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx="110" cy="110" r={R} fill="none" stroke="var(--s3)" strokeWidth="14" />
          {/* Progress */}
          {fastingState.active && (
            <circle
              cx="110" cy="110" r={R} fill="none"
              stroke="url(#fast-grad)"
              strokeWidth="14" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              transform="rotate(-90 110 110)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          )}
        </svg>

        <div className="fasting-ring-center">
          {fastingState.active ? (
            done ? (
              <>
                <span className="fasting-done-icon">🎉</span>
                <span className="fasting-done-text">Fast Complete!</span>
                <span className="fasting-proto-tag">{fastingState.protocol}</span>
              </>
            ) : (
              <>
                <span className="fasting-countdown">
                  {countdown.h}<span className="fc-sep">:</span>{countdown.m}<span className="fc-sep">:</span>{countdown.s}
                </span>
                <span className="fasting-countdown-lbl">remaining</span>
                <span className="fasting-proto-tag">{fastingState.protocol}</span>
              </>
            )
          ) : (
            <>
              <span className="fasting-idle-icon">⏱️</span>
              <span className="fasting-idle-txt">{proto.label}</span>
              <span className="fasting-idle-sub">Ready to start</span>
            </>
          )}
        </div>
      </div>

      {/* Status info */}
      {fastingState.active && (
        <div className="fasting-info-row">
          <div className="fasting-info-item">
            <span className="fi-label">Started</span>
            <span className="fi-val">{fmt(new Date(fastingState.startTime))}</span>
          </div>
          <div className="fasting-info-item">
            <span className="fi-label">Eat window opens</span>
            <span className="fi-val">{fmt(eatStart)}</span>
          </div>
          <div className="fasting-info-item">
            <span className="fi-label">Eat window closes</span>
            <span className="fi-val">{fmt(eatEnd)}</span>
          </div>
          <div className="fasting-info-item">
            <span className="fi-label">Progress</span>
            <span className="fi-val">{Math.round(percent)}%</span>
          </div>
        </div>
      )}

      {/* Timeline bar */}
      {fastingState.active && (
        <div className="fasting-timeline">
          <div className="fasting-timeline-bar">
            <div
              className="fasting-timeline-fill"
              style={{ width: `${percent}%` }}
            />
            <div
              className="fasting-timeline-eat"
              style={{
                left: `${(proto.fast / (proto.fast + proto.eat)) * 100}%`,
                width: `${(proto.eat / (proto.fast + proto.eat)) * 100}%`,
              }}
            />
          </div>
          <div className="fasting-timeline-labels">
            <span>Fasting ({proto.fast}h)</span>
            <span>Eating ({proto.eat}h)</span>
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        className={fastingState.active ? "fasting-stop-btn" : "btn-analyze"}
        onClick={() => fastingState.active ? stopFast() : startFast(selectedProto)}
        style={{ marginTop: 8 }}
      >
        {fastingState.active ? "⏹ Stop Fast" : `▶ Start ${selectedProto} Fast`}
      </button>

      {/* Tips */}
      <div className="fasting-tip">
        💡 Stay hydrated during your fast. Water, black coffee, and plain tea are allowed.
      </div>
    </div>
  );
}
