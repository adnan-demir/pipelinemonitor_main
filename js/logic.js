/* ═══════════════════════════════════════════════
   LOGIC LAYER — ProjectPulse
   State, Decision Engine, Rendering, Events.
   ═══════════════════════════════════════════════ */

/* ══ STATE ══ */
const state = {
  view:           "overview",    // overview | analytics | risks | logs | management
  filterRole:     "All",
  filterStatus:   "All",
  filterRisk:     "All",
  selectedTaskId: null,
  simulationMode: "default",    // default | failure | healthy
};

const LS_KEY = "projectpulse_v2";

/* ══ DOM REFS ══ */
const $ = (id) => document.getElementById(id);
const mainView       = $("main-view");
const inspPanel      = $("inspection-panel");
const filterRoleEl   = $("filter-role");
const filterStatusEl = $("filter-status");
const filterRiskEl   = $("filter-risk");
const modeSelect     = $("mode-switch");
const viewTabs       = document.querySelectorAll(".view-tab");

/* ══ STATUS HELPERS ══ */
const STATUS_CLASS = {
  done:          "badge-green",
  "in-progress": "badge-yellow",
  delayed:       "badge-red",
  blocked:       "badge-red badge-dashed",
};

const SEVERITY_CLASS = {
  Critical: "badge-red",
  High:     "badge-orange",
  Medium:   "badge-yellow",
  Low:      "badge-green",
};

function teamMember(id) {
  return appData.team.find(m => m.id === id) || { name: id, avatar: "?", color: "#888" };
}

/* ══ DECISION ENGINE ══ */
function decideHealth() {
  const p = appData.pipeline;
  const tasks = appData.tasks;
  const delayed = tasks.filter(t => t.status === "delayed" || t.status === "blocked").length;
  const critRisks = appData.risks.filter(r => r.severity === "Critical" && r.status === "Open").length;

  if (p.build === "failed" || critRisks > 0)
    return { cls: "health-red",    icon: "🔴", label: "Critical", desc: "Build failure or critical risk detected. Release blocked." };
  if (delayed > 1 || p.tests < 75)
    return { cls: "health-yellow", icon: "⚠️",  label: "At Risk",  desc: `${delayed} task(s) delayed. Quality gate may not pass.` };
  return   { cls: "health-green",  icon: "✅", label: "Healthy",  desc: "All systems nominal. Release readiness: High." };
}

function decideRelease() {
  const p = appData.pipeline;
  const blocked = appData.tasks.filter(t => t.status === "delayed" || t.status === "blocked").length;
  const openCrit = appData.risks.filter(r => r.severity === "Critical" && r.status === "Open").length;
  const checks = [
    { label: "Build passing",          pass: p.build === "success"    },
    { label: "Test pass rate ≥ 90%",   pass: p.tests >= 90            },
    { label: "Coverage ≥ 80%",         pass: p.coverage >= 80         },
    { label: "No delayed tasks",       pass: blocked === 0            },
    { label: "No critical open risks", pass: openCrit === 0           },
  ];
  const passCount = checks.filter(c => c.pass).length;
  return { checks, ready: passCount === checks.length, score: passCount, total: checks.length };
}

function decideStabilityScore() {
  const p = appData.pipeline;
  const critIncidents = (appData.incidents || []).filter(
    i => i.severity === "Critical" && i.status !== "Resolved"
  ).length;
  const uptimeScore   = p.uptime * 0.4;
  const errorScore    = Math.max(0, 100 - p.errorRate * 10) * 0.3;
  const testScore     = p.tests * 0.2;
  const incidentBonus = critIncidents === 0 ? 10 : 0;
  return Math.min(100, Math.round(uptimeScore + errorScore + testScore + incidentBonus));
}

/* ══ FILTER TASKS ══ */
function getFilteredTasks() {
  return appData.tasks.filter(t => {
    if (state.filterRole   !== "All" && t.role   !== state.filterRole)   return false;
    if (state.filterStatus !== "All" && t.status !== state.filterStatus) return false;
    if (state.filterRisk   !== "All" && t.risk   !== state.filterRisk)   return false;
    return true;
  });
}

/* ══ ACTIONS ══ */
function markDone(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (!task || task.status === "done") return;
  task.status   = "done";
  task.risk     = "Low";
  task.testPass = 100;
  appData.activities.unshift({ id: Date.now(), time: "Just now", text: `'${task.name}' marked as Done`, type: "success" });
  patchTask(id, { status: "done", risk: "Low", testPass: 100 }); // sync to backend API
  renderAll();
}

