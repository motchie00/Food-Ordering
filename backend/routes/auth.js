const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  getAllUsers,
  deleteUser,
} = require('../controllers/authController');

router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Logout user (stateless JWT; client should discard token)
// @access  Public (token invalidation not stored server-side)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', auth, isAdmin, getAllUsers);

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user (Admin only). Admin accounts cannot be deleted
// @access  Private (Admin)
router.delete('/users/:id', auth, isAdmin, deleteUser);

module.exports = router;

