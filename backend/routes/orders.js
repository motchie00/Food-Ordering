const express = require('express');
const router = express.Router();
const { auth, isStaff } = require('../middleware/auth');
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/ordersController');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer)
router.post('/', auth, createOrder);

// @route   GET /api/orders
// @desc    Get orders (customers see only their own; staff/admin see all)
// @access  Private
router.get('/', auth, listOrders);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, getOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Staff/Admin)
router.put('/:id/status', auth, isStaff, updateOrderStatus);

module.exports = router;