function selectTask(id) {
  state.selectedTaskId = (state.selectedTaskId === id) ? null : id;
  renderAll();
}

function applyScenario(mode) {
  if (mode === "healthy") {
    Object.assign(appData.pipeline, SCENARIOS.healthy.pipeline);
    appData.tasks.forEach(t => {
      if (t.status === "delayed" || t.status === "blocked") t.status = "in-progress";
      t.risk = "Low";
    });
    appData.risks = [];
    if (appData.incidents) appData.incidents = appData.incidents.map(i => ({ ...i, status: "Resolved" }));
    if (SCENARIOS.healthy.perfTrend) appData.perfTrend = JSON.parse(JSON.stringify(SCENARIOS.healthy.perfTrend));
    appData.metrics.ops.uptime       = 99.9;
    appData.metrics.ops.responseTime = 145;
    appData.metrics.ops.errorRate    = 0.1;
    appData.metrics.qa.testPassRate  = 98;
    appData.activities.unshift({ id: Date.now(), time: "Just now", text: "✅ Healthy mode applied — all systems recovered.", type: "success" });
  } else if (mode === "failure") {
    Object.assign(appData.pipeline, SCENARIOS.failure.pipeline);
    SCENARIOS.failure.taskOverrides.forEach(id => {
      const t = appData.tasks.find(x => x.id === id);
      if (t) { t.status = "delayed"; t.risk = "High"; }
    });
    // Avoid duplicate failure risks
    const alreadyHasCascade = appData.risks.some(r => r.title === "Cascading System Failure");
    if (!alreadyHasCascade) {
      appData.risks.push({ id: Date.now(), title: "Cascading System Failure", severity: "Critical", category: "Technical", status: "Open", probability: "High", impact: "Critical", mitigation: "Immediate incident response required.", owner: "can" });
    }
    if (appData.incidents) {
      const alreadyHasFailIncident = appData.incidents.some(i => i.title === "Cascading System Failure Detected");
      if (!alreadyHasFailIncident) {
        appData.incidents.unshift({ id: "i_fail", time: "Just now", title: "Cascading System Failure Detected", severity: "Critical", service: "System", status: "Open", duration: "Ongoing", impact: "Multiple services degraded" });
      }
    }
    if (SCENARIOS.failure.perfTrend) appData.perfTrend = JSON.parse(JSON.stringify(SCENARIOS.failure.perfTrend));
    appData.metrics.ops.uptime       = 96.4;
    appData.metrics.ops.responseTime = 1240;
    appData.metrics.ops.errorRate    = 8.7;
    appData.metrics.qa.testPassRate  = 52;
    appData.activities.unshift({ id: Date.now(), time: "Just now", text: "🚨 Failure scenario activated — degraded state.", type: "error" });
  }
  renderAll();
}

/* ══ PERSISTENCE ══ */
function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ appData, uiState: state }));
  } catch (e) { /* ignore storage errors */ }
}

function loadState() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed.appData) {
      appData = parsed.appData;
      // Ensure new DB fields are present (forward-compat if loading old saves)
      if (!appData.incidents)    appData.incidents    = JSON.parse(JSON.stringify(DB.incidents));
      if (!appData.perfTrend)    appData.perfTrend    = JSON.parse(JSON.stringify(DB.perfTrend));
      if (!appData.milestones)   appData.milestones   = JSON.parse(JSON.stringify(DB.milestones));
      if (!appData.stakeholders) appData.stakeholders = JSON.parse(JSON.stringify(DB.stakeholders));
      if (!appData.budget)       appData.budget       = JSON.parse(JSON.stringify(DB.budget));
      // Ensure risks have probability/impact fields
      appData.risks.forEach(r => {
        if (!r.probability) r.probability = "Medium";
        if (!r.impact)      r.impact      = r.severity;
      });
    }
    if (parsed.uiState) Object.assign(state, parsed.uiState);
  } catch (e) { /* ignore parse errors */ }
}

/* ══════════════════════════════════════════
   RENDER FUNCTIONS
══════════════════════════════════════════ */

