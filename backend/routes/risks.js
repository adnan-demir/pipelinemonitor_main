const express = require('express');
const router  = express.Router();
const seed    = require('../data/db.json');

let risks = JSON.parse(JSON.stringify(seed.risks));
let nextId = Math.max(...risks.map(r => r.id)) + 1;

const getRisks = () => risks;

/* GET /api/risks */
router.get('/', (req, res) => {
  let result = risks;
  const { severity, status } = req.query;
  if (severity) result = result.filter(r => r.severity === severity);
  if (status)   result = result.filter(r => r.status   === status);
  res.json(result);
});

/* GET /api/risks/:id */
router.get('/:id', (req, res) => {
  const risk = risks.find(r => r.id === Number(req.params.id));
  if (!risk) return res.status(404).json({ error: 'Risk not found' });
  res.json(risk);
});

/* POST /api/risks — add a new risk */
router.post('/', (req, res) => {
  const { title, severity, category, probability, impact, mitigation, owner } = req.body;
  if (!title || !severity) return res.status(400).json({ error: 'title and severity are required' });
  const risk = {
    id: nextId++, title, severity,
    category:    category    || 'Technical',
    status:      'Open',
    probability: probability || 'Medium',
    impact:      impact      || severity,
    mitigation:  mitigation  || 'TBD',
    owner:       owner       || 'ali',
  };
  risks.push(risk);
  res.status(201).json(risk);
});

/* PATCH /api/risks/:id */
router.patch('/:id', (req, res) => {
  const idx = risks.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Risk not found' });
  const allowed = ['title', 'severity', 'category', 'status', 'probability', 'impact', 'mitigation', 'owner'];
  allowed.forEach(f => { if (req.body[f] !== undefined) risks[idx][f] = req.body[f]; });
  res.json(risks[idx]);
});

/* DELETE /api/risks/:id */
router.delete('/:id', (req, res) => {
  const idx = risks.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Risk not found' });
  risks.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
module.exports.getRisks = getRisks;
