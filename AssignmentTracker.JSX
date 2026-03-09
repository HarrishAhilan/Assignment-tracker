import { useState, useEffect, useRef } from "react";

const BLUE = "#5B9CF6";
const BLUE_DIM = "#3B7DD8";

const CLASSES = [
  { id: "hpe",       name: "Honors Principles of Engineering", short: "HPE",  color: "#5B9CF6", icon: "⚙️" },
  { id: "apcalc",   name: "AP Calculus AB",                   short: "CALC", color: "#7EB8D4", icon: "∫"  },
  { id: "apphysics", name: "AP Physics C",                    short: "PHYS", color: "#A78BCA", icon: "⚡" },
  { id: "apseminar", name: "AP Seminar 2",                    short: "SEM",  color: "#7BC4A0", icon: "📖" },
  { id: "spanish",   name: "Spanish 6",                       short: "ESP",  color: "#E08080", icon: "🌐" },
];

const PRIORITY = ["Low", "Medium", "High"];
const PRIORITY_COLOR = { Low: "#7BC4A0", Medium: "#5B9CF6", High: "#E08080" };

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.ceil((due - today) / 86400000);
}

function DueBadge({ dateStr }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  let label = "", color = "#7BC4A0";
  if (days < 0)       { label = "Overdue";      color = "#E08080"; }
  else if (days === 0){ label = "Due Today";     color = "#E08080"; }
  else if (days === 1){ label = "Tomorrow";      color = BLUE; }
  else if (days <= 3) { label = `${days} days`;  color = BLUE; }
  else                { label = `${days} days`;  color = "#7BC4A0"; }
  return (
    <span style={{
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
      color, border: `1px solid ${color}44`, borderRadius: 4,
      padding: "2px 7px", textTransform: "uppercase",
    }}>{label}</span>
  );
}

function canNotify() { return "Notification" in window; }

