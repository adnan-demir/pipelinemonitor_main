# ProjectPulse — Team & Pipeline Health Monitor

**Stage:** 2 (Complete Frontend + Backend + Architecture Documentation)  
**Version:** 2.0.0

ProjectPulse is an interactive monitoring dashboard for team health, pipeline status, and project management. It provides real-time visibility into task progress, risk management, release readiness, and technical metrics.

---

## Quick Start

### Option 1 — Open Directly (No Server Required)

```
Open index.html in any modern browser.
```

No installation, no dependencies. All data is served from `js/data.js` mock data. Suitable for grading / offline review.

### Option 2 — Run with Node.js Backend

**Requirements:** Node.js ≥ 18

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Start the server
node server.js
```

Open `http://localhost:3001` in your browser.

The dashboard will automatically hydrate from the live backend API.

### Option 3 — Run with Docker

**Requirements:** Docker + Docker Compose

```bash
docker compose up
```

Open `http://localhost:3001` in your browser.

To stop: `docker compose down`

---

## Architecture (Stage 2)

ProjectPulse follows the **4+1 Architectural View Model**. See `docs/architecture/SAD_v2.md` for the complete Software Architecture Document.

### Architecture Diagrams (PlantUML)

| View | File | Description |
|------|------|-------------|
| Use Case | `docs/architecture/diagrams/use-case.puml` | Actors and their use cases |
| Logical | `docs/architecture/diagrams/logical-view.puml` | Layer structure and dependencies |
| Process | `docs/architecture/diagrams/process-view.puml` | Key runtime workflows |
| Development | `docs/architecture/diagrams/development-view.puml` | Component diagram |
| Deployment | `docs/architecture/diagrams/deployment-view.puml` | Docker/infrastructure layout |

**Render diagrams** by pasting `.puml` content into [plantuml.com](https://www.plantuml.com/plantuml/uml) or running `plantuml <file>.puml` locally.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (ES6+), HTML5, CSS3 — zero dependencies |
| Backend | Node.js ≥ 18, Express.js |
| Data Store | JSON flat-file (in-memory; resets on restart) |
| Deployment | Docker + Docker Compose |
| Diagrams | PlantUML |

---

## Backend API Reference

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server liveness check |
| `GET` | `/data` | Full data snapshot |
| `GET` | `/tasks` | List all tasks (`?role=` `?status=` `?risk=`) |
| `PATCH` | `/tasks/:id` | Update task status / risk / testPass |
| `GET` | `/pipeline` | Pipeline metrics |
| `POST` | `/pipeline/refresh` | Randomise live metrics |
| `PATCH` | `/pipeline` | Manual metric override |
| `GET` | `/metrics` | All role metrics |
| `GET` | `/metrics/:role` | Single role (pm/dev/qa/ux/ops/risk) |
| `GET` | `/risks` | List risks (`?severity=` `?status=`) |
| `POST` | `/risks` | Create new risk |
| `PATCH` | `/risks/:id` | Update risk |
| `DELETE` | `/risks/:id` | Delete risk |
| `GET` | `/team` | List team members |

---

## Project Structure

```
pipelinemonitor_main/
├── index.html                        # App shell (SPA entry point)
├── css/
│   └── styles.css                    # Design system (CSS variables, components)
├── js/
│   ├── data.js                       # Mock data, DB seed, scenario presets
│   ├── api.js                        # Backend API client with mock fallback
│   ├── charts.js                     # SVG/HTML chart primitives
│   ├── management.js                 # Project management view
│   └── logic.js                      # State, decision engine, rendering, events
├── backend/
│   ├── server.js                     # Express server (API + static file serving)
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── tasks.js                  # GET/PATCH /api/tasks
│   │   ├── pipeline.js               # GET/PATCH/POST /api/pipeline
│   │   ├── metrics.js                # GET/PATCH /api/metrics
│   │   ├── risks.js                  # Full CRUD /api/risks
│   │   └── team.js                   # GET /api/team
│   └── data/
│       └── db.json                   # Seed database
├── docs/
│   ├── architecture/
│   │   ├── SAD_v2.md                 # Software Architecture Document v2
│   │   └── diagrams/
│   │       ├── use-case.puml
│   │       ├── logical-view.puml
│   │       ├── process-view.puml
│   │       ├── development-view.puml
│   │       └── deployment-view.puml
│   ├── TEAM_CONTRIBUTIONS.md
│   ├── roles.md
│   ├── contribution-mapping.md
│   ├── development-process.md
│   ├── risk-register.md
│   ├── stakeholders.md
│   ├── team-activity.md
│   └── test-plan.md
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── Project.pdf                       # Stage 1 SAD (submitted separately)
```

---

## Dashboard Features

### Views

| Tab | Description |
|-----|-------------|
| **Overview** | Health banner, stats, task board, release gates, activity feed |
| **Analytics** | Bar/donut/burnup charts, role-specific KPIs |
| **Risks** | Risk register with probability × impact matrix, stakeholder register |
| **Technical** | System uptime, response time, error rate, incident log, system logs |
| **Management** | Sprint progress, budget status, milestones, team workload, deliverables |

### Controls

| Control | Action |
|---------|--------|
| Role / Status / Risk filters | Filter the task board |
| Simulate Failure | Apply degraded pipeline metrics and cascading risks |
| Simulate Recovery | Apply healthy pipeline metrics, clear risks |
| ↻ Refresh | Randomise live metrics and add a trend point |
| Reset All | Restore all data to seed state, clear localStorage |
| Mode selector | Switch between Default / Failure / Healthy scenarios |

---

## Team Structure

| Name | Role | Responsibilities |
|------|------|-----------------|
| Ali Yılmaz | Project Manager | Scope, sprints, stakeholders, SAD sections 1–4 |
| Mert Demir | Lead Developer | Core logic, backend API, api.js, architecture |
| Elif Şahin | QA / Tester | Test plan, QA metrics, quality attribute scenarios |
| Ayşe Kaya | UX/UI Designer | HTML, CSS, SVG charts, deployment diagram |
| Zeynep Arslan | Risk Manager | Risk register, architectural decisions, risks API |
| Can Öztürk | Operations Lead | Docker, deployment, process diagrams, seed data |

See `docs/TEAM_CONTRIBUTIONS.md` for the full Stage 1 + Stage 2 breakdown.  
See `docs/roles.md` for detailed role descriptions.

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `docs/architecture/SAD_v2.md` | Complete Software Architecture Document (Stage 2) |
| `docs/roles.md` | Team role definitions |
| `docs/contribution-mapping.md` | File ownership matrix |
| `docs/development-process.md` | Agile methodology |
| `docs/risk-register.md` | Risk register with mitigations |
| `docs/stakeholders.md` | Stakeholder map |
| `docs/test-plan.md` | QA criteria and coverage thresholds |
| `docs/team-activity.md` | Chronological activity log |
| `docs/TEAM_CONTRIBUTIONS.md` | Stage 1 + 2 contribution breakdown |
| `Project.pdf` | Stage 1 SAD (academic submission) |
