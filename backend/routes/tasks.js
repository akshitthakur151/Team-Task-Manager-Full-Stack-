const router = require('express').Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { auth } = require('../middleware/auth');

async function getMembership(projectId, userId) {
  return db.members.findOne({ projectId, userId });
}

// GET /api/projects/:projectId/tasks
router.get('/', auth, async (req, res) => {
  try {
    const membership = await getMembership(req.params.projectId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const tasks = await db.tasks.find({ projectId: req.params.projectId });
    const userIds = [...new Set(tasks.flatMap(t => [t.createdBy, t.assigneeId].filter(Boolean)))];
    const users = await db.users.find({ _id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map(u => [u._id, { id: u._id, name: u.name, email: u.email }]));

    const enriched = tasks.map(t => ({
      ...t,
      assignee: t.assigneeId ? userMap[t.assigneeId] : null,
      creator: userMap[t.createdBy] || null,
    }));

    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('assigneeId').optional(),
  body('dueDate').optional().isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const membership = await getMembership(req.params.projectId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const { title, description, priority, status, assigneeId, dueDate } = req.body;

    // Validate assignee is a member
    if (assigneeId) {
      const assigneeMembership = await db.members.findOne({ projectId: req.params.projectId, userId: assigneeId });
      if (!assigneeMembership) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const task = await db.tasks.insert({
      projectId: req.params.projectId,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'todo',
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:projectId/tasks/:taskId
router.put('/:taskId', auth, [
  body('title').optional().trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('dueDate').optional({ nullable: true }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const membership = await getMembership(req.params.projectId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const task = await db.tasks.findOne({ _id: req.params.taskId, projectId: req.params.projectId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Members can only update their assigned tasks (status only); admins can update all
    const allowed = membership.role === 'admin' || task.createdBy === req.user.id || task.assigneeId === req.user.id;
    if (!allowed) return res.status(403).json({ error: 'Not authorized to edit this task' });

    const fields = ['title', 'description', 'priority', 'status', 'assigneeId', 'dueDate'];
    const updates = { updatedAt: new Date().toISOString() };
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await db.tasks.update({ _id: req.params.taskId }, { $set: updates });
    const updated = await db.tasks.findOne({ _id: req.params.taskId });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:projectId/tasks/:taskId - admin or creator
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const membership = await getMembership(req.params.projectId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const task = await db.tasks.findOne({ _id: req.params.taskId, projectId: req.params.projectId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (membership.role !== 'admin' && task.createdBy !== req.user.id)
      return res.status(403).json({ error: 'Admin or creator only' });

    await db.tasks.remove({ _id: req.params.taskId });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
