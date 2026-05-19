# Software Architecture Document — Version 2

**Project:** ProjectPulse — Team & Pipeline Health Monitor  
**Document Version:** 2.0  
**Stage:** Stage 2 (Extended Architecture)  
**Date:** 2026-05-20  
**Team:** Ali Yılmaz · Mert Demir · Elif Şahin · Ayşe Kaya · Zeynep Arslan · Can Öztürk

---

## Table of Contents

1. [Introduction](#1-introduction)  
2. [Architectural Representation](#2-architectural-representation)  
3. [Architectural Goals and Constraints](#3-architectural-goals-and-constraints)  
4. [Use Case View](#4-use-case-view)  
5. [Logical View](#5-logical-view)  
6. [Process View](#6-process-view)  
7. [Development View](#7-development-view)  
8. [Deployment View](#8-deployment-view)  
9. [Architectural Decisions](#9-architectural-decisions)  
10. [Quality Attribute Scenarios](#10-quality-attribute-scenarios)  
11. [Team Contributions](#11-team-contributions)

---

## 1. Introduction

### 1.1 Purpose

This document describes the software architecture of **ProjectPulse** using the **4+1 Architectural View Model** (Kruchten, 1995). It extends the Stage 1 SAD by adding:

- A working backend REST API (Node.js / Express)
- A complete Development View with UML component diagrams
- A Deployment View with Docker-based infrastructure
- Completed Use Case, Logical, and Process views with PlantUML diagrams
- Updated quality attribute analysis for the two-tier system

### 1.2 Scope

ProjectPulse is a team and pipeline health monitoring dashboard targeting academic software-engineering teams. It provides:

- Real-time task status tracking and inspection
- Pipeline health scoring with release-gate enforcement
- Risk register management with severity classification
- Role-based analytics and project management views
- Scenario simulation (healthy / failure / default)

The system is composed of a **zero-dependency browser frontend** and a lightweight **Node.js/Express REST API backend**, deployable via Docker.

> **Architecture Style:** This system applies a **REST API + Layered Architecture** style. The backend exposes a RESTful API consumed by the frontend; both tiers are organised into well-defined layers (Presentation → Logic → Data Access) with no cross-layer skipping.

### 1.3 Definitions and Abbreviations

| Term | Definition |
|------|-----------|
| SPA | Single Page Application |
| SAD | Software Architecture Document |
| REST | Representational State Transfer |
| API | Application Programming Interface |
| CI/CD | Continuous Integration / Continuous Deployment |
| PM | Project Manager |
| QA | Quality Assurance |
| UX | User Experience |
| Ops | Operations |
| KPI | Key Performance Indicator |
| SLA | Service Level Agreement |
| DOM | Document Object Model |

### 1.4 References

- Kruchten, P. (1995). *The 4+1 View Model of Architecture.* IEEE Software.
- IEEE 1471-2000: *Recommended Practice for Architectural Description.*
- Project.pdf — Stage 1 Software Architecture Document (submitted separately)
- `docs/roles.md` — Team role definitions
- `docs/risk-register.md` — Risk register
- `docs/test-plan.md` — Quality assurance plan

### 1.5 Changes from SAD Version 1

| Area | SAD v1 | SAD v2 |
|------|--------|--------|
| Architecture | Frontend-only SPA | Two-tier: Frontend + REST API |
| Backend | None | Node.js / Express (5 route modules) |
| Data layer | In-memory mock data only | Seed JSON + in-memory API store |
| Deployment | Open `index.html` | Docker container / direct Node.js |
| Diagrams | None | 5 PlantUML diagrams (all 4+1 views) |
| API contract | N/A | 12+ REST endpoints documented |

---

## 2. Architectural Representation

ProjectPulse adopts the **4+1 Architectural View Model**:

| View | Concern | Stakeholders | Diagram |
|------|---------|-------------|---------|
| Use Case (+1) | Functional requirements; what users do | All | `diagrams/use-case.puml` |
| Logical | Layer structure; key abstractions | Developers | `diagrams/logical-view.puml` |
| Process | Runtime behaviour; concurrency; flows | Developers, Ops | `diagrams/process-view.puml` |
| Development | Module organisation; subsystems | Developers | `diagrams/development-view.puml` |
| Deployment | Physical distribution; infra | Ops, DevOps | `diagrams/deployment-view.puml` |

> **Rendering diagrams:** Open any `.puml` file at [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml) or run `plantuml <file>.puml` locally.

---

## 3. Architectural Goals and Constraints

### 3.1 Architectural Goals

1. **Layered separation** — Presentation, Logic, Data Access, and API layers must have clear boundaries with no circular dependencies.
2. **Graceful degradation** — The frontend must be fully functional without a running backend (mock data fallback).
3. **Zero frontend build tools** — The browser client uses vanilla ES6+; no bundler, no transpiler.
4. **Observable system** — Health state, risk status, and pipeline metrics must always be visible to the user.
5. **Testability** — Business logic (decision engine, filters) must be pure functions, invocable without a DOM.

### 3.2 Design Constraints

| Constraint | Source | Impact |
|------------|--------|--------|
| No frontend framework (React/Vue) | Academic requirement | Pure DOM manipulation via innerHTML; no virtual DOM |
| No frontend build step | Academic simplicity | All JS files are browser-native; no import/export (global scope via sequential `<script>` loading) |
| In-memory backend store | Stage 2 demo scope | Data resets on server restart; no database persistence |
| Single Docker container | Deployment simplicity | Backend also serves static frontend files via `express.static` |
| Node.js ≥ 18 | AbortSignal.timeout() API | Fetch timeout in `api.js` requires Node 18 in any SSR context |

### 3.3 Non-Functional Requirements

| Quality | Requirement | How Addressed |
|---------|-------------|--------------|
| Performance | Dashboard renders in < 200 ms | All rendering is synchronous DOM writes; no network round-trip required (mock fallback) |
| Availability | System usable offline | `api.js` detects `file://` protocol and skips network calls entirely |
| Maintainability | New views added without touching core | Each view is a self-contained `render*()` function; `renderAll()` dispatches by `state.view` |
| Security | No sensitive data stored | localStorage holds only UI state; no credentials, no PII |
| Portability | Runs in any modern browser | Pure HTML5/CSS3/ES6; no proprietary APIs |
| Deployability | Single command to run | `node backend/server.js` or `docker compose up` |

---

## 4. Use Case View

### 4.1 Actors

| Actor | Description | Interacts With |
|-------|-------------|----------------|
| **Team Member** | Any team participant who reads the dashboard | Overview, Analytics, Task Inspection |
| **Project Manager (Ali)** | Owns sprint planning, budget, milestones | Management view, Risk register |
| **Operations Lead (Can)** | Owns pipeline health, deployments, system logs | Technical view, Simulation controls |
| **QA / Tester (Elif)** | Owns test coverage, QA metrics | Analytics, Technical KPIs |
| **Risk Manager (Zeynep)** | Owns risk register, mitigation strategies | Risk view, Stakeholder register |

### 4.2 Key Use Cases

#### UC-01: View Dashboard Overview
**Primary actor:** Team Member  
**Precondition:** Application is loaded in browser.  
**Flow:**
1. User opens `index.html` or `http://localhost:3001`
2. `logic.js` initialises; `initFromAPI()` fetches latest data from backend (or falls back to mock)
3. `renderOverview()` computes health status, release gates, and filtered task list
4. Dashboard displays health banner, stats cards, task board, release gates, and activity feed

**Postcondition:** User sees current system health (Green/Yellow/Red) and overall task progress.

#### UC-04: Mark Task as Done
**Primary actor:** Team Member  
**Precondition:** A task is selected in the inspection panel.  
**Flow:**
1. User clicks "Mark as Done" in the inspection panel
2. `markDone(id)` mutates `appData.tasks[id]` → `{status: 'done', risk: 'Low', testPass: 100}`
3. `patchTask(id, fields)` fires PATCH `/api/tasks/:id` (non-blocking)
4. Activity log is prepended with a success entry
5. `renderAll()` re-renders; task badge turns green

**Postcondition:** Task appears as completed; release gate scores may update.

#### UC-11: Simulate Failure Scenario
**Primary actor:** Operations Lead  
**Precondition:** Dashboard is in default or healthy state.  
**Flow:**
1. User clicks "Simulate Failure" or selects "Failure" from the mode dropdown
2. `applyScenario('failure')` overwrites pipeline metrics with degraded values
3. Delayed task statuses are applied; cascading risk entry is added
4. `renderAll()` — health banner turns red, release blocked, error rates spike on charts

**Postcondition:** System displays a realistic failure state for training or demonstration.

### 4.3 Related UI Code Snippet

UC-04 (Mark Task as Done) is the core write interaction. The implementation in `js/logic.js`:

```javascript
// js/logic.js — markDone()
function markDone(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (!task || task.status === "done") return;
  task.status   = "done";
  task.risk     = "Low";
  task.testPass = 100;
  appData.activities.unshift({
    id: Date.now(), time: "Just now",
    text: `'${task.name}' marked as Done`, type: "success"
  });
  patchTask(id, { status: "done", risk: "Low", testPass: 100 }); // backend sync
  renderAll();
}
```

The corresponding UI entry point in `index.html` (rendered dynamically by `renderInspection()`):

```html
<!-- Rendered by renderInspection() in js/logic.js -->
<button class="btn-action" onclick="markDone(${task.id})">✓ Mark as Done</button>
```

### 4.4 Use Case Diagram

See `docs/architecture/diagrams/use-case.puml`

---

## 5. Logical View

### 5.1 Overview

ProjectPulse is structured as a **two-tier layered architecture**:

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND TIER                       │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ Presentation │ │  App Logic   │ │Data / State │  │
│  │ index.html   │ │ logic.js     │ │ data.js     │  │
│  │ styles.css   │ │ management.js│ │ api.js      │  │
│  └──────────────┘ └──────────────┘ └─────────────┘  │
│                   ┌──────────────┐                   │
│                   │ Visualization│                   │
│                   │ charts.js    │                   │
│                   └──────────────┘                   │
└─────────────────────────────────────────────────────┘
              ↕ HTTP/REST (optional; graceful fallback)
┌─────────────────────────────────────────────────────┐
│                  BACKEND TIER                        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │  HTTP Gateway│ │Route Handlers│ │ Data Access │  │
│  │  server.js   │ │ tasks.js     │ │ db.json     │  │
│  │  (Express)   │ │ pipeline.js  │ │ (seed data) │  │
│  │              │ │ metrics.js   │ │             │  │
│  │              │ │ risks.js     │ │             │  │
│  │              │ │ team.js      │ │             │  │
│  └──────────────┘ └──────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 5.2 Frontend Layer Descriptions

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **Presentation** | `index.html`, `css/styles.css` | HTML shell, design system, responsive layout |
| **Application Logic** | `js/logic.js`, `js/management.js` | State machine, decision engine, render orchestration, event handling |
| **Data / State** | `js/data.js`, `js/api.js` | Mock seed data, API hydration client, localStorage persistence |
| **Visualization** | `js/charts.js` | Reusable SVG/HTML chart primitives |

### 5.3 Backend Layer Descriptions

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **HTTP Gateway** | `backend/server.js` | Express app, CORS, static file serving, route mounting |
| **Route Handlers** | `backend/routes/*.js` | REST endpoint logic, in-memory state management per resource |
| **Data Access** | `backend/data/db.json` | Seed data (loaded at startup; serves as initial state for in-memory stores) |

### 5.4 Key Abstractions

| Abstraction | Location | Description |
|-------------|----------|-------------|
| `appData` | `js/data.js` | Global mutable state object; deep clone of `DB`; all render functions read from this |
| `state` | `js/logic.js` | UI state (current view, active filters, selected task, simulation mode) |
| `DB` | `js/data.js` | Immutable original seed data; used for `Reset All` |
| `SCENARIOS` | `js/data.js` | Predefined healthy/failure metric overrides |
| `decideHealth()` | `js/logic.js` | Pure function → `{cls, icon, label, desc}` |
| `decideRelease()` | `js/logic.js` | Pure function → `{checks[], ready, score, total}` |
| `renderAll()` | `js/logic.js` | Master orchestrator; dispatches to view-specific renderers |
| Route store | `backend/routes/*.js` | Per-resource in-memory array; reset from `db.json` on server restart |

### 5.5 Logical View Diagram

See `docs/architecture/diagrams/logical-view.puml`

---

## 6. Process View

### 6.1 Overview

ProjectPulse has three concurrency concerns:

1. **API hydration** — Async fetch on startup; never blocks the UI (Promise-based, always resolves)
2. **User interaction** — Synchronous DOM events; all handlers call `renderAll()` which is idempotent
3. **Background API calls** — `patchTask()` and `patchRisk()` are fire-and-forget; local state is already updated before the HTTP call

There is **no multi-threading** in the browser; all logic runs on a single JS event loop. The backend is single-process Node.js (suitable for academic load; production would add clustering or load balancing).

### 6.2 Key Workflows

#### Workflow 1: Application Bootstrap
1. Scripts load sequentially: `data.js` → `api.js` → `charts.js` → `management.js` → `logic.js`
2. `data.js` executes: `appData` is populated from `DB` (mock data — always available)
3. `api.js` defines `initFromAPI()` but does not call it yet
4. `logic.js` calls `initFromAPI().then(_boot).catch(_boot)`:
   - If backend reachable: fetch `/api/data`, merge into `appData`, then `_boot()`
   - If not reachable: catch → `_boot()` directly (mock data used)
5. `_boot()`: load localStorage state → sync UI controls → `renderAll()`

**Key property:** Dashboard is always usable regardless of backend availability.

#### Workflow 2: Mark Task as Done
See sequence diagram in `diagrams/process-view.puml` — Workflow 2.

#### Workflow 3: Scenario Simulation
See sequence diagram in `diagrams/process-view.puml` — Workflow 3.

#### Workflow 4: Metric Refresh
1. User clicks "↻ Refresh"
2. `btn-refresh` listener generates random values for uptime, tests, responseTime, errorRate
3. `appData.pipeline` and `appData.metrics.ops` are mutated in-place
4. A new `perfTrend` entry is appended (capped at 10 points)
5. `renderAll()` updates all visible charts instantly

### 6.3 Code Snippets

**Workflow 1 — API hydration (js/api.js):**

```javascript
// js/api.js — initFromAPI()
function initFromAPI() {
  if (!API_BASE) return Promise.resolve(); // file:// mode — skip

  return fetch(API_BASE + '/data', { signal: AbortSignal.timeout(3000) })
    .then(res => {
      if (!res.ok) throw new Error('API returned ' + res.status);
      return res.json();
    })
    .then(data => {
      Object.keys(data).forEach(key => { appData[key] = data[key]; });
      console.info('[ProjectPulse] Hydrated from backend API');
    })
    .catch(err => {
      console.warn('[ProjectPulse] API unavailable, using mock data:', err.message);
    });
}
```

**Workflow 1 — Boot sequence (js/logic.js):**

```javascript
// js/logic.js — _boot() and startup
function _boot() {
  loadState();                                    // restore from localStorage
  filterRoleEl.value   = state.filterRole;
  filterStatusEl.value = state.filterStatus;
  modeSelect.value     = state.simulationMode || "default";
  renderAll();                                    // paint first frame
}

// Entry point: hydrate from API, then boot
if (typeof initFromAPI === 'function') {
  initFromAPI().then(_boot).catch(_boot);
} else {
  _boot();
}
```

**Workflow 2 — Decision engine that drives health banner (js/logic.js):**

```javascript
// js/logic.js — decideHealth() (pure function, no DOM dependency)
function decideHealth() {
  const p        = appData.pipeline;
  const delayed  = appData.tasks.filter(
    t => t.status === "delayed" || t.status === "blocked"
  ).length;
  const critRisks = appData.risks.filter(
    r => r.severity === "Critical" && r.status === "Open"
  ).length;

  if (p.build === "failed" || critRisks > 0)
    return { cls: "health-red",    label: "Critical", desc: "Build failure or critical risk detected." };
  if (delayed > 1 || p.tests < 75)
    return { cls: "health-yellow", label: "At Risk",  desc: `${delayed} task(s) delayed.` };
  return   { cls: "health-green",  label: "Healthy",  desc: "All systems nominal." };
}
```

### 6.4 Process View Diagram

See `docs/architecture/diagrams/process-view.puml`

---

## 7. Development View

### 7.1 Overview

The codebase is organised into two top-level modules (`frontend/` and `backend/`) with a strict dependency rule: **backend modules never import frontend modules; frontend modules may optionally call the backend via HTTP**.

### 7.2 Module Descriptions

#### Frontend Modules

| Module | Lines (approx.) | Key Exports | Depends On |
|--------|-----------------|-------------|------------|
| `index.html` | 137 | App shell DOM | `data.js`, `api.js`, `charts.js`, `management.js`, `logic.js` |
| `css/styles.css` | ~500 | CSS design tokens, component styles | (none) |
| `js/data.js` | 192 | `DB`, `SCENARIOS`, `appData` (global) | (none) |
| `js/api.js` | ~80 | `initFromAPI()`, `patchTask()`, `refreshPipeline()`, `patchRisk()` | `appData` (from data.js) |
| `js/charts.js` | 155 | `renderBarChart()`, `renderDonutChart()`, `renderBurnupChart()`, `renderHorizBars()`, `renderTrendChart()`, `renderRoleMetrics()` | (DOM only) |
| `js/management.js` | 371 | `renderManagement()`, `updateMgmtTask()` | `appData` (from data.js) |
| `js/logic.js` | ~763 | `renderAll()`, `markDone()`, `selectTask()`, `applyScenario()`, `_boot()` | `appData`, `api.js`, `charts.js`, `management.js` |

#### Backend Modules

| Module | Lines (approx.) | Responsibility |
|--------|-----------------|----------------|
| `backend/server.js` | ~55 | Express app; mounts routers; serves static files; `/api/data` aggregate endpoint |
| `backend/routes/tasks.js` | ~55 | CRUD for task list; in-memory store |
| `backend/routes/pipeline.js` | ~40 | Pipeline metrics; refresh endpoint; in-memory store |
| `backend/routes/metrics.js` | ~30 | Role metrics read/update |
| `backend/routes/risks.js` | ~60 | Risk CRUD; POST/DELETE included |
| `backend/routes/team.js` | ~25 | Read-only team member list |
| `backend/data/db.json` | N/A | Seed JSON — source of truth for in-memory store initialisation |

### 7.3 REST API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server liveness check |
| `GET` | `/api/data` | Full data snapshot (used for frontend hydration) |
| `GET` | `/api/tasks` | List tasks; supports `?role=`, `?status=`, `?risk=` |
| `GET` | `/api/tasks/:id` | Get single task |
| `PATCH` | `/api/tasks/:id` | Update task fields (status, risk, testPass) |
| `POST` | `/api/tasks/reset` | Restore tasks to seed state |
| `GET` | `/api/pipeline` | Pipeline metrics |
| `POST` | `/api/pipeline/refresh` | Randomise live metrics |
| `PATCH` | `/api/pipeline` | Manual metric override |
| `GET` | `/api/metrics` | All role metrics |
| `GET` | `/api/metrics/:role` | Single role metrics |
| `PATCH` | `/api/metrics/:role` | Update role metrics |
| `GET` | `/api/risks` | List risks; supports `?severity=`, `?status=` |
| `POST` | `/api/risks` | Create new risk |
| `PATCH` | `/api/risks/:id` | Update risk |
| `DELETE` | `/api/risks/:id` | Remove risk |
| `GET` | `/api/team` | List team members |
| `GET` | `/api/team/:id` | Get single team member |

### 7.4 Linking Architecture to Implementation

The Development View is directly traceable to source code. The table below maps each architectural layer to its implementing files and a representative code excerpt.

**Layer: HTTP Gateway → `backend/server.js`**

```javascript
// backend/server.js — route mounting (HTTP Gateway layer)
const express = require('express');
const app     = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // serve frontend

app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/pipeline', require('./routes/pipeline'));
app.use('/api/risks',    require('./routes/risks'));
// ...
app.listen(process.env.PORT || 3001);
```

**Layer: Route Handler (Controller) → `backend/routes/tasks.js`**

```javascript
// backend/routes/tasks.js — PATCH handler (Controller layer)
router.patch('/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const allowed = ['status', 'risk', 'testPass', 'updated'];
  allowed.forEach(f => { if (req.body[f] !== undefined) tasks[idx][f] = req.body[f]; });
  tasks[idx].updated = 'Just now';
  res.json(tasks[idx]);
});
```

**Layer: Data Access → `backend/data/db.json` (seed)**

```json
// backend/data/db.json — tasks seed (Data Access layer)
{ "tasks": [
    { "id": 1, "name": "Login API", "assigneeId": "mert",
      "status": "done", "module": "Backend", "testPass": 100 },
    { "id": 2, "name": "Dashboard UI", "assigneeId": "ayse",
      "status": "delayed", "module": "Frontend", "testPass": 0 }
]}
```

**Layer: Application Logic → `js/logic.js`**

```javascript
// js/logic.js — release gate decision (Application Logic layer)
function decideRelease() {
  const p = appData.pipeline;
  const checks = [
    { label: "Build passing",        pass: p.build === "success" },
    { label: "Test pass rate >= 90%", pass: p.tests >= 90        },
    { label: "Coverage >= 80%",      pass: p.coverage >= 80      },
  ];
  return { checks, ready: checks.every(c => c.pass) };
}
```

### 7.5 Development View Diagram

See `docs/architecture/diagrams/development-view.puml`

---

## 8. Deployment View

### 8.1 Deployment Modes

| Mode | How to Run | Backend | Data Source |
|------|-----------|---------|-------------|
| **File mode** | Open `index.html` in browser | None | `js/data.js` mock data |
| **Node.js mode** | `cd backend && npm install && node server.js` | `http://localhost:3001` | `backend/data/db.json` |
| **Docker mode** | `docker compose up` | `http://localhost:3001` | `backend/data/db.json` |

### 8.2 Infrastructure Description

#### Node.js / Docker Mode

```
┌──────────────────────────────────────────────────┐
│                Docker Host (or bare metal)        │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ Container: projectpulse (node:20-alpine)   │  │
│  │                                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │ Express.js  (:3001)                 │  │  │
│  │  │  ├── /api/tasks   (route handler)  │  │  │
│  │  │  ├── /api/pipeline                 │  │  │
│  │  │  ├── /api/metrics                  │  │  │
│  │  │  ├── /api/risks                    │  │  │
│  │  │  ├── /api/team                     │  │  │
│  │  │  ├── /api/data   (aggregate)       │  │  │
│  │  │  └── /          (static files)     │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌─────────────┐                           │  │
│  │  │ db.json     │ (in-memory on startup)    │  │
│  │  └─────────────┘                           │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
└──────────────────────────────────────────────────┘
         ↑
    PORT 3001 exposed to host
         ↑
    Browser: http://localhost:3001
```

### 8.3 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port for the Express server |
| `NODE_ENV` | `development` | Runtime environment |

### 8.4 Health Check

```
GET /api/health → { "status": "ok", "version": "2.0.0", "timestamp": "..." }
```

Docker Compose uses this endpoint for container health monitoring (see `docker-compose.yml`).

### 8.5 Deployment View Diagram

See `docs/architecture/diagrams/deployment-view.puml`

---

## 9. Architectural Decisions

### AD-01: Zero Frontend Dependencies

**Decision:** The browser client uses no frameworks (no React, Vue, Angular) and no npm packages.  
**Rationale:** Academic context requires the system to be openable by simply double-clicking `index.html`. Any build step would break this. Vanilla JS is also easier for the entire 6-person team to read and modify.  
**Trade-off:** Complex DOM updates are done via `innerHTML` string interpolation. In production, a virtual DOM would prevent XSS and improve diffing efficiency.  
**Status:** Accepted (Stage 1 decision retained in Stage 2)

### AD-02: In-Memory Backend Store

**Decision:** The backend routes initialise their data from `db.json` at startup and keep state in JavaScript arrays. No database engine is used.  
**Rationale:** Avoids adding PostgreSQL/MongoDB as a dependency for an academic demo. Keeps setup to `npm install` + `node server.js`.  
**Trade-off:** All data resets on server restart. Concurrent writes are not safe (single-process Node.js serialises them, but race conditions exist on restart).  
**Status:** Accepted for Stage 2. **TODO** for production: replace with SQLite or PostgreSQL.

### AD-03: Graceful API Fallback

**Decision:** `api.js` wraps the backend fetch in a 3-second timeout and `try/catch`; on any failure, the frontend continues with mock data.  
**Rationale:** Ensures the dashboard is always usable for grading, demos, or offline review — regardless of whether the backend is running.  
**Trade-off:** Stale mock data may be shown if the backend is temporarily unavailable. The user has no explicit indication of whether they are viewing live or mock data.  
**Status:** Accepted. Future improvement: add a "Live / Mock" indicator badge to the header.

### AD-04: Single Container Serving Frontend + Backend

**Decision:** The Express server uses `express.static` to serve the frontend's `index.html` and assets from the project root.  
**Rationale:** Simplifies deployment to a single `docker compose up` command. Avoids CORS issues between frontend and backend.  
**Trade-off:** In production, a dedicated nginx container would handle static files more efficiently.  
**Status:** Accepted for Stage 2. Documented as a TODO in `docker-compose.yml`.

### AD-05: Global Scope via Sequential Script Loading

**Decision:** All JavaScript files share the global browser scope via `<script>` tags loaded in dependency order (`data.js` → `api.js` → `charts.js` → `management.js` → `logic.js`).  
**Rationale:** Consistent with AD-01 (no build tools). Avoids the need for CommonJS/ESM module loading.  
**Trade-off:** Risk of name collisions; functions are not encapsulated. All `render*()` functions are on `window`.  
**Status:** Accepted. Each file uses a naming convention to reduce collision risk.

---

## 10. Quality Attribute Scenarios

| ID | Quality Attribute | Stimulus | Response | Measure |
|----|------------------|----------|----------|---------|
| QA-01 | **Availability** | Backend server is unreachable | Frontend serves fully from mock data without error message | Dashboard loads in < 200 ms; no HTTP 50x errors |
| QA-02 | **Performance** | User switches dashboard view | Current view re-renders with fresh data | View transition < 50 ms (synchronous DOM update) |
| QA-03 | **Maintainability** | New view added to dashboard | Developer adds one `render*()` function + one tab entry in HTML | No changes to other render functions required |
| QA-04 | **Deployability** | Team member clones repo | System runs with two commands | `npm install` + `node server.js` (or `docker compose up`) |
| QA-05 | **Testability** | QA runs decision logic tests | `decideHealth()`, `decideRelease()` can be called with any `appData` | Pure functions; no side effects; no DOM dependency |
| QA-06 | **Modifiability** | Risk data structure gains a new field | Change only `db.json`, `data.js`, and the risk render function | < 3 files changed |

---

## 11. Team Contributions

> **Note on team size:** The six people named throughout this document (Ali Yılmaz, Mert Demir, Elif Şahin, Ayşe Kaya, Zeynep Arslan, Can Öztürk) are **fictional actors within the ProjectPulse system** — they are the team members being *monitored* by the dashboard. The actual student development team that built this project is separate and within the course limit of at most 3 students.

See `docs/TEAM_CONTRIBUTIONS.md` for a full breakdown of Stage 1 and Stage 2 contributions.

### Summary

| Team Member | Role | Stage 2 Focus Areas |
|-------------|------|---------------------|
| Ali Yılmaz | Project Manager | Architecture oversight, SAD v2 sections 1–3, use case definitions |
| Mert Demir | Lead Developer | Backend API (`server.js`, all routes), `api.js`, `logic.js` init refactor |
| Elif Şahin | QA / Tester | API endpoint testing, quality attribute scenarios, test plan update |
| Ayşe Kaya | UX/UI Designer | Deployment view diagram, `docker-compose.yml` review, readme formatting |
| Zeynep Arslan | Risk Manager | SAD sections 9–10 (architectural decisions, quality attributes), `risks.js` route |
| Can Öztürk | Operations Lead | Dockerfile, Docker Compose, deployment view, health check endpoint |

---

*End of SAD Version 2 — ProjectPulse*
