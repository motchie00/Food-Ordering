const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { store, createId, findUserByUsername } = require('./storage/localStore');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'https://food-ordering-ojeo.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, can restrict later
    }
  },
  credentials: true
}));
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

// Initialize fixed admin account
const initializeAdmin = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    
    // Check if admin already exists
    const existingAdmin = findUserByUsername(adminUsername);
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Validate password length (minimum 8 characters)
    if (adminPassword.length < 8) {
      console.error('Admin password must be at least 8 characters long');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const timestamp = new Date().toISOString();
    const admin = {
      _id: createId(),
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.users.push(admin);
    console.log(`Fixed admin account created - Username: ${adminUsername}, Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error initializing admin account:', error);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Initialize admin and start server
initializeAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

