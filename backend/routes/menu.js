const express = require('express');
const router = express.Router();
const { auth, isStaff } = require('../middleware/auth');
const {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuByRestaurant,
} = require('../controllers/menuController');

// @route   GET /api/menu
// @desc    List all menu items (demo)
// @access  Public
router.get('/', listMenu);

// @route   GET /api/menu/:id
// @desc    Get single menu item (demo)
// @access  Public
router.get('/:id', getMenuItem);

// @route   POST /api/menu
// @desc    Add menu item
// @access  Private (Staff/Admin)
router.post('/', auth, isStaff, createMenuItem);

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Staff/Admin)
router.put('/:id', auth, isStaff, updateMenuItem);

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Staff/Admin)
router.delete('/:id', auth, isStaff, deleteMenuItem);

// @route   GET /api/menu/restaurant/:restaurantId
// @desc    Get menu items for a restaurant (demo filter)
// @access  Public
router.get('/restaurant/:restaurantId', getMenuByRestaurant);

module.exports = router;

