const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://food-ordering-ojeo.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Ordering API' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uploads', require('./routes/uploads'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    routes: {
      auth: 'POST /api/auth/register, POST /api/auth/login, GET /api/auth/profile, GET /api/auth/users',
      menu: '/api/menu',
      orders: '/api/orders',
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

let connectionPromise = null;
let adminInitialized = false;

const initializeAdmin = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';

  const existingAdmin = await User.findOne({ username: adminUsername, role: 'admin' }).lean();
  if (existingAdmin) {
    return;
  }

  if (!adminPassword || adminPassword.length < 8) {
    console.error('Admin password must be at least 8 characters long');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  try {
    await User.create({
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
    });
    console.log(`Fixed admin account created - Username: ${adminUsername}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log('Admin account already exists');
      return;
    }
    throw error;
  }
};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (connectionPromise) {
    await connectionPromise;
  } else {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI).then(async () => {
      console.log('Connected to MongoDB');
      if (!adminInitialized) {
        await initializeAdmin();
        adminInitialized = true;
      }
    });
    await connectionPromise;
  }

  return mongoose.connection;
};

app.connectDB = connectDB;

module.exports = app;
