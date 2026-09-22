const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const { hashPassword } = require('./src/utils/hashPassword');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeforge';

const seedUsers = async () => {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const defaultPassword = await hashPassword('password123');

    const usersToCreate = [
      // Interns
      { name: 'John Doe', email: 'john.doe@codeforge.com', password: defaultPassword, role: 'intern' },
      { name: 'Emma Watson', email: 'emma.watson@codeforge.com', password: defaultPassword, role: 'intern' },
      { name: 'Liam Neeson', email: 'liam.neeson@codeforge.com', password: defaultPassword, role: 'intern' },
      { name: 'Sophia Loren', email: 'sophia.loren@codeforge.com', password: defaultPassword, role: 'intern' },
      { name: 'David Beckham', email: 'david.beckham@codeforge.com', password: defaultPassword, role: 'intern' },
      
      // Managers
      { name: 'Robert Downey', email: 'robert.downey@codeforge.com', password: defaultPassword, role: 'manager' },
      { name: 'Angelina Jolie', email: 'angelina.jolie@codeforge.com', password: defaultPassword, role: 'manager' },
      { name: 'Tom Hanks', email: 'tom.hanks@codeforge.com', password: defaultPassword, role: 'manager' },
      { name: 'Meryl Streep', email: 'meryl.streep@codeforge.com', password: defaultPassword, role: 'manager' },

      // Admins (superadmin)
      { name: 'Developer Admin', email: 'devadmin@codeforge.com', password: defaultPassword, role: 'superadmin' },
      { name: 'Security Admin', email: 'secadmin@codeforge.com', password: defaultPassword, role: 'superadmin' },
      { name: 'System Admin', email: 'sysadmin@codeforge.com', password: defaultPassword, role: 'superadmin' },
    ];

    console.log(`Clearing existing test/mock accounts if any...`);
    // Delete existing ones to prevent duplicates (only deleting users we are seeding to avoid wiping user's custom accounts)
    const emails = usersToCreate.map(u => u.email);
    await User.deleteMany({ email: { $in: emails } });

    console.log(`Seeding ${usersToCreate.length} mock accounts...`);
    const created = await User.create(usersToCreate);
    console.log(`Successfully created ${created.length} users!`);

    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
