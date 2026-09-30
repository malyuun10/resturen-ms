const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/', inventoryController.getInventory);
router.post('/adjust', inventoryController.adjustStock);
router.get('/history', inventoryController.getInventoryHistory);
router.get('/low-stock', inventoryController.getLowStockAlerts);

module.exports = router;
