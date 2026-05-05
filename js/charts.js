/* ═══════════════════════════════════════════════
   CHARTS LAYER — ProjectPulse
   All SVG/HTML chart rendering functions.
   ═══════════════════════════════════════════════ */

/* ── Bar Chart ── */
function renderBarChart(containerId, data, colorFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data.map(d => d.value), 1);
  container.innerHTML = data.map(d => {
    const h = Math.max((d.value / max) * 100, 2);
    const color = colorFn ? colorFn(d) : "var(--blue)";
    return `
      <div class="chart-bar-wrap" title="${d.label}: ${d.value}">
        <div class="chart-bar-inner">
          <div class="chart-bar" style="height:${h}%; background:${color};">
            <span class="bar-val">${d.value}</span>
          </div>
        </div>
        <div class="chart-bar-label">${d.label}</div>
      </div>`;
  }).join('');
}

/* ── Donut Chart ── */
function renderDonutChart(containerId, segments, centerLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 25;
  const circles = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const circle = `<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="${seg.color}" stroke-width="4.5" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}" style="transition:stroke-dasharray .5s ease;"></circle>`;
    offset -= pct;
    return circle;
  }).join('');
  const legend = segments.map(s =>
    `<div class="donut-legend-item"><span style="background:${s.color}"></span>${s.label} <b>${s.value}</b></div>`
  ).join('');
  container.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 42 42" class="donut-svg">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border)" stroke-width="4.5"></circle>
        ${circles}
        <text x="21" y="19" class="donut-text-main">${centerLabel}</text>
        <text x="21" y="25" class="donut-text-sub">total</text>
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>`;
}

/* ── Burnup Line Chart ── */
function renderBurnupChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data.map(d => Math.max(d.planned, d.actual)), 1);
  const W = 100, H = 60;
  const px = (i) => (i / (data.length - 1)) * W;
  const py = (v) => H - (v / max) * H;
  const plannedPts = data.map((d, i) => `${px(i)},${py(d.planned)}`).join(' ');
  const actualPts = data.map((d, i) => `${px(i)},${py(d.actual)}`).join(' ');
  const dots = data.map((d, i) => `
    <circle cx="${px(i)}" cy="${py(d.actual)}" r="1.5" fill="var(--blue)" />
    <title>${d.week}: planned ${d.planned}, actual ${d.actual}</title>
  `).join('');
  const labels = data.map((d, i) => `<text x="${px(i)}" y="${H + 5}" class="chart-axis-label" text-anchor="middle">${d.week}</text>`).join('');
  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H + 8}" class="burnup-svg">
      <line x1="0" y1="${py(max * 0.5)}" x2="${W}" y2="${py(max * 0.5)}" stroke="var(--border)" stroke-width="0.4"/>
      <polyline fill="none" stroke="var(--border)" stroke-dasharray="2,1" stroke-width="0.8" points="${plannedPts}"/>
      <polyline fill="none" stroke="var(--blue)" stroke-width="1.5" points="${actualPts}" style="transition: all .4s;"/>
      ${dots}
      ${labels}
    </svg>
    <div class="burnup-legend">
      <span><span class="legend-line" style="border-color:var(--border); border-style:dashed;"></span> Planned</span>
      <span><span class="legend-line" style="border-color:var(--blue);"></span> Actual</span>
    </div>`;
}

/* ── Horizontal Metric Bar ── */
function renderHorizBars(containerId, bars) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = bars.map(b => {
    const color = b.val >= 90 ? "var(--green)" : b.val >= 70 ? "var(--yellow)" : "var(--red)";
    return `
      <div class="horiz-bar-wrap">
        <div class="horiz-bar-label">
          <span>${b.label}</span>
          <strong style="color:${color}">${b.val}${b.unit || '%'}</strong>
        </div>
        <div class="horiz-bar-bg">
          <div class="horiz-bar-fill" style="width:${Math.min(b.val, 100)}%; background:${b.color || color};"></div>
        </div>
      </div>`;
  }).join('');
}

/* ── Role Metric Card ── */
function renderRoleMetrics(containerId, metrics) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = metrics.map(m => `
    <div class="role-metric-row">
      <span class="role-metric-label">${m.label}</span>
      <span class="role-metric-val" style="color:${m.color || 'var(--text)'}">${m.value}</span>
    </div>`).join('');
}

/* ── Trend Line Chart ── */
function renderTrendChart(containerId, data, valueKey, color, unit) {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length < 2) return;
  const values = data.map(d => d[valueKey]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const W = 100, H = 52;
  const px = (i) => (i / (data.length - 1)) * W;
  const py = (v) => H - ((v - min) / range) * H * 0.85 - H * 0.05;

  const pts = data.map((d, i) => `${px(i)},${py(d[valueKey])}`).join(' ');
  const areaPath = `0,${H} ` + data.map((d, i) => `${px(i)},${py(d[valueKey])}`).join(' ') + ` ${W},${H}`;

  const dots = data.map((d, i) => `
    <circle cx="${px(i)}" cy="${py(d[valueKey])}" r="1.4" fill="${color}">
      <title>${d.time}: ${d[valueKey]}${unit || ''}</title>
    </circle>`).join('');

  const firstLabel = data[0].time;
  const lastLabel  = data[data.length - 1].time;
  const gradId = 'tg_' + containerId.replace(/[^a-z0-9]/gi, '');

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H + 10}" class="burnup-svg" style="height:80px">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${color}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPath}" fill="url(#${gradId})"/>
      <polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts}" style="transition:all .4s;"/>
      ${dots}
      <text x="0"  y="${H + 8}" class="chart-axis-label" text-anchor="start">${firstLabel}</text>
      <text x="${W}" y="${H + 8}" class="chart-axis-label" text-anchor="end">${lastLabel}</text>
    </svg>
    <div class="trend-minmax">
      <span style="color:var(--muted)">Min: <strong>${Math.min(...values)}${unit||''}</strong></span>
      <span style="color:var(--muted)">Max: <strong>${Math.max(...values)}${unit||''}</strong></span>
    </div>`;
}