/* ── OVERVIEW ── */
function renderOverview() {
  const tasks   = getFilteredTasks();
  const health  = decideHealth();
  const release = decideRelease();
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === "done").length;
  const delayed = tasks.filter(t => t.status === "delayed" || t.status === "blocked").length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  const taskRows = tasks.length
    ? tasks.map(t => {
        const m = teamMember(t.assigneeId);
        return `
          <div class="task-row ${state.selectedTaskId === t.id ? 'task-row--selected' : ''}" onclick="selectTask(${t.id})">
            <div class="task-avatar" style="background:${m.color}20; color:${m.color}; border-color:${m.color}40">${m.avatar}</div>
            <div class="task-meta">
              <div class="task-name">${t.name}</div>
              <div class="task-sub">${t.module} · ${m.name}</div>
            </div>
            <span class="badge ${STATUS_CLASS[t.status] || 'badge-dim'}">${t.status}</span>
          </div>`;
      }).join('')
    : '<div class="empty-state">No tasks match the current filters.</div>';

  const actRows = appData.activities.slice(0, 6).map(a => `
    <div class="act-item act-${a.type}">
      <div class="act-dot"></div>
      <div>
        <div class="act-time">${a.time}</div>
        <div class="act-text">${a.text}</div>
      </div>
    </div>`).join('');

  const releaseChecks = release.checks.map(c =>
    `<div class="rel-check ${c.pass ? 'rel-pass' : 'rel-fail'}">
      <span>${c.pass ? '✓' : '✗'}</span> ${c.label}
    </div>`
  ).join('');

  mainView.innerHTML = `
    <!-- Health Banner -->
    <div class="health-banner ${health.cls}">
      <span class="health-icon">${health.icon}</span>
      <div>
        <div class="health-label">${health.label}</div>
        <div class="health-desc">${health.desc}</div>
      </div>
      <div class="health-release" style="margin-left:auto;text-align:right;">
        <div class="release-badge ${release.ready ? 'release-ready' : 'release-block'}">${release.ready ? '🚀 READY TO RELEASE' : '🚫 RELEASE BLOCKED'}</div>
        <div style="font-size:.7rem;margin-top:4px;opacity:.7">${release.score}/${release.total} gates passing</div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Filtered Tasks</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--green)">${done}</div><div class="stat-lbl">Completed</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--red)">${delayed}</div><div class="stat-lbl">Delayed/Blocked</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--blue)">${pct}%</div><div class="stat-lbl">Progress</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--yellow)">${appData.pipeline.tests}%</div><div class="stat-lbl">Test Rate</div></div>
    </div>

    <div class="overview-grid">
      <!-- Task List -->
      <div class="card span-2">
        <div class="card-hdr">📋 Task Board <span class="card-hint">(click to inspect)</span></div>
        <div class="task-list">${taskRows}</div>
      </div>

      <!-- Release Gates -->
      <div class="card">
        <div class="card-hdr">🚀 Release Gates</div>
        <div class="release-list">${releaseChecks}</div>
      </div>

      <!-- Activity -->
      <div class="card">
        <div class="card-hdr">⚡ Activity Feed</div>
        <div class="act-feed">${actRows}</div>
      </div>
    </div>`;
}

