const express = require('express');
const router  = express.Router();
const seed    = require('../data/db.json');

let pipeline = JSON.parse(JSON.stringify(seed.pipeline));

const getPipeline = () => pipeline;

/* GET /api/pipeline */
router.get('/', (req, res) => res.json(pipeline));

/* POST /api/pipeline/refresh — randomise live metrics (simulates a polling update) */
router.post('/refresh', (req, res) => {
  pipeline.uptime       = parseFloat((98.5 + Math.random() * 1.4).toFixed(1));
  pipeline.tests        = Math.floor(70  + Math.random() * 30);
  pipeline.responseTime = Math.floor(100 + Math.random() * 900);
  pipeline.errorRate    = parseFloat((Math.random() * 5).toFixed(1));
  res.json(pipeline);
});

/* PATCH /api/pipeline — manual field override (used by scenarios) */
router.patch('/', (req, res) => {
  const allowed = ['build', 'tests', 'coverage', 'uptime', 'responseTime', 'errorRate',
                   'deploys', 'sprintProgress', 'mergeStatus'];
  allowed.forEach(f => { if (req.body[f] !== undefined) pipeline[f] = req.body[f]; });
  res.json(pipeline);
});

/* POST /api/pipeline/reset */
router.post('/reset', (req, res) => {
  pipeline = JSON.parse(JSON.stringify(seed.pipeline));
  res.json(pipeline);
});

module.exports = router;
module.exports.getPipeline = getPipeline;
