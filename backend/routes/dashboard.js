const router = require('express').Router();
const db = require('../models/db');
const { auth } = require('../middleware/auth');

// GET /api/dashboard - summary for current user
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await db.members.find({ userId: req.user.id });
    const projectIds = memberships.map(m => m.projectId);

    const allTasks = await db.tasks.find({ projectId: { $in: projectIds } });
    const myTasks = allTasks.filter(t => t.assigneeId === req.user.id);

    const now = new Date().toISOString();
    const overdue = myTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done');

    const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
    myTasks.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

    const priorityCounts = { low: 0, medium: 0, high: 0 };
    myTasks.filter(t => t.status !== 'done').forEach(t => {
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });

    // Recent activity: last 5 updated tasks
    const recentTasks = [...allTasks]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);

    const projectNames = await db.projects.find({ _id: { $in: projectIds } });
    const projectMap = Object.fromEntries(projectNames.map(p => [p._id, p.name]));

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks: myTasks.length,
        overdueTasks: overdue.length,
        completedTasks: statusCounts.done,
      },
      statusCounts,
      priorityCounts,
      overdueTasks: overdue.slice(0, 5).map(t => ({ ...t, projectName: projectMap[t.projectId] })),
      recentTasks: recentTasks.map(t => ({ ...t, projectName: projectMap[t.projectId] })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