/* ── ANALYTICS ── */
function renderAnalytics() {
  mainView.innerHTML = `
    <div class="analytics-grid">

      <!-- Tasks by Role Bar -->
      <div class="card">
        <div class="card-hdr">📊 Tasks by Role</div>
        <div class="bar-chart-wrap" id="chart-role"></div>
      </div>

      <!-- Status Donut -->
      <div class="card">
        <div class="card-hdr">🍩 Status Distribution</div>
        <div id="chart-status"></div>
      </div>

      <!-- Sprint Burnup -->
      <div class="card span-2">
        <div class="card-hdr">📈 Sprint Burnup Trend</div>
        <div id="chart-burnup"></div>
      </div>

      <!-- Pipeline Metrics Bars -->
      <div class="card span-2">
        <div class="card-hdr">⚙️ Pipeline Health Metrics</div>
        <div id="chart-pipeline"></div>
      </div>

      <!-- Role-Based Deep Metrics -->
      <div class="card">
        <div class="card-hdr">👔 Management (Ali)</div>
        <div id="role-pm"></div>
      </div>
      <div class="card">
        <div class="card-hdr">💻 Development (Mert)</div>
        <div id="role-dev"></div>
      </div>
      <div class="card">
        <div class="card-hdr">🧪 QA (Elif)</div>
        <div id="role-qa"></div>
      </div>
      <div class="card">
        <div class="card-hdr">🖌️ UX (Ayşe)</div>
        <div id="role-ux"></div>
      </div>
      <div class="card">
        <div class="card-hdr">🔒 Risk (Zeynep)</div>
        <div id="role-risk"></div>
      </div>
      <div class="card">
        <div class="card-hdr">🖥️ Ops (Can)</div>
        <div id="role-ops"></div>
      </div>
    </div>`;

  /* Populate charts */
  const roleCounts = {};
  appData.tasks.forEach(t => { roleCounts[t.role] = (roleCounts[t.role] || 0) + 1; });
  renderBarChart("chart-role",
    Object.entries(roleCounts).map(([label, value]) => ({ label: label.split(' ')[0], value })),
    () => "var(--blue)"
  );

  const tasks = appData.tasks;
  const doneN = tasks.filter(t => t.status === "done").length;
  const inpN  = tasks.filter(t => t.status === "in-progress").length;
  const delN  = tasks.filter(t => t.status === "delayed" || t.status === "blocked").length;
  renderDonutChart("chart-status", [
    { label: "Done",    value: doneN, color: "var(--green)"  },
    { label: "In Prog", value: inpN,  color: "var(--yellow)" },
    { label: "Delayed", value: delN,  color: "var(--red)"    },
  ], tasks.length);

  renderBurnupChart("chart-burnup", appData.burnup);

  const p = appData.pipeline;
  renderHorizBars("chart-pipeline", [
    { label: "Test Pass Rate", val: p.tests,    color: null           },
    { label: "Code Coverage",  val: p.coverage, color: null           },
    { label: "Uptime",         val: p.uptime,   color: "var(--green)" },
    { label: "Error Rate",     val: p.errorRate, unit: "%", color: "var(--red)" },
  ]);

  const m = appData.metrics;
  renderRoleMetrics("role-pm", [
    { label: "Sprint Progress",  value: m.pm.sprintProgress + "%",         color: "var(--blue)"   },
    { label: "Delayed Tasks",    value: m.pm.delayedTasks,                 color: m.pm.delayedTasks > 0 ? "var(--red)" : "var(--green)" },
    { label: "Velocity",         value: m.pm.velocity + " pts",            color: "var(--text)"   },
    { label: "Burndown Delta",   value: m.pm.burndownDelta + " pts",       color: "var(--yellow)" },
  ]);
  renderRoleMetrics("role-dev", [
    { label: "Total Commits",    value: m.dev.commits,                     color: "var(--blue)"   },
    { label: "Lines Changed",    value: m.dev.linesChanged.toLocaleString(), color: "var(--text)" },
    { label: "Open PRs",         value: m.dev.openPRs,                    color: "var(--yellow)" },
    { label: "Merged Today",     value: m.dev.mergedToday,                 color: "var(--green)"  },
  ]);
  renderRoleMetrics("role-qa", [
    { label: "Test Pass Rate",   value: m.qa.testPassRate + "%",           color: m.qa.testPassRate >= 90 ? "var(--green)" : "var(--red)" },
    { label: "Coverage",         value: m.qa.coverage + "%",               color: "var(--yellow)" },
    { label: "Failed Tests",     value: m.qa.failedTests,                  color: "var(--red)"    },
    { label: "Bugs/Deploy",      value: m.qa.bugsDeploy,                   color: "var(--yellow)" },
  ]);
  renderRoleMetrics("role-ux", [
    { label: "Usability Score",  value: m.ux.usabilityScore + "%",         color: "var(--green)"  },
    { label: "Clarity Score",    value: m.ux.clarityScore + "%",           color: "var(--blue)"   },
    { label: "Accessibility",    value: m.ux.accessibilityScore + "%",     color: "var(--yellow)" },
    { label: "Avg Click Depth",  value: m.ux.clickDepth + " clicks",       color: "var(--text)"   },
  ]);
  renderRoleMetrics("role-risk", [
    { label: "Open Risks",       value: m.risk.openRisks,                  color: "var(--red)"    },
    { label: "Critical Risks",   value: m.risk.criticalRisks,              color: "var(--red)"    },
    { label: "Mitigated/Week",   value: m.risk.mitigatedThisWeek,          color: "var(--green)"  },
    { label: "Risk Score",       value: m.risk.riskScore + "/100",         color: "var(--yellow)" },
  ]);
  renderRoleMetrics("role-ops", [
    { label: "Uptime",           value: m.ops.uptime + "%",                color: "var(--green)"  },
    { label: "Response Time",    value: m.ops.responseTime + "ms",         color: m.ops.responseTime > 800 ? "var(--red)" : "var(--yellow)" },
    { label: "Error Rate",       value: m.ops.errorRate + "%",             color: "var(--red)"    },
    { label: "Deploy Frequency", value: m.ops.deployFrequency,             color: "var(--text)"   },
  ]);
}

