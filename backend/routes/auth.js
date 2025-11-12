const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  getAllUsers,
  deleteUser,
  createStaffAccount,
  createCustomerAccount,
  getCustomers,
  getCustomer,
  updateCustomer,
} = require('../controllers/authController');

router.post('/register', register);

// Admin-managed account creation
router.post('/staff', auth, isAdmin, createStaffAccount);
router.post('/customers', auth, isAdmin, createCustomerAccount);

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

// Customer management
router.get('/customers', auth, isAdmin, getCustomers);
router.get('/customers/:id', auth, isAdmin, getCustomer);
router.put('/customers/:id', auth, isAdmin, updateCustomer);

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user (Admin only). Admin accounts cannot be deleted
// @access  Private (Admin)
router.delete('/users/:id', auth, isAdmin, deleteUser);
router.delete('/customers/:id', auth, isAdmin, deleteUser);

module.exports = router;

