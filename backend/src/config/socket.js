const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {object} server - HTTP server instance
 */
const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc.) or matching domains
        if (!origin || origin === env.CLIENT_URL || origin === 'http://localhost:5173' || origin === 'http://localhost:3000') {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for easy deployment
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token is required.'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[SOCKET CONNECT] ID: ${socket.id} joined room: ${userId}`);
    
    // Join a private room for this user ID
    socket.join(userId.toString());

    socket.on('disconnect', () => {
      console.log(`[SOCKET DISCONNECT] ID: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit event to a specific user room
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} data - Event payload
 */
const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(userId.toString()).emit(event, data);
    console.log(`[SOCKET EMIT] To user room: ${userId} -> Event: ${event}`);
  }
};

module.exports = {
  init,
  emitToUser,
};