/* ── RISKS ── */
function renderRisks() {
  const criticalCount = appData.risks.filter(r => r.severity === "Critical").length;
  const highCount     = appData.risks.filter(r => r.severity === "High").length;
  const mediumCount   = appData.risks.filter(r => r.severity === "Medium").length;
  const openCount     = appData.risks.filter(r => r.status  === "Open").length;

  const riskRows = appData.risks.map(r => {
    const owner = teamMember(r.owner);
    const probClass   = { High: "badge-red", Medium: "badge-yellow", Low: "badge-green" }[r.probability]   || "badge-dim";
    const impactClass = { Critical: "badge-red", High: "badge-orange", Medium: "badge-yellow", Low: "badge-green" }[r.impact] || "badge-dim";
    return `
      <div class="risk-card">
        <div class="risk-header">
          <span class="badge ${SEVERITY_CLASS[r.severity]}">${r.severity}</span>
          <span class="risk-cat">${r.category}</span>
          <span class="badge badge-dim" style="margin-left:auto">${r.status}</span>
        </div>
        <div class="risk-title">${r.title}</div>
        <div class="risk-meta-row">
          <span class="risk-meta-lbl">Probability:</span>
          <span class="badge ${probClass}" style="font-size:.6rem;padding:2px 6px">${r.probability || 'N/A'}</span>
          <span class="risk-meta-lbl" style="margin-left:8px">Impact:</span>
          <span class="badge ${impactClass}" style="font-size:.6rem;padding:2px 6px">${r.impact || 'N/A'}</span>
        </div>
        <div class="risk-mitigation">💡 ${r.mitigation}</div>
        <div class="risk-owner">
          <div class="task-avatar sm" style="background:${owner.color}20; color:${owner.color}; border-color:${owner.color}40">${owner.avatar}</div>
          Owner: ${owner.name}
        </div>
      </div>`;
  }).join('') || '<div class="empty-state">No active risks. System is clean.</div>';

  /* Stakeholder table */
  const stakeRows = (appData.stakeholders || []).map(s => {
    const intClass  = { High: "badge-red",  Medium: "badge-yellow", Low: "badge-green" }[s.interest]  || "badge-dim";
    const inflClass = { High: "badge-orange", Medium: "badge-yellow", Low: "badge-dim" }[s.influence] || "badge-dim";
    return `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td style="color:var(--muted)">${s.role}</td>
        <td><span class="badge ${intClass}">${s.interest}</span></td>
        <td><span class="badge ${inflClass}">${s.influence}</span></td>
        <td style="color:var(--text-2)">${s.expectations}</td>
        <td><span class="badge badge-dim">${s.commFreq}</span></td>
        <td style="color:var(--muted);font-size:.72rem">${s.concerns}</td>
      </tr>`;
  }).join('');

  mainView.innerHTML = `
    <!-- Risk Summary Cards -->
    <div class="risk-summary-row">
      <div class="risk-stat-card"><div class="risk-stat-num" style="color:var(--red)">${criticalCount}</div><div class="risk-stat-lbl">Critical</div></div>
      <div class="risk-stat-card"><div class="risk-stat-num" style="color:var(--orange)">${highCount}</div><div class="risk-stat-lbl">High</div></div>
      <div class="risk-stat-card"><div class="risk-stat-num" style="color:var(--yellow)">${mediumCount}</div><div class="risk-stat-lbl">Medium</div></div>
      <div class="risk-stat-card"><div class="risk-stat-num" style="color:var(--blue)">${appData.risks.length}</div><div class="risk-stat-lbl">Total</div></div>
      <div class="risk-stat-card"><div class="risk-stat-num" style="color:var(--text)">${openCount}</div><div class="risk-stat-lbl">Open</div></div>
    </div>

    <div class="section-hdr">🛡️ Risk Register — ${appData.risks.length} Active Risk(s)</div>
    <div class="risk-grid">${riskRows}</div>

    <!-- Stakeholder Section -->
    <div class="section-hdr" style="margin-top:calc(var(--gap) * 1.5)">👥 Stakeholder Register — ${(appData.stakeholders || []).length} Stakeholders</div>
    <div class="card">
      <div class="card-hdr">Stakeholder Analysis &amp; Communication Plan</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Interest</th><th>Influence</th>
              <th>Expectations</th><th>Comm. Freq</th><th>Key Concerns</th>
            </tr>
          </thead>
          <tbody>${stakeRows}</tbody>
        </table>
      </div>
    </div>`;
}

