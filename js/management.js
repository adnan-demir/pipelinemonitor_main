/* ═══════════════════════════════════════════════
   MANAGEMENT MONITORING — ProjectPulse
   Project task progress, deadlines, budget, milestones, team workload.
   ═══════════════════════════════════════════════ */

const DUE_SOON_DAYS = 7;

/* ── Deadline status helper ── */
function getDeadlineStatus(deadline, taskStatus) {
  if (taskStatus === "completed") return { label: "Completed", cls: "dl-completed" };
  const due     = new Date(deadline);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs   = due - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0)              return { label: "Overdue",            cls: "dl-overdue" };
  if (diffDays <= DUE_SOON_DAYS) return { label: `Due in ${diffDays}d`, cls: "dl-soon"   };
  return                                { label: `${diffDays}d left`,  cls: "dl-ontrack" };
}

/* ── Status badge maps ── */
const MGMT_STATUS_CLASS = {
  "not-started": "badge-dim",
  "in-progress": "badge-yellow",
  "completed":   "badge-green",
};
const MGMT_STATUS_LABEL = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed":   "Completed",
};

/* ── Severity badge map (local, mirrors logic.js SEVERITY_CLASS) ── */
const SEV_BADGE = {
  Critical: "badge-red",
  High:     "badge-orange",
  Medium:   "badge-yellow",
  Low:      "badge-green",
};

/* ── Management alert generator ── */
function getMgmtAlerts() {
  const alerts = [];
  const tasks  = appData.managementTasks;

  tasks.forEach(t => {
    const dl = getDeadlineStatus(t.deadline, t.status);
    if (dl.cls === "dl-overdue") {
      alerts.push({ type: "error", msg: `<strong>${t.name}</strong> is overdue (deadline: ${t.deadline})` });
    } else if (dl.cls === "dl-soon" && t.progress < 80) {
      alerts.push({ type: "warning", msg: `<strong>${t.name}</strong> is due soon with only ${t.progress}% progress` });
    }
  });

  const avgProgress = Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);
  if (avgProgress < 75) {
    alerts.push({ type: "warning", msg: `Overall project progress (${avgProgress}%) is below the expected 75% threshold` });
  }

  if (appData.pipeline.errorRate > 5) {
    alerts.push({ type: "error", msg: `High error rate detected: ${appData.pipeline.errorRate}% — technical stability at risk` });
  }

  return alerts;
}

/* ── Inline task update (called from rendered HTML) ── */
function updateMgmtTask(id, field, value) {
  const task = appData.managementTasks.find(t => t.id === id);
  if (!task) return;

  if (field === "status") {
    task.status = value;
    if (value === "completed")   task.progress = 100;
    if (value === "not-started") task.progress = 0;
  } else if (field === "progress") {
    task.progress = parseInt(value, 10);
    if      (task.progress >= 100) task.status = "completed";
    else if (task.progress > 0)    task.status = "in-progress";
    else                           task.status = "not-started";
  }

  appData.activities.unshift({
    id:   Date.now(),
    time: "Just now",
    text: `Management task '${task.name}' updated (${MGMT_STATUS_LABEL[task.status]}, ${task.progress}%)`,
    type: "info",
  });
  renderAll();
}