async function requestNotifPermission() {
  if (!canNotify()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

function fireNotif(title, body) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try { new Notification(title, { body, tag: title }); } catch(e) {}
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hw-tasks") || "[]"); }
    catch { return []; }
  });
  const [activeClass, setActiveClass] = useState("all");
  const [showModal, setShowModal]     = useState(false);
  const [removing, setRemoving]       = useState(null);
  const [form, setForm] = useState({ classId: CLASSES[0].id, name: "", description: "", date: "", priority: "Medium" });
  const [errors, setErrors]           = useState({});
  const [justAdded, setJustAdded]     = useState(null);
  const [notifStatus, setNotifStatus] = useState(canNotify() ? Notification.permission : "unsupported");
  const [toasts, setToasts]           = useState([]);
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    try { localStorage.setItem("hw-tasks", JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  // Check due dates every 60 seconds
  useEffect(() => {
    function checkDue() {
      if (!canNotify() || Notification.permission !== "granted") return;
      tasks.forEach(task => {
        const days = daysUntil(task.date);
        const cls  = CLASSES.find(c => c.id === task.classId);
        if (days === null) return;
        const k0 = `overdue-${task.id}`, k1 = `tomorrow-${task.id}`, k3 = `3day-${task.id}`;
        if (days <= 0 && !notifiedRef.current.has(k0)) {
          notifiedRef.current.add(k0);
          fireNotif(days === 0 ? "📅 Due Today!" : "⚠️ Overdue!", `${cls?.icon || ""} ${task.name} · ${cls?.name}`);
        } else if (days === 1 && !notifiedRef.current.has(k1)) {
          notifiedRef.current.add(k1);
          fireNotif("⏰ Due Tomorrow", `${cls?.icon || ""} ${task.name} · ${cls?.name}`);
        } else if (days <= 3 && days > 1 && !notifiedRef.current.has(k3)) {
          notifiedRef.current.add(k3);
          fireNotif(`🔔 Due in ${days} Days`, `${cls?.icon || ""} ${task.name} · ${cls?.name}`);
        }
      });
    }
    checkDue();
    const id = setInterval(checkDue, 60000);
    return () => clearInterval(id);
  }, [tasks]);

  function pushToast(msg, color = BLUE) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  async function enableNotifications() {
    const result = await requestNotifPermission();
    setNotifStatus(result);
    if (result === "granted") {
      pushToast("🔔 Notifications enabled!", BLUE);
      fireNotif("Notifications Active 🎓", "You'll be alerted when assignments are due or upcoming.");
    } else if (result === "denied") {
      pushToast("Blocked. Go to browser Settings → Notifications to allow.", "#E08080");
    }
  }

  const filtered = activeClass === "all" ? tasks : tasks.filter(t => t.classId === activeClass);
  const sortedTasks = [...filtered].sort((a, b) => {
    if (!a.date && !b.date) return 0; if (!a.date) return 1; if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Task name is required";
    if (!form.date)        e.date = "Due date is required";
    return e;
  }

  function addTask() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = Date.now().toString();
    setTasks(prev => [...prev, { ...form, id }]);
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 1200);
    setShowModal(false);
    setForm({ classId: CLASSES[0].id, name: "", description: "", date: "", priority: "Medium" });
    setErrors({});
    pushToast("✅ Task added!");
  }

  function removeTask(id) {
    setRemoving(id);
    setTimeout(() => { setTasks(prev => prev.filter(t => t.id !== id)); setRemoving(null); }, 380);
    pushToast("Task completed! 🎉", "#7BC4A0");
  }

  function getClass(id) { return CLASSES.find(c => c.id === id); }

  const urgentCount = tasks.filter(t => { const d = daysUntil(t.date); return d !== null && d <= 1; }).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0E1117", fontFamily: "'Crimson Pro','Georgia',serif", color: "#D4C9B8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#0E1117}
        ::-webkit-scrollbar-thumb{background:#2A2D35;border-radius:3px}
        .task-card{transition:opacity .35s,transform .35s,box-shadow .2s}
        .task-card:hover{transform:translateY(-2px)}
        .task-card.removing{opacity:0;transform:translateX(32px) scale(.97)}
        .task-card.added{animation:popIn .4s cubic-bezier(.22,1,.36,1)}
        @keyframes popIn{0%{opacity:0;transform:scale(.93) translateY(8px)}100%{opacity:1;transform:none}}
        .tab-btn{transition:all .2s;cursor:pointer;background:none;border:none}
        .tab-btn:hover{opacity:.85}
        .cta-btn{transition:all .18s;cursor:pointer;border:none}
        .cta-btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
        .done-btn{transition:all .15s;cursor:pointer;opacity:.45}
        .done-btn:hover{opacity:1;transform:scale(1.1)}
        .modal-overlay{animation:fadeIn .18s ease}
        .modal-panel{animation:slideUp .22s cubic-bezier(.22,1,.36,1)}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
        input,select,textarea{outline:none;font-family:'Crimson Pro',Georgia,serif}
        input:focus,select:focus,textarea:focus{border-color:${BLUE}!important}
        .glow-blob{position:absolute;top:-70px;left:50%;transform:translateX(-50%);width:500px;height:220px;background:radial-gradient(ellipse,${BLUE}14 0%,transparent 68%);pointer-events:none}
        .toast-item{animation:toastIn .28s cubic-bezier(.22,1,.36,1)}
        @keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
      `}</style>

      {/* Toast stack */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{
            background: "#181B24", border: `1px solid ${t.color}44`,
            borderLeft: `3px solid ${t.color}`, borderRadius: 8,
            padding: "10px 16px", fontSize: "0.85rem", color: "#D4C9B8",
            boxShadow: "0 8px 24px #00000066", fontFamily: "'DM Mono',monospace", maxWidth: 290,
          }}>{t.msg}</div>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ position: "relative", borderBottom: "1px solid #1E2130", padding: "32px 40px 24px" }}>
        <div className="glow-blob" />
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.22em", color: BLUE, textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono',monospace" }}>
              Academic Planner
            </div>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1 }}>
              Assignment <em style={{ fontStyle: "italic", color: BLUE }}>Tracker</em>
            </h1>
            <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#4A5568", fontFamily: "'DM Mono',monospace", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
              {urgentCount > 0 && <span style={{ color: "#E08080" }}>⚠ {urgentCount} urgent</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Notification button */}
            {canNotify() && notifStatus !== "granted" && notifStatus !== "denied" && (
              <button className="cta-btn" onClick={enableNotifications} style={{
                background: "#181B24", border: `1px solid ${BLUE}44`, borderRadius: 8,
                padding: "10px 18px", color: BLUE, fontSize: "0.82rem",
                fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em",
                display: "flex", alignItems: "center", gap: 7,
              }}>🔔 Enable Alerts</button>
            )}
            {notifStatus === "granted" && (
              <div style={{ fontSize: "0.72rem", fontFamily: "'DM Mono',monospace", color: BLUE,
                background: BLUE + "14", border: `1px solid ${BLUE}30`, borderRadius: 8,
                padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                🔔 Alerts on
              </div>
            )}
            {notifStatus === "denied" && (
              <div style={{ fontSize: "0.72rem", fontFamily: "'DM Mono',monospace", color: "#4A5568",
                padding: "9px 14px" }}>🔕 Alerts blocked</div>
            )}
            <button className="cta-btn" onClick={() => setShowModal(true)} style={{
              background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})`,
              color: "#fff", borderRadius: 8, padding: "11px 24px",
              fontSize: "0.95rem", fontWeight: 700,
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em",
              display: "flex", alignItems: "center", gap: 8,
            }}><span style={{ fontSize: "1.1rem" }}>+</span> Add Task</button>
          </div>
        </div>
      </div>

      {/* ── Class Tabs ── */}
      <div style={{ borderBottom: "1px solid #1E2130", padding: "0 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", overflowX: "auto" }}>
          {[{ id: "all", short: "ALL", color: "#8B9AAF", icon: "◈" }, ...CLASSES].map(c => {
            const count = c.id === "all" ? tasks.length : tasks.filter(t => t.classId === c.id).length;
            const active = activeClass === c.id;
            return (
              <button key={c.id} className="tab-btn" onClick={() => setActiveClass(c.id)} style={{
                borderBottom: active ? `2px solid ${c.color}` : "2px solid transparent",
                padding: "13px 17px", color: active ? c.color : "#4A5568",
                fontSize: "0.76rem", fontFamily: "'DM Mono',monospace",
                letterSpacing: "0.07em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                fontWeight: active ? 500 : 400,
              }}>
                <span>{c.icon}</span><span>{c.short}</span>
                {count > 0 && (
                  <span style={{ background: active ? c.color + "20" : "#1E2130", color: active ? c.color : "#4A5568", borderRadius: 12, padding: "1px 7px", fontSize: "0.68rem" }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tasks Grid ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>
        {sortedTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 14, opacity: 0.15 }}>✦</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 300, color: "#2E3240" }}>No assignments here</div>
            <div style={{ fontSize: "0.77rem", fontFamily: "'DM Mono',monospace", color: "#252830", marginTop: 8 }}>
              Hit "+ Add Task" to begin
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 14 }}>
            {sortedTasks.map(task => {
              const cls = getClass(task.classId);
              const days = daysUntil(task.date);
              const isUrgent = days !== null && days <= 2;
              return (
                <div key={task.id}
                  className={`task-card${removing === task.id ? " removing" : ""}${justAdded === task.id ? " added" : ""}`}
                  style={{
                    background: "#13161F",
                    border: `1px solid ${isUrgent ? cls.color + "50" : "#1C1F2A"}`,
                    borderLeft: `3px solid ${cls.color}`,
                    borderRadius: 10, padding: "18px 18px 14px",
                    boxShadow: isUrgent ? `0 0 18px ${cls.color}10` : "none",
                  }}>
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11, gap: 8 }}>
                    <span style={{
                      fontSize: "0.62rem", fontFamily: "'DM Mono',monospace",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: cls.color, background: cls.color + "16",
                      padding: "3px 8px", borderRadius: 4, fontWeight: 500,
                    }}>{cls.icon} {cls.short}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <DueBadge dateStr={task.date} />
                      <button className="done-btn" onClick={() => removeTask(task.id)} title="Mark complete"
                        style={{
                          background: "#7BC4A018", border: "1px solid #7BC4A040",
                          borderRadius: 6, width: 27, height: 27,
                          color: "#7BC4A0", fontSize: "0.8rem", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</button>
                    </div>
                  </div>
                  {/* Name */}
                  <div style={{ fontSize: "1.12rem", fontWeight: 600, lineHeight: 1.3, color: "#E8DFD0", marginBottom: 7 }}>
                    {task.name}
                  </div>
                  {/* Description */}
                  {task.description && (
                    <div style={{ fontSize: "0.86rem", color: "#55596A", lineHeight: 1.5, marginBottom: 10, fontStyle: "italic" }}>
                      {task.description}
                    </div>
                  )}
                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 11, borderTop: "1px solid #1C1F2A", marginTop: 10 }}>
                    <span style={{ fontSize: "0.76rem", fontFamily: "'DM Mono',monospace", color: "#3E4255" }}>
                      {task.date ? formatDate(task.date) : "—"}
                    </span>
                    <span style={{
                      fontSize: "0.63rem", fontFamily: "'DM Mono',monospace",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: PRIORITY_COLOR[task.priority], fontWeight: 700,
                    }}>{task.priority}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Task Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "#000000D0", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, backdropFilter: "blur(5px)" }}>
          <div className="modal-panel" style={{
            background: "#13161F", border: "1px solid #252830", borderRadius: 14,
            width: "100%", maxWidth: 480, padding: 32, boxShadow: "0 40px 90px #00000099",
          }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: "0.63rem", fontFamily: "'DM Mono',monospace", color: BLUE, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>New Assignment</div>
              <h2 style={{ fontSize: "1.55rem", fontWeight: 300 }}>Add Task</h2>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Course</label>
              <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                style={{ ...inputStyle, background: "#0E1117" }}>
                {CLASSES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Task Name *</label>
              <input value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
                placeholder="e.g. Problem Set 4, Lab Report..."
                style={{ ...inputStyle, borderColor: errors.name ? "#E08080" : "#252830" }} />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description <span style={{ color: "#3E4255" }}>(optional)</span></label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Chapter 5 review, pages 102-118..."
                rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" value={form.date}
                  onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: "" })); }}
                  style={{ ...inputStyle, borderColor: errors.date ? "#E08080" : "#252830", colorScheme: "dark" }} />
                {errors.date && <div style={errorStyle}>{errors.date}</div>}
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ ...inputStyle, background: "#0E1117", color: PRIORITY_COLOR[form.priority] }}>
                  {PRIORITY.map(p => <option key={p} value={p} style={{ color: PRIORITY_COLOR[p] }}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{
                background: "none", border: "1px solid #252830", borderRadius: 8,
                padding: "10px 20px", color: "#4A5568", cursor: "pointer",
                fontFamily: "'DM Mono',monospace", fontSize: "0.8rem",
              }}>Cancel</button>
              <button onClick={addTask} style={{
                background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DIM})`,
                border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff",
                cursor: "pointer", fontFamily: "'DM Mono',monospace",
                fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em",
              }}>Add Task →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0E1117", border: "1px solid #252830",
  borderRadius: 8, padding: "10px 14px", color: "#D4C9B8", fontSize: "0.93rem", display: "block",
};
const labelStyle = {
  display: "block", fontSize: "0.63rem", fontFamily: "'DM Mono',monospace",
  letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: 6,
};
const errorStyle = {
  fontSize: "0.7rem", color: "#E08080", fontFamily: "'DM Mono',monospace", marginTop: 4,
};