/* ── TECHNICAL (formerly Logs) ── */
function renderLogs() {
  const p             = appData.pipeline;
  const incidents     = appData.incidents || [];
  const perfTrend     = appData.perfTrend || [];
  const openAlerts    = appData.risks.filter(r => r.status === "Open").length;
  const openIncidents = incidents.filter(i => i.status !== "Resolved").length;
  const critIncidents = incidents.filter(i => i.severity === "Critical" && i.status !== "Resolved").length;
  const stability     = decideStabilityScore();

  const uptimeColor = p.uptime >= 99.5 ? "var(--green)" : p.uptime >= 98   ? "var(--yellow)" : "var(--red)";
  const respColor   = p.responseTime <= 300 ? "var(--green)" : p.responseTime <= 800 ? "var(--yellow)" : "var(--red)";
  const errColor    = p.errorRate <= 1 ? "var(--green)" : p.errorRate <= 5 ? "var(--yellow)" : "var(--red)";
  const stabColor   = stability >= 80 ? "var(--green)" : stability >= 60 ? "var(--yellow)" : "var(--red)";
  const incColor    = openIncidents === 0 ? "var(--green)" : critIncidents > 0 ? "var(--red)" : "var(--orange)";
  const alertColor  = openAlerts === 0 ? "var(--green)" : "var(--orange)";

  /* Incident table rows */
  const incidentRows = incidents.map(inc => {
    const sevClass    = SEVERITY_CLASS[inc.severity]   || "badge-dim";
    const statusClass = inc.status === "Resolved" ? "badge-green" : inc.status === "Watching" ? "badge-yellow" : "badge-red";
    return `
      <tr>
        <td><span class="badge ${sevClass}">${inc.severity}</span></td>
        <td style="font-weight:600">${inc.title}</td>
        <td><code class="service-tag">${inc.service}</code></td>
        <td style="color:var(--muted)">${inc.time}</td>
        <td style="color:var(--muted)">${inc.duration}</td>
        <td><span class="badge ${statusClass}">${inc.status}</span></td>
        <td style="color:var(--muted);font-size:.72rem">${inc.impact}</td>
      </tr>`;
  }).join('');

  /* Alert rows */
  const alertRows = appData.risks.filter(r => r.status === "Open").map(r => `
    <div class="alert-row alert-${r.severity.toLowerCase()}">
      <span>⚠️</span>
      <div><strong>${r.severity}:</strong> ${r.title} — ${r.mitigation}</div>
    </div>`).join('');

  /* System log rows */
  const levelClass = { ERROR: "log-error", WARN: "log-warn", INFO: "log-info" };
  const logRows = appData.logs.map(l => `
    <div class="log-row">
      <span class="log-level ${levelClass[l.level] || ''}">${l.level}</span>
      <span class="log-time">${l.time}</span>
      <span class="log-service">[${l.service}]</span>
      <span class="log-msg">${l.message}</span>
    </div>`).join('');

  mainView.innerHTML = `
    <!-- Technical KPI Row -->
    <div class="tech-kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">System Uptime</div>
        <div class="kpi-val" style="color:${uptimeColor}">${p.uptime}%</div>
        <div class="kpi-sub">Current period</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg Response Time</div>
        <div class="kpi-val" style="color:${respColor}">${p.responseTime}<span style="font-size:.9rem">ms</span></div>
        <div class="kpi-sub">API latency</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Error Rate</div>
        <div class="kpi-val" style="color:${errColor}">${p.errorRate}<span style="font-size:.9rem">%</span></div>
        <div class="kpi-sub">Last hour</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Incidents</div>
        <div class="kpi-val" style="color:${incColor}">${openIncidents}</div>
        <div class="kpi-sub">${critIncidents} critical</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Stability Score</div>
        <div class="kpi-val" style="color:${stabColor}">${stability}<span style="font-size:.9rem">/100</span></div>
        <div class="kpi-sub">Composite metric</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active Alerts</div>
        <div class="kpi-val" style="color:${alertColor}">${openAlerts}</div>
        <div class="kpi-sub">From risk register</div>
      </div>
    </div>

    <!-- Trend Charts -->
    <div class="tech-charts-row">
      <div class="card">
        <div class="card-hdr">📈 Response Time Trend</div>
        <div id="chart-resp-trend"></div>
      </div>
      <div class="card">
        <div class="card-hdr">📊 Error Rate Trend</div>
        <div id="chart-err-trend"></div>
      </div>
    </div>

    <!-- Incident Log Table -->
    <div class="card" style="margin-bottom:var(--gap)">
      <div class="card-hdr">🚨 Incident Log
        <span class="card-hint">${incidents.length} total · ${openIncidents} open · ${incidents.filter(i=>i.status==='Resolved').length} resolved</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Severity</th><th>Title</th><th>Service</th><th>Time</th><th>Duration</th><th>Status</th><th>Impact</th></tr>
          </thead>
          <tbody>${incidentRows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No incidents recorded.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <!-- Alerts & Logs -->
    <div class="logs-grid">
      <div class="card span-2">
        <div class="card-hdr">🔔 Active Alerts (${openAlerts} open)</div>
        <div class="alerts-list">${alertRows || '<div class="empty-state">No active alerts.</div>'}</div>
      </div>
      <div class="card span-2">
        <div class="card-hdr">🖥️ System Logs</div>
        <div class="log-list">${logRows}</div>
      </div>
    </div>`;

  /* Render trend charts after DOM is ready */
  if (perfTrend.length >= 2) {
    renderTrendChart("chart-resp-trend", perfTrend, "responseTime", "var(--blue)",   "ms");
    renderTrendChart("chart-err-trend",  perfTrend, "errorRate",    "var(--red)",    "%");
  }
}

