# 🚀 TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, real-time dashboards, and project collaboration.

## 🌐 Live Demo
> Deploy to Railway and paste your URL here

**Demo credentials:**
- Email: `demo@taskflow.com`
- Password: `demo123`

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Secure password hashing (bcrypt)
- Protected routes & persistent sessions

### Projects
- Create, edit, delete projects
- Track progress with visual progress bars
- Invite team members by email

### Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create/edit/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit any task | ✅ | ❌ |
| Edit own/assigned tasks | ✅ | ✅ |
| Delete any task | ✅ | ❌ |
| Delete own tasks | ✅ | ✅ |

### Task Management
- Create tasks with title, description, priority, status, assignee, due date
- Kanban board view (To Do / In Progress / Review / Done)
- List view with filtering
- Overdue detection with visual alerts

### Dashboard
- Personal task stats (total, completed, overdue)
- Status breakdown with progress bars
- Overdue tasks list
- Recent activity feed

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite, Axios |
| Backend | Node.js, Express 4 |
| Database | NeDB (embedded, file-based) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Styling | Pure CSS with CSS variables |

---

## 📦 Local Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/taskflow
cd taskflow

# Install & run backend
cd backend
npm install
node seed.js       # Creates demo user + sample data
node server.js     # Starts API on :3001

# In a second terminal — install & run frontend
cd frontend
npm install
npm run dev        # Starts dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🚂 Deploy to Railway

### One-click deploy:

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo
4. Add environment variables:
   ```
   JWT_SECRET=your-super-secret-key-change-this
   PORT=3001
   NODE_ENV=production
   ```
5. Railway auto-detects and runs:
   - Build: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - Start: `cd backend && node server.js`
6. Set a custom domain or use the Railway-provided URL

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | `taskflow-secret-key` | JWT signing secret (change in prod!) |
| `PORT` | ❌ | `3001` | Server port |
| `DB_PATH` | ❌ | `./data` | Database file directory |
| `NODE_ENV` | ❌ | — | Set to `production` |

---

## 📡 API Reference

### Auth
```
POST /api/auth/signup    { name, email, password }
POST /api/auth/login     { email, password }
GET  /api/auth/me        (Bearer token required)
```

### Projects
```
GET    /api/projects
POST   /api/projects          { name, description }
GET    /api/projects/:id
PUT    /api/projects/:id      { name, description }  [admin]
DELETE /api/projects/:id                             [admin]
POST   /api/projects/:id/members   { email, role }   [admin]
DELETE /api/projects/:id/members/:userId             [admin]
```

### Tasks
```
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks   { title, description, priority, status, assigneeId, dueDate }
PUT    /api/projects/:projectId/tasks/:taskId
DELETE /api/projects/:projectId/tasks/:taskId
```

### Dashboard
```
GET /api/dashboard   → stats, statusCounts, overdueTasks, recentTasks
```

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── models/
│   │   └── db.js            # NeDB datastores
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── projects.js      # Project CRUD + members
│   │   ├── tasks.js         # Task CRUD
│   │   └── dashboard.js     # Dashboard stats
│   ├── data/                # DB files (auto-created)
│   ├── seed.js              # Demo data seeder
│   └── server.js            # Express app entry
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx   # Sidebar layout
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   └── pages/
│   │       ├── AuthPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── ProjectsPage.jsx
│   │       └── ProjectDetailPage.jsx
│   └── dist/                # Built frontend (served by Express)
├── railway.toml
├── Procfile
└── README.md
```

---

## 🎬 Demo Video

> Record a 2–5 minute walkthrough covering:
> 1. Sign up as a new user
> 2. Create a project
> 3. Add a team member
> 4. Create tasks with different priorities and statuses
> 5. Show the Kanban board and list view
> 6. Show the dashboard with stats

---

## 📄 License
MIT
