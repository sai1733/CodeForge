const mongoose = require('mongoose');
const connectDB = require('../config/db');

const dropIndexes = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    const collection = mongoose.connection.collection('githubrepos');
    console.log('Fetching indexes for githubrepos collection...');
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes);

    // Drop old userId index
    const hasUserIdIndex = indexes.some(idx => idx.name === 'userId_1');
    if (hasUserIdIndex) {
      console.log('Dropping index userId_1...');
      await collection.dropIndex('userId_1');
      console.log('Index userId_1 dropped successfully.');
    } else {
      console.log('Index userId_1 not found.');
    }
  } catch (err) {
    console.error('Error dropping index:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

dropIndexes();
