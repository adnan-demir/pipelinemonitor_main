/* ═══════════════════════════════════════════════
   API CLIENT — ProjectPulse
   Hydrates appData from the backend REST API.
   Falls back silently to the mock data already
   loaded by data.js if the server is unreachable.
   ═══════════════════════════════════════════════ */

/* Base URL: auto-detects whether the page was opened
   as a file:// URL (direct open → use mock data) or
   served by the backend (→ use relative /api path).   */
const API_BASE = (() => {
  if (window.location.protocol === 'file:') return null;
  const origin = window.location.origin;
  return origin + '/api';
})();

/* Merge API response fields into appData without
   overwriting fields that exist only in the mock. */
function _mergeInto(target, source) {
  if (!source || typeof source !== 'object') return;
  Object.keys(source).forEach(key => { target[key] = source[key]; });
}

/**
 * initFromAPI()
 * Called by logic.js before first render.
 * Returns a Promise that always resolves (never rejects).
 */
function initFromAPI() {
  if (!API_BASE) {
    /* Running as file:// — skip API entirely */
    return Promise.resolve();
  }

  return fetch(API_BASE + '/data', { signal: AbortSignal.timeout(3000) })
    .then(res => {
      if (!res.ok) throw new Error('API returned ' + res.status);
      return res.json();
    })
    .then(data => {
      /* Hydrate appData with live backend data */
      _mergeInto(appData, data);
      console.info('[ProjectPulse] Hydrated from backend API');
    })
    .catch(err => {
      /* Non-fatal — dashboard still works from mock data */
      console.warn('[ProjectPulse] API unavailable, using mock data:', err.message);
    });
}

/* ── Convenience helpers used by logic.js actions ── */

/**
 * patchTask(id, fields)
 * Sends a PATCH to /api/tasks/:id.
 * On failure, the local state has already been mutated
 * by markDone(), so the UI stays consistent.
 */
function patchTask(id, fields) {
  if (!API_BASE) return Promise.resolve();
  return fetch(`${API_BASE}/tasks/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(fields),
  }).catch(() => { /* ignore network errors */ });
}

/**
 * refreshPipeline()
 * Asks the backend to regenerate metrics and returns
 * the fresh pipeline object, or null on failure.
 */
function refreshPipeline() {
  if (!API_BASE) return Promise.resolve(null);
  return fetch(`${API_BASE}/pipeline/refresh`, { method: 'POST' })
    .then(res => res.ok ? res.json() : null)
    .catch(() => null);
}

/**
 * patchRisk(id, fields)
 */
function patchRisk(id, fields) {
  if (!API_BASE) return Promise.resolve();
  return fetch(`${API_BASE}/risks/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(fields),
  }).catch(() => {});
}
