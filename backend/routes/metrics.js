const express = require('express');
const router  = express.Router();
const seed    = require('../data/db.json');

let metrics = JSON.parse(JSON.stringify(seed.metrics));

const getMetrics = () => metrics;

/* GET /api/metrics — all role metrics */
router.get('/', (req, res) => res.json(metrics));

/* GET /api/metrics/:role — single role (pm | dev | qa | ux | ops | risk) */
router.get('/:role', (req, res) => {
  const data = metrics[req.params.role];
  if (!data) return res.status(404).json({ error: 'Role not found' });
  res.json(data);
});

/* PATCH /api/metrics/:role — update a role's metrics */
router.patch('/:role', (req, res) => {
  if (!metrics[req.params.role]) return res.status(404).json({ error: 'Role not found' });
  Object.assign(metrics[req.params.role], req.body);
  res.json(metrics[req.params.role]);
});

module.exports = router;
module.exports.getMetrics = getMetrics;
