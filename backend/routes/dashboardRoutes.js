const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLowStockProducts
} = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateToken);

router.get('/', getDashboardStats);
router.get('/low-stock', getLowStockProducts);

module.exports = router;
