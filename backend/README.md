# CodeForge Backend API Server

This directory contains the Express.js application, Mongoose database models, authorization controllers, routing specifications, and security middlewares.

## Stack
- Node.js & Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password encryption

## Getting Started

1. Set up a `.env` file containing database connections and secrets:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_url
   JWT_SECRET=your_jwt_signature_secret
   NODE_ENV=development
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
