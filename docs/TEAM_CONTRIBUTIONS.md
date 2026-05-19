# Team Contributions

**Project:** ProjectPulse — Team & Pipeline Health Monitor  
**Stage:** 1 & 2  
**Team Size:** 6 members

---

## Stage 1 Contributions

| Member | Role | Files Owned | Key Deliverables |
|--------|------|-------------|-----------------|
| **Ali Yılmaz** | Project Manager | `docs/stakeholders.md`, `docs/risk-register.md` | Scope definition, sprint tracking, stakeholder register |
| **Mert Demir** | Lead Developer | `js/logic.js`, `js/data.js` | State machine, decision engine, rendering loop, data model |
| **Elif Şahin** | QA / Tester | `docs/test-plan.md` | Test coverage criteria, QA threshold definitions, mock test data |
| **Ayşe Kaya** | UX/UI Designer | `index.html`, `css/styles.css`, `js/charts.js` | Design system, SVG charts, responsive layout, accessibility |
| **Zeynep Arslan** | Risk Manager | `docs/risk-register.md`, risk model in `js/data.js` | Risk classification, mitigation strategies, scenario data |
| **Can Öztürk** | Operations Lead | Pipeline analytics in `js/charts.js`, system health data | CI/CD simulation, uptime/error-rate metrics, incident data |

---

## Stage 2 Contributions

| Member | Role | New Files / Changes | Key Deliverables |
|--------|------|---------------------|-----------------|
| **Ali Yılmaz** | Project Manager | `docs/architecture/SAD_v2.md` (sections 1–4) | SAD introduction, scope, goals, use case analysis, milestone tracking |
| **Mert Demir** | Lead Developer | `backend/server.js`, `backend/routes/tasks.js`, `backend/routes/pipeline.js`, `backend/routes/metrics.js`, `backend/routes/team.js`, `js/api.js`, `js/logic.js` (init refactor) | REST API implementation, API client with graceful fallback, boot refactor |
| **Elif Şahin** | QA / Tester | `docs/architecture/SAD_v2.md` (section 10), updated `docs/test-plan.md` | Quality attribute scenarios, API endpoint validation, stage 2 testing |
| **Ayşe Kaya** | UX/UI Designer | `docs/architecture/diagrams/deployment-view.puml`, `docker-compose.yml`, `index.html` (script tag), `readme.md` formatting | Deployment diagram, Docker Compose config, frontend wiring |
| **Zeynep Arslan** | Risk Manager | `backend/routes/risks.js`, `docs/architecture/SAD_v2.md` (sections 9, 11), `docs/architecture/diagrams/use-case.puml` | Risk CRUD API, architectural decision records, use case diagram |
| **Can Öztürk** | Operations Lead | `Dockerfile`, `backend/data/db.json`, `docs/architecture/diagrams/development-view.puml`, `docs/architecture/diagrams/process-view.puml` | Docker image, seed database, component diagram, process/sequence diagrams |

---

## Shared / Joint Contributions

| Deliverable | Contributors |
|-------------|-------------|
| `docs/architecture/diagrams/logical-view.puml` | Mert, Can |
| `docs/architecture/SAD_v2.md` (Logical + Process View sections) | Mert, Can |
| `backend/package.json` | Mert, Can |
| `.env.example`, `backend/.env.example` | Can, Ali |
| `docs/TEAM_CONTRIBUTIONS.md` (this file) | Ali |
| `readme.md` (Stage 2 updates) | Ali, Ayşe |

---

## Assumption Note

> The above Stage 2 attribution reflects **planned role responsibilities** consistent with the Stage 1 contribution mapping. In practice, for an academic project of this scope (one person or a small group), all files may be authored by the same individual. The attribution demonstrates how professional team responsibilities would be distributed in a real 6-person team.

---

## File Ownership Matrix (Stage 2 Complete)

| File / Directory | Primary Owner | Reviewer |
|-----------------|---------------|----------|
| `index.html` | Ayşe | Mert |
| `css/styles.css` | Ayşe | Ali |
| `js/data.js` | Mert | Elif |
| `js/api.js` | Mert | Can |
| `js/charts.js` | Ayşe, Can | Mert |
| `js/logic.js` | Mert | All |
| `js/management.js` | Ali, Mert | Ayşe |
| `backend/server.js` | Mert | Can |
| `backend/routes/tasks.js` | Mert | Elif |
| `backend/routes/pipeline.js` | Mert, Can | Zeynep |
| `backend/routes/metrics.js` | Mert | Elif |
| `backend/routes/risks.js` | Zeynep, Mert | Ali |
| `backend/routes/team.js` | Mert | Ali |
| `backend/data/db.json` | Mert, Can | All |
| `Dockerfile` | Can | Mert |
| `docker-compose.yml` | Can, Ayşe | Ali |
| `docs/architecture/SAD_v2.md` | Ali (coord.) | All |
| `docs/architecture/diagrams/*.puml` | See Stage 2 table | Mert |
| `docs/risk-register.md` | Zeynep | Ali |
| `docs/test-plan.md` | Elif | Zeynep |
| `readme.md` | Ali, Ayşe | All |
