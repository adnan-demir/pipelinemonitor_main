/*
 * ProjectPulse — Backend API Server
 * Stage 2: Layered REST API over the same data model as the frontend.
 * Serves static frontend files AND exposes /api/* endpoints.
 *
 * Run:  node server.js   (or: npm start)
 * Port: 3001 (override with PORT env var)
 */

const express   = require('express');
const cors      = require('cors');
const path      = require('path');

const tasksRouter    = require('./routes/tasks');
const pipelineRouter = require('./routes/pipeline');
const metricsRouter  = require('./routes/metrics');
const risksRouter    = require('./routes/risks');
const teamRouter     = require('./routes/team');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

/* ── Serve frontend static files from project root ── */
app.use(express.static(path.join(__dirname, '..')));

/* ── API Routes ── */
app.use('/api/tasks',    tasksRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/metrics',  metricsRouter);
app.use('/api/risks',    risksRouter);
app.use('/api/team',     teamRouter);

/* ── Full data snapshot (used by frontend hydration) ── */
app.get('/api/data', (req, res) => {
  /* Re-require each time so in-memory stores are current */
  const { getTasks }     = require('./routes/tasks');
  const { getPipeline }  = require('./routes/pipeline');
  const { getMetrics }   = require('./routes/metrics');
  const { getRisks }     = require('./routes/risks');
  const { getTeam }      = require('./routes/team');
  const seed             = require('./data/db.json');

  res.json({
    team:            getTeam(),
    tasks:           getTasks(),
    pipeline:        getPipeline(),
    risks:           getRisks(),
    metrics:         getMetrics(),
    budget:          seed.budget,
    milestones:      seed.milestones,
    stakeholders:    seed.stakeholders,
    incidents:       seed.incidents,
    perfTrend:       seed.perfTrend,
    activities:      seed.activities,
    logs:            seed.logs,
    burnup:          seed.burnup,
    managementTasks: seed.managementTasks,
  });
});

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

/* ── Fallback: serve index.html for any non-API route ── */
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ProjectPulse API running  →  http://localhost:${PORT}`);
  console.log(`Dashboard               →  http://localhost:${PORT}/index.html`);
  console.log(`Health check            →  http://localhost:${PORT}/api/health`);
});