/* ════════════════════════════════════════
   RENDER — Management Monitoring View
════════════════════════════════════════ */
function renderManagement() {
  const tasks      = appData.managementTasks;
  const avgProg    = Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);
  const completed  = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const notStarted = tasks.filter(t => t.status === "not-started").length;
  const overdue    = tasks.filter(t => getDeadlineStatus(t.deadline, t.status).cls === "dl-overdue").length;
  const alerts     = getMgmtAlerts();
  const progColor  = avgProg >= 80 ? "var(--green)" : avgProg >= 60 ? "var(--yellow)" : "var(--red)";

  /* ── Schedule status helpers ── */
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const projectStart = new Date("2026-03-01");
  const projectEnd   = new Date("2026-05-20");
  const totalDays    = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
  const elapsedDays  = Math.min(Math.ceil((today - projectStart) / (1000 * 60 * 60 * 24)), totalDays);
  const schedPct     = Math.round((elapsedDays / totalDays) * 100);
  const daysLeft     = Math.max(0, Math.ceil((projectEnd - today) / (1000 * 60 * 60 * 24)));
  const schedColor   = avgProg >= schedPct ? "var(--green)" : avgProg >= schedPct - 10 ? "var(--yellow)" : "var(--red)";

  /* ── Budget ── */
  const budget      = appData.budget || { total: 50000, spent: 32500, currency: "USD", breakdown: [] };
  const budgetPct   = Math.round((budget.spent / budget.total) * 100);
  const budgetColor = budgetPct >= 90 ? "var(--red)" : budgetPct >= 75 ? "var(--yellow)" : "var(--green)";
  const budgetRemaining = budget.total - budget.spent;

  const budgetBreakdownRows = (budget.breakdown || []).map(b => {
    const bpct  = Math.round((b.spent / b.allocated) * 100);
    const bclr  = bpct >= 90 ? "var(--red)" : bpct >= 75 ? "var(--yellow)" : "var(--green)";
    return `
      <div class="budget-row">
        <span class="budget-cat">${b.category}</span>
        <div class="budget-bar-bg"><div class="budget-bar-fill" style="width:${Math.min(bpct,100)}%;background:${bclr}"></div></div>
        <span class="budget-spent" style="color:${bclr}">$${b.spent.toLocaleString()} / $${b.allocated.toLocaleString()}</span>
      </div>`;
  }).join('');

  /* ── Milestones ── */
  const milestones     = appData.milestones || [];
  const msCompleted    = milestones.filter(m => m.status === "completed").length;
  const msCfg = {
    "completed":   { icon: "✅", badge: "badge-green",  rowCls: "ms-completed"  },
    "in-progress": { icon: "🔵", badge: "badge-yellow", rowCls: "ms-inprogress" },
    "at-risk":     { icon: "⚠️",  badge: "badge-orange", rowCls: "ms-atrisk"    },
    "upcoming":    { icon: "⭕", badge: "badge-dim",    rowCls: "ms-upcoming"   },
  };

  const milestoneItems = milestones.map(m => {
    const cfg = msCfg[m.status] || { icon: "⭕", badge: "badge-dim", rowCls: "" };
    const dl  = getDeadlineStatus(m.date, m.status === "completed" ? "completed" : "open");
    return `
      <div class="milestone-item ${cfg.rowCls}">
        <div class="ms-icon">${cfg.icon}</div>
        <div class="ms-info">
          <div class="ms-name">${m.name}</div>
          <div class="ms-deliverable">📦 ${m.deliverable}</div>
        </div>
        <div class="ms-right">
          <span class="badge ${cfg.badge}">${m.status.replace(/-/g, ' ')}</span>
          <span class="badge ${dl.cls}" style="font-size:.6rem">${dl.label}</span>
        </div>
      </div>`;
  }).join('');

  /* ── Team Workload ── */
  const workload = {};
  appData.team.forEach(m => { workload[m.id] = { member: m, total: 0, done: 0 }; });
  appData.tasks.forEach(t => {
    if (workload[t.assigneeId]) {
      workload[t.assigneeId].total++;
      if (t.status === "done") workload[t.assigneeId].done++;
    }
  });
  const maxTasks = Math.max(...Object.values(workload).map(w => w.total), 1);

  const workloadRows = Object.values(workload).map(w => {
    const loadClr   = w.total >= 3 ? "var(--red)" : w.total >= 2 ? "var(--yellow)" : "var(--green)";
    const barWidth  = maxTasks > 0 ? Math.round((w.total / maxTasks) * 100) : 0;
    const donePct   = w.total > 0 ? Math.round((w.done / w.total) * 100) : 100;
    return `
      <div class="workload-row">
        <div class="task-avatar sm" style="background:${w.member.color}20;color:${w.member.color};border-color:${w.member.color}40">${w.member.avatar}</div>
        <div class="workload-info">
          <div class="workload-name">${w.member.name} <span class="workload-role">${w.member.role}</span></div>
          <div class="workload-bar-bg"><div class="workload-bar-fill" style="width:${barWidth}%;background:${loadClr}"></div></div>
        </div>
        <div class="workload-stats">
          <span style="color:${loadClr};font-weight:700">${w.total} task${w.total !== 1 ? 's' : ''}</span>
          <span style="color:var(--muted);font-size:.68rem">${donePct}% done</span>
        </div>
      </div>`;
  }).join('');

  /* ── Risk Overview ── */
  const openRisks      = appData.risks.filter(r => r.status === "Open");
  const critRisksCount = openRisks.filter(r => r.severity === "Critical").length;
  const riskOverview   = openRisks.slice(0, 4).map(r => `
    <div class="risk-mini-item">
      <span class="badge ${SEV_BADGE[r.severity] || 'badge-dim'}">${r.severity}</span>
      <span class="risk-mini-title">${r.title}</span>
      <span class="risk-mini-owner">→ ${teamMember(r.owner).name}</span>
    </div>`).join('') || '<div class="empty-state" style="padding:10px 0">No open risks. ✅</div>';

  /* ── Alert rows ── */
  const alertRows = alerts.length
    ? alerts.map(a => `
        <div class="alert-row alert-mgmt-${a.type}">
          <span>${a.type === "error" ? "🔴" : "⚠️"}</span>
          <div>${a.msg}</div>
        </div>`).join("")
    : '<div class="empty-state">No management alerts. Project is on track. ✅</div>';

  /* ── Deliverable table rows ── */
  const taskRows = tasks.map(t => {
    const member   = teamMember(t.ownerId);
    const dl       = getDeadlineStatus(t.deadline, t.status);
    const barColor = t.progress >= 80 ? "var(--green)" : t.progress >= 50 ? "var(--yellow)" : "var(--red)";
    return `
      <div class="mgmt-task-row">
        <div class="mgmt-task-header">
          <div class="task-avatar sm" style="background:${member.color}20;color:${member.color};border-color:${member.color}40">${member.avatar}</div>
          <div class="mgmt-task-info">
            <div class="mgmt-task-name">${t.name}</div>
            <div class="mgmt-task-role">${t.ownerRole} — ${member.name}</div>
          </div>
          <span class="badge ${MGMT_STATUS_CLASS[t.status]}">${MGMT_STATUS_LABEL[t.status]}</span>
          <span class="badge ${dl.cls}">${dl.label}</span>
        </div>

        <div class="mgmt-progress-wrap">
          <div class="mgmt-progress-info">
            <span>Progress</span>
            <div class="mgmt-controls">
              <input type="range" min="0" max="100" value="${t.progress}" class="mgmt-slider"
                oninput="this.nextElementSibling.textContent = this.value + '%'"
                onchange="updateMgmtTask('${t.id}', 'progress', this.value)" />
              <span class="mgmt-pct">${t.progress}%</span>
            </div>
          </div>
          <div class="mgmt-bar-bg">
            <div class="mgmt-bar-fill" style="width:${t.progress}%;background:${barColor}"></div>
          </div>
        </div>

        <div class="mgmt-status-ctrl">
          <span class="mgmt-ctrl-label">Status:</span>
          <select class="mgmt-status-select" onchange="updateMgmtTask('${t.id}', 'status', this.value)">
            <option value="not-started" ${t.status === "not-started" ? "selected" : ""}>Not Started</option>
            <option value="in-progress" ${t.status === "in-progress" ? "selected" : ""}>In Progress</option>
            <option value="completed"   ${t.status === "completed"   ? "selected" : ""}>Completed</option>
          </select>
          <span class="mgmt-deadline">📅 ${t.deadline}</span>
        </div>
      </div>`;
  }).join("");

  /* ════ HTML ════ */
  mainView.innerHTML = `

    <!-- ① Overall Progress -->
    <div class="mgmt-overall-card">
      <div class="mgmt-overall-title">📁 Overall Project Progress</div>
      <div class="mgmt-overall-stats">
        <span class="mgmt-stat"><span class="mgmt-stat-num" style="color:var(--green)">${completed}</span> Completed</span>
        <span class="mgmt-stat"><span class="mgmt-stat-num" style="color:var(--yellow)">${inProgress}</span> In Progress</span>
        <span class="mgmt-stat"><span class="mgmt-stat-num" style="color:var(--muted)">${notStarted}</span> Not Started</span>
        <span class="mgmt-stat"><span class="mgmt-stat-num" style="color:var(--red)">${overdue}</span> Overdue</span>
      </div>
      <div class="mgmt-overall-bar-bg">
        <div class="mgmt-overall-bar-fill" style="width:${avgProg}%;background:${progColor}"></div>
      </div>
      <div class="mgmt-overall-pct-row">
        <span style="font-size:.75rem;color:var(--muted)">Average task completion across all deliverables</span>
        <span class="mgmt-overall-pct" style="color:${progColor}">${avgProg}%</span>
      </div>
    </div>

    <!-- ② Schedule & Budget row -->
    <div class="mgmt-sb-row">

      <!-- Schedule Status -->
      <div class="card">
        <div class="card-hdr">📅 Schedule Status</div>
        <div class="schedule-stat-grid">
          <div>
            <div class="sched-num" style="color:${schedColor}">${avgProg}%</div>
            <div class="sched-lbl">Work Done</div>
          </div>
          <div>
            <div class="sched-num" style="color:var(--blue)">${schedPct}%</div>
            <div class="sched-lbl">Time Elapsed</div>
          </div>
          <div>
            <div class="sched-num" style="color:${daysLeft <= 7 ? 'var(--red)' : daysLeft <= 15 ? 'var(--yellow)' : 'var(--text)'}">${daysLeft}d</div>
            <div class="sched-lbl">Days Left</div>
          </div>
        </div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:8px">
          ${avgProg >= schedPct
            ? '<span style="color:var(--green)">✓ Ahead of schedule</span>'
            : avgProg >= schedPct - 10
              ? '<span style="color:var(--yellow)">⚠ Slightly behind schedule</span>'
              : '<span style="color:var(--red)">✗ Behind schedule — action needed</span>'}
        </div>
        <div style="margin-top:10px">
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Progress vs Time</div>
          <div class="horiz-bar-bg" style="height:8px;position:relative">
            <div class="horiz-bar-fill" style="width:${schedPct}%;background:var(--blue);opacity:.4;position:absolute;top:0;left:0;height:100%;border-radius:4px"></div>
            <div class="horiz-bar-fill" style="width:${avgProg}%;background:${progColor};height:100%;border-radius:4px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-top:3px">
            <span>Work ${avgProg}%</span><span>Time ${schedPct}%</span>
          </div>
        </div>
      </div>

      <!-- Budget & Cost -->
      <div class="card">
        <div class="card-hdr">💰 Budget &amp; Cost Status</div>
        <div class="budget-totals">
          <div class="budget-total-item">
            <span class="budget-total-num" style="color:var(--blue)">$${budget.total.toLocaleString()}</span>
            <span class="budget-total-lbl">Total Budget</span>
          </div>
          <div class="budget-total-item">
            <span class="budget-total-num" style="color:${budgetColor}">$${budget.spent.toLocaleString()}</span>
            <span class="budget-total-lbl">Spent (${budgetPct}%)</span>
          </div>
          <div class="budget-total-item">
            <span class="budget-total-num" style="color:var(--green)">$${budgetRemaining.toLocaleString()}</span>
            <span class="budget-total-lbl">Remaining</span>
          </div>
        </div>
        <div style="margin-bottom:12px">
          <div class="horiz-bar-bg"><div class="horiz-bar-fill" style="width:${budgetPct}%;background:${budgetColor}"></div></div>
          <div style="font-size:.65rem;color:var(--muted);margin-top:4px">${budgetPct}% of budget consumed</div>
        </div>
        ${budgetBreakdownRows}
      </div>
    </div>

    <!-- ③ Milestones -->
    <div class="card" style="margin-bottom:var(--gap)">
      <div class="card-hdr">🏁 Milestone Tracking
        <span class="card-hint">${msCompleted}/${milestones.length} completed</span>
      </div>
      <div class="milestone-list">${milestoneItems}</div>
    </div>

    <!-- ④ Team Workload & Risk Overview row -->
    <div class="mgmt-wr-row">
      <div class="card">
        <div class="card-hdr">👥 Team Workload &amp; Responsibilities</div>
        <div class="workload-list">${workloadRows}</div>
      </div>
      <div class="card">
        <div class="card-hdr">🛡️ Risk Overview
          <span class="card-hint">${openRisks.length} open · ${critRisksCount} critical</span>
        </div>
        <div class="risk-mini-list">${riskOverview}</div>
      </div>
    </div>

    <!-- ⑤ Management Alerts -->
    <div class="card" style="margin-bottom:var(--gap)">
      <div class="card-hdr">🔔 Management Alerts <span class="card-hint">${alerts.length} active</span></div>
      <div class="alerts-list">${alertRows}</div>
    </div>

    <!-- ⑥ Deliverables Table -->
    <div class="card">
      <div class="card-hdr">📋 Project Deliverables <span class="card-hint">adjust progress &amp; status inline</span></div>
      <div class="mgmt-task-list">${taskRows}</div>
    </div>`;
}
