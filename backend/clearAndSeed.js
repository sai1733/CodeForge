const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { hashPassword } = require('./src/utils/hashPassword');

// Import all models
const DailyReport = require('./src/models/DailyReport');
const File = require('./src/models/File');
const GitHubRepo = require('./src/models/GitHubRepo');
const Invite = require('./src/models/Invite');
const Notification = require('./src/models/Notification');
const PasswordReset = require('./src/models/PasswordReset');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');
const User = require('./src/models/User');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeforge';

const clearAndSeed = async () => {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Clear all collections
    console.log('Clearing all collections...');
    await Promise.all([
      DailyReport.deleteMany({}),
      File.deleteMany({}),
      GitHubRepo.deleteMany({}),
      Invite.deleteMany({}),
      Notification.deleteMany({}),
      PasswordReset.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('All collections cleared successfully.');

    // 2. Create the requested users
    const defaultPassword = await hashPassword('Test@123');
    const usersToCreate = [
      {
        name: 'Super Admin',
        email: 'admin@gmail.com',
        password: defaultPassword,
        role: 'superadmin',
        isActive: true
      },
      {
        name: 'Admin 1',
        email: 'admin1@gmail.com',
        password: defaultPassword,
        role: 'superadmin',
        isActive: true
      },
      // Interns 1 to 5
      { name: 'Intern 1', email: 'intern1@gmail.com', password: defaultPassword, role: 'intern', isActive: true },
      { name: 'Intern 2', email: 'intern2@gmail.com', password: defaultPassword, role: 'intern', isActive: true },
      { name: 'Intern 3', email: 'intern3@gmail.com', password: defaultPassword, role: 'intern', isActive: true },
      { name: 'Intern 4', email: 'intern4@gmail.com', password: defaultPassword, role: 'intern', isActive: true },
      { name: 'Intern 5', email: 'intern5@gmail.com', password: defaultPassword, role: 'intern', isActive: true },
      // Managers 1 to 3
      { name: 'Manager 1', email: 'manager1@gmail.com', password: defaultPassword, role: 'manager', isActive: true },
      { name: 'Manager 2', email: 'manager2@gmail.com', password: defaultPassword, role: 'manager', isActive: true },
      { name: 'Manager 3', email: 'manager3@gmail.com', password: defaultPassword, role: 'manager', isActive: true }
    ];

    console.log('Creating specified admin, intern, and manager accounts...');
    await User.create(usersToCreate);
    console.log('Specified accounts created successfully!');

    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
};

clearAndSeed();
