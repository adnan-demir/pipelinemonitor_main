const express = require('express');
const router  = express.Router();
const seed    = require('../data/db.json');

let team = JSON.parse(JSON.stringify(seed.team));

const getTeam = () => team;

/* GET /api/team */
router.get('/', (req, res) => res.json(team));

/* GET /api/team/:id */
router.get('/:id', (req, res) => {
  const member = team.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Team member not found' });
  res.json(member);
});

module.exports = router;
module.exports.getTeam = getTeam;
