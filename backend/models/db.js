const Datastore = require('nedb-promises');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data');

const db = {
  users: Datastore.create({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  projects: Datastore.create({ filename: path.join(dbPath, 'projects.db'), autoload: true }),
  tasks: Datastore.create({ filename: path.join(dbPath, 'tasks.db'), autoload: true }),
  members: Datastore.create({ filename: path.join(dbPath, 'members.db'), autoload: true }),
};

// Create indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.members.ensureIndex({ fieldName: 'projectId' });
db.tasks.ensureIndex({ fieldName: 'projectId' });

module.exports = db;
