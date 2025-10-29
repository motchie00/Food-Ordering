const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  getAllUsers,
} = require('../controllers/authController');

router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', auth, getAllUsers);

module.exports = router;

