const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    console.warn('Backend server will continue running. Please make sure MongoDB is started or configure MONGODB_URI in .env');
  }
};

module.exports = connectDB;