/* ── INSPECTION PANEL ── */
function renderInspection() {
  if (!state.selectedTaskId) {
    inspPanel.innerHTML = `
      <div class="insp-empty">
        <div>🔍</div>
        <div>Select a task to inspect its details, history, and system analysis.</div>
      </div>`;
    return;
  }
  const task = appData.tasks.find(t => t.id === state.selectedTaskId);
  if (!task) { inspPanel.innerHTML = ''; return; }
  const member = teamMember(task.assigneeId);

  let analysis = "Task is on track.";
  if (task.status === "delayed" || task.status === "blocked")
    analysis = "⚠️ This task is blocking downstream work. Reassign or deprioritize other tasks immediately.";
  else if (task.status === "in-progress" && task.testPass < 80)
    analysis = "🔬 Test coverage is insufficient. Do not merge until coverage exceeds 80%.";
  else if (appData.pipeline.build === "failed")
    analysis = "🔴 Build is currently failing. All integration is blocked. Fix must be prioritized.";

  const integStatus = appData.pipeline.build === "failed" ? "Blocked" : task.commit === "-" ? "N/A" : "Clear";
  const integColor  = integStatus === "Blocked" ? "var(--red)" : integStatus === "Clear" ? "var(--green)" : "var(--muted)";

  inspPanel.innerHTML = `
    <div class="insp-header">
      <div class="task-avatar lg" style="background:${member.color}20; color:${member.color}; border-color:${member.color}50">${member.avatar}</div>
      <div>
        <div class="insp-task-name">${task.name}</div>
        <div class="insp-sub">${member.name} · ${task.role}</div>
      </div>
    </div>

    <div class="insp-grid">
      <div class="insp-row"><span>Module</span><span>${task.module}</span></div>
      <div class="insp-row"><span>Status</span><span class="badge ${STATUS_CLASS[task.status] || 'badge-dim'}">${task.status}</span></div>
      <div class="insp-row"><span>Risk</span><span class="badge ${SEVERITY_CLASS[task.risk] || 'badge-green'}">${task.risk}</span></div>
      <div class="insp-row"><span>Commit</span><span style="font-family:monospace;color:var(--blue)">${task.commit}</span></div>
      <div class="insp-row"><span>Tests</span><span style="color:${task.testPass >= 90 ? 'var(--green)' : 'var(--red)'}">${task.testPass}%</span></div>
      <div class="insp-row"><span>Integration</span><span style="color:${integColor}">${integStatus}</span></div>
      <div class="insp-row"><span>Updated</span><span>${task.updated}</span></div>
    </div>

    <div class="insp-analysis">${analysis}</div>

    <div class="insp-action">
      ${task.status !== "done"
        ? `<button class="btn-action" onclick="markDone(${task.id})">✓ Mark as Done</button>`
        : `<div class="insp-done">✅ Task Completed</div>`}
      <button class="btn-ghost" onclick="selectTask(${task.id})">Dismiss</button>
    </div>`;
}

