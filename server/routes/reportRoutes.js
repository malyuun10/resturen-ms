const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/dashboard-summary', reportController.getDashboardSummary);
router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/cashier', reportController.getCashierReport);
router.get('/products', reportController.getProductReport);
router.get('/inventory', reportController.getInventoryReport);

module.exports = router;
