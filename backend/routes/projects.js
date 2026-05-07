const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { auth } = require('../middleware/auth');

// Helper: check if user is member of project
async function getMembership(projectId, userId) {
  return db.members.findOne({ projectId, userId });
}

// GET /api/projects - list projects for user
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await db.members.find({ userId: req.user.id });
    const projectIds = memberships.map(m => m.projectId);
    const projects = await db.projects.find({ _id: { $in: projectIds } });

    // Enrich with role and member count
    const enriched = await Promise.all(projects.map(async p => {
      const myRole = memberships.find(m => m.projectId === p._id)?.role;
      const memberCount = await db.members.count({ projectId: p._id });
      const taskCount = await db.tasks.count({ projectId: p._id });
      const completedCount = await db.tasks.count({ projectId: p._id, status: 'done' });
      return { ...p, myRole, memberCount, taskCount, completedCount };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - create project (any user)
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description } = req.body;
    const project = await db.projects.insert({
      name, description: description || '',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Creator becomes admin
    await db.members.insert({ projectId: project._id, userId: req.user.id, role: 'admin', joinedAt: new Date().toISOString() });
    res.status(201).json({ ...project, myRole: 'admin' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const membership = await getMembership(req.params.id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = await db.members.find({ projectId: req.params.id });
    const userIds = members.map(m => m.userId);
    const users = await db.users.find({ _id: { $in: userIds } });
    const membersEnriched = members.map(m => {
      const u = users.find(u => u._id === m.userId);
      return { ...m, user: u ? { id: u._id, name: u.name, email: u.email } : null };
    });

    res.json({ ...project, myRole: membership.role, members: membersEnriched });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id - admin only
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const membership = await getMembership(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    updates.updatedAt = new Date().toISOString();

    await db.projects.update({ _id: req.params.id }, { $set: updates });
    const project = await db.projects.findOne({ _id: req.params.id });
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id - admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const membership = await getMembership(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await db.projects.remove({ _id: req.params.id });
    await db.members.remove({ projectId: req.params.id }, { multi: true });
    await db.tasks.remove({ projectId: req.params.id }, { multi: true });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members - add member (admin only)
router.post('/:id/members', auth, [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const membership = await getMembership(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const user = await db.users.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await getMembership(req.params.id, user._id);
    if (existing) return res.status(409).json({ error: 'User already a member' });

    await db.members.insert({ projectId: req.params.id, userId: user._id, role: req.body.role, joinedAt: new Date().toISOString() });
    res.status(201).json({ message: 'Member added', user: { id: user._id, name: user.name, email: user.email }, role: req.body.role });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const membership = await getMembership(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

    await db.members.remove({ projectId: req.params.id, userId: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
