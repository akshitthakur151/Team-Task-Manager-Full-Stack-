const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = process.env.DB_PATH || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const { seedDatabase } = require('./seed');

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Failed to seed demo data:', err);
  }
})();

// Serve frontend in production
// Check both relative paths (for local dev and Railway deployment)
const frontendPaths = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, 'frontend/dist'),
];
const frontendBuild = frontendPaths.find(p => fs.existsSync(p));
if (frontendBuild) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuild, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => res.json({ message: 'TaskFlow API running. Frontend not built yet.' }));
}

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`TaskFlow API running on port ${PORT}`));
