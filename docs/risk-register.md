# Risk Register

This register identifies known risks within the current pipeline and their mitigation strategies.

## 1. Integration Failure
- **Severity:** Critical
- **Trigger:** Build failing in CI/CD pipeline.
- **Impact:** Entire deployment process is blocked.
- **Mitigation:** Ensure code review enforces local build tests before merge.

## 2. Schedule Slippage
- **Severity:** High
- **Trigger:** Tasks entering 'delayed' or 'blocked' status.
- **Impact:** Sprint boundaries missed, pushing release dates back.
- **Mitigation:** Reallocate resources dynamically using the interactive dashboard.

## 3. Test Coverage Drop
- **Severity:** Medium
- **Trigger:** Test coverage drops below 90%.
- **Impact:** Potential for unverified edge cases in production.
- **Mitigation:** Enforce minimum coverage thresholds in branch protection rules.
