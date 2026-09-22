const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const File = require('../models/File');
const DailyReport = require('../models/DailyReport');
const GitHubRepo = require('../models/GitHubRepo');
const Invite = require('../models/Invite');
const Notification = require('../models/Notification');
const PasswordReset = require('../models/PasswordReset');
const { hashPassword } = require('./hashPassword');

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to database...');
    await connectDB();

    // 2. Wipe existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await File.deleteMany({});
    await DailyReport.deleteMany({});
    await GitHubRepo.deleteMany({});
    await Invite.deleteMany({});
    await Notification.deleteMany({});
    await PasswordReset.deleteMany({});
    console.log('Database cleared.');

    // 3. Create users
    console.log('Seeding user accounts...');
    const hashedPassword = await hashPassword('Test@123');

    // Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
    });
    console.log(`[CREATE] Super Admin seeded: ${superAdmin.email}`);

    // Admin 1
    const admin1 = await User.create({
      name: 'Admin 1',
      email: 'admin1@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
    });
    console.log(`[CREATE] Admin 1 seeded: ${admin1.email}`);

    // Managers 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      const manager = await User.create({
        name: `Manager ${i}`,
        email: `manager${i}@gmail.com`,
        password: hashedPassword,
        role: 'manager',
      });
      console.log(`[CREATE] Manager ${i} seeded: ${manager.email}`);
    }

    // Interns 1 to 5
    for (let i = 1; i <= 5; i++) {
      const intern = await User.create({
        name: `Intern ${i}`,
        email: `intern${i}@gmail.com`,
        password: hashedPassword,
        role: 'intern',
      });
      console.log(`[CREATE] Intern ${i} seeded: ${intern.email}`);
    }

    console.log('Database seeding process completed successfully!');
  } catch (error) {
    console.error('Seeding process encountered an error:', error);
  } finally {
    // Disconnect and exit cleanly
    try {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
    process.exit(0);
  }
};

// Execute seeding script
seedDatabase();
