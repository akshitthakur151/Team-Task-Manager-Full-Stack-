#!/usr/bin/env node
// Creates demo user: demo@taskflow.com / demo123
const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'data');
const bcrypt = require('bcryptjs');
const db = require('./models/db');

async function seedDatabase() {
  try {
    const existing = await db.users.findOne({ email: 'demo@taskflow.com' });
    if (existing) {
      console.log('Demo user already exists');
      return;
    }

    const hash = await bcrypt.hash('demo123', 10);
    const user = await db.users.insert({
      name: 'Demo User', email: 'demo@taskflow.com',
      password: hash, createdAt: new Date().toISOString()
    });

    const project = await db.projects.insert({
      name: 'Website Redesign', description: 'Redesign company website with modern UI',
      createdBy: user._id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    await db.members.insert({ projectId: project._id, userId: user._id, role: 'admin', joinedAt: new Date().toISOString() });

    const tasks = [
      { title:'Design new homepage mockup', description:'Create Figma mockups for the new homepage', priority:'high', status:'in_progress', assigneeId: user._id, dueDate: new Date(Date.now() + 7*86400000).toISOString() },
      { title:'Set up CI/CD pipeline', priority:'medium', status:'todo', assigneeId: user._id, description:'' },
      { title:'Write API documentation', priority:'low', status:'review', assigneeId: user._id, description:'' },
      { title:'Fix login page bugs', priority:'high', status:'done', assigneeId: user._id, description:'Resolved auth token issues', dueDate: new Date(Date.now() - 2*86400000).toISOString() },
    ];

    for (const t of tasks) {
      await db.tasks.insert({ ...t, projectId: project._id, createdBy: user._id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    console.log('Seed complete! Login: demo@taskflow.com / demo123');
  } catch (err) {
    if (err.errorType === 'uniqueViolated') {
      console.log('Demo data already seeded');
      return;
    }
    console.error('Seed error:', err);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
