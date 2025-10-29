const express = require('express');
const router = express.Router();
const { auth, isStaff } = require('../middleware/auth');
const { getSalesReport } = require('../controllers/reportsController');

// @route   GET /api/reports/sales
// @desc    Basic sales report (demo data)
// @access  Private (Staff/Admin)
router.get('/sales', auth, isStaff, getSalesReport);

module.exports = router;


