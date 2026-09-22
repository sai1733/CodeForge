const app = require('./app');
const env = require('./config/env');
const http = require('http');
const socketConfig = require('./config/socket');

const connectDB = async () => {
  try {
    const connect = require('./config/db');
    await connect();
    // Start scheduler after DB connects
    const { startNotificationScheduler } = require('./utils/scheduler');
    startNotificationScheduler();
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
  }
};

const startServer = () => {
  const PORT = env.PORT;
  const server = http.createServer(app);

  // Initialize Socket.IO
  socketConfig.init(server);
  
  // Start listening immediately
  server.listen(PORT, () => {
    console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  // Connect to DB in the background
  connectDB();
};

startServer();
