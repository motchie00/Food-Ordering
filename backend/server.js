const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Ordering API' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uploads', require('./routes/uploads'));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test endpoint to check API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    routes: {
      auth: 'POST /api/auth/register, POST /api/auth/login, GET /api/auth/profile, GET /api/auth/users',
      menu: '/api/menu',
      orders: '/api/orders'
    }
  });
});

// Connect to MongoDB (optional for development without DB)
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.log('Note: Server will continue without database connection');
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

