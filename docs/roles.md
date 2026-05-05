# Roles and Responsibilities

This document defines the core team members, their responsibilities, and their specific contributions to the ProjectPulse system.

## Project Manager: Ali
- **Responsibilities:**
  - Defining project scope and requirements.
  - Tracking sprint progress and scheduling.
  - Ensuring task delivery aligns with deadlines.
- **Contributions:** Coordinated the initial dashboard layout requirements and defined the primary success metrics.
- **Components Worked On:** `docs/stakeholders.md`, overall project tracking configurations.

## Lead Developer: Mert
- **Responsibilities:**
  - Designing core logic and system architecture.
  - Managing branch integration and code quality.
  - Implementing state management and data filtering.
- **Contributions:** Built the primary rendering loop and interactive data filtering logic that powers the dashboard.
- **Components Worked On:** `js/logic.js`, `js/data.js`.

## QA/Tester: Elif
- **Responsibilities:**
  - Executing test scenarios and verifying data accuracy.
  - Maintaining high test coverage across components.
  - Identifying and reporting bugs during implementation.
- **Contributions:** Established testing thresholds and verified the accuracy of the dynamic chart metrics.
- **Components Worked On:** `docs/test-plan.md`, test mock data definitions.

## UX/UI Designer: Ayse
- **Responsibilities:**
  - Creating a consistent, dark-themed dashboard aesthetic.
  - Designing intuitive data visualizations and interactive charts.
  - Ensuring responsive layout and accessibility.
- **Contributions:** Designed the CSS grid structure, custom SVG charts, and interactive inspection panels.
- **Components Worked On:** `css/styles.css`, `js/charts.js`, `index.html` structure.

## Risk Manager: Zeynep
- **Responsibilities:**
  - Identifying technical and scheduling risks.
  - Defining mitigation strategies and severity levels.
  - Analyzing task blocking and dependency issues.
- **Contributions:** Developed the risk logic and active risk registry to alert the team to blocked tasks.
- **Components Worked On:** `docs/risk-register.md`, risk data models in `js/data.js`.

## Operations Lead: Can
- **Responsibilities:**
  - Monitoring build status, uptime, and system health.
  - Configuring CI/CD pipeline simulations.
  - Tracking system errors and response times.
- **Contributions:** Simulated the continuous integration health metrics and pipeline analytics panel.
- **Components Worked On:** Pipeline analytics views in `js/charts.js`, system health data.