/* ══ MASTER RENDER ══ */
function renderAll() {
  if (state.view === "overview")   renderOverview();
  if (state.view === "analytics")  renderAnalytics();
  if (state.view === "risks")      renderRisks();
  if (state.view === "logs")       renderLogs();
  if (state.view === "management") renderManagement();
  renderInspection();
  saveState();
}

/* ══ EVENT LISTENERS ══ */

viewTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    viewTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    state.view = tab.dataset.view;
    state.selectedTaskId = null;
    renderAll();
  });
});

filterRoleEl.addEventListener("change",   e => { state.filterRole   = e.target.value; state.selectedTaskId = null; renderAll(); });
filterStatusEl.addEventListener("change", e => { state.filterStatus = e.target.value; state.selectedTaskId = null; renderAll(); });
filterRiskEl.addEventListener("change",   e => { state.filterRisk   = e.target.value; state.selectedTaskId = null; renderAll(); });

$("btn-reset").addEventListener("click", () => {
  appData = JSON.parse(JSON.stringify(DB));
  state.filterRole   = "All"; filterRoleEl.value   = "All";
  state.filterStatus = "All"; filterStatusEl.value = "All";
  state.filterRisk   = "All"; filterRiskEl.value   = "All";
  modeSelect.value   = "default";
  state.simulationMode  = "default";
  state.selectedTaskId  = null;
  localStorage.removeItem(LS_KEY);
  renderAll();
});

$("btn-simulate-fail").addEventListener("click", () => {
  state.simulationMode = "failure";
  modeSelect.value     = "failure";
  applyScenario("failure");
});
$("btn-simulate-ok").addEventListener("click", () => {
  state.simulationMode = "healthy";
  modeSelect.value     = "healthy";
  applyScenario("healthy");
});

modeSelect.addEventListener("change", e => {
  state.simulationMode = e.target.value;
  if (e.target.value !== "default") applyScenario(e.target.value);
});

$("btn-refresh").addEventListener("click", () => {
  const newUptime   = parseFloat((98.5 + Math.random() * 1.4).toFixed(1));
  const newTests    = Math.floor(70 + Math.random() * 30);
  const newResp     = Math.floor(100 + Math.random() * 900);
  const newErrRate  = parseFloat((Math.random() * 5).toFixed(1));

  appData.pipeline.uptime       = newUptime;
  appData.pipeline.tests        = newTests;
  appData.pipeline.responseTime = newResp;
  appData.pipeline.errorRate    = newErrRate;
  appData.metrics.ops.uptime       = newUptime;
  appData.metrics.ops.responseTime = newResp;
  appData.metrics.ops.errorRate    = newErrRate;
  appData.metrics.qa.testPassRate  = newTests;

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (appData.perfTrend) {
    appData.perfTrend.push({ time: timeStr, responseTime: newResp, errorRate: newErrRate });
    if (appData.perfTrend.length > 10) appData.perfTrend = appData.perfTrend.slice(-10);
    // Update last entry label to "Now"
    const last = appData.perfTrend[appData.perfTrend.length - 1];
    const prev = appData.perfTrend[appData.perfTrend.length - 2];
    if (prev && prev.time === "Now") prev.time = timeStr;
    last.time = "Now";
  }

  appData.activities.unshift({ id: Date.now(), time: "Just now", text: `Metrics refreshed — uptime ${newUptime}%, response ${newResp}ms, error ${newErrRate}%`, type: "info" });
  renderAll();
});

/* ══ INIT ══ */
function _boot() {
  loadState();
  if (filterRoleEl)   filterRoleEl.value   = state.filterRole;
  if (filterStatusEl) filterStatusEl.value = state.filterStatus;
  if (filterRiskEl)   filterRiskEl.value   = state.filterRisk;
  if (modeSelect)     modeSelect.value     = state.simulationMode || "default";
  viewTabs.forEach(t => t.classList.toggle("active", t.dataset.view === state.view));
  renderAll();
}

/* Hydrate from backend API when available; otherwise use mock data */
if (typeof initFromAPI === 'function') {
  initFromAPI().then(_boot).catch(_boot);
} else {
  _boot();
}
