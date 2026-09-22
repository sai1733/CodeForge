const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRouter = require('./routes/index');
const errorMiddleware = require('./middleware/errorMiddleware');

const path = require('path');

const app = express();

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers for WebContainers multithreading
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// API Router
app.use('/api', apiRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CodeForge Backend API is running smoothly',
    timestamp: new Date(),
    env: env.NODE_ENV,
  });
});

// Centralized error handling
app.use(errorMiddleware);

module.exports = app;
