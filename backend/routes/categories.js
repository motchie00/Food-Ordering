const express = require('express');
const router = express.Router();
const { auth, isStaff } = require('../middleware/auth');
const { listCategories, createCategory, deleteCategory } = require('../controllers/categoriesController');

// @route   GET /api/categories
// @desc    List categories
// @access  Public
router.get('/', listCategories);

// @route   POST /api/categories
// @desc    Create category
// @access  Private (Staff/Admin)
router.post('/', auth, isStaff, createCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Staff/Admin)
router.delete('/:id', auth, isStaff, deleteCategory);

module.exports = router;


