const express = require('express');
const router  = express.Router();
const seed    = require('../data/db.json');

/* In-memory store — initialized from seed data on server start */
let tasks = JSON.parse(JSON.stringify(seed.tasks));

const getTasks = () => tasks;

/* GET /api/tasks — list all tasks (supports ?role= ?status= ?risk= filters) */
router.get('/', (req, res) => {
  let result = tasks;
  const { role, status, risk } = req.query;
  if (role)   result = result.filter(t => t.role   === role);
  if (status) result = result.filter(t => t.status === status);
  if (risk)   result = result.filter(t => t.risk   === risk);
  res.json(result);
});

/* GET /api/tasks/:id */
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

/* PATCH /api/tasks/:id — partial update (status, risk, testPass, progress) */
router.patch('/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const allowed = ['status', 'risk', 'testPass', 'progress', 'updated'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) tasks[idx][field] = req.body[field];
  });
  tasks[idx].updated = 'Just now';
  res.json(tasks[idx]);
});

/* POST /api/tasks/reset — restore all tasks to seed state */
router.post('/reset', (req, res) => {
  tasks = JSON.parse(JSON.stringify(seed.tasks));
  res.json({ message: 'Tasks reset to seed data', count: tasks.length });
});

module.exports = router;
module.exports.getTasks = getTasks;
