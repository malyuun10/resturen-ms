const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, menuController.getMenuItems);
router.get('/:id', verifyToken, menuController.getMenuItemById);
router.post('/', verifyToken, requireAdmin, menuController.createMenuItem);
router.put('/:id', verifyToken, requireAdmin, menuController.updateMenuItem);
router.patch('/:id/toggle-availability', verifyToken, requireAdmin, menuController.toggleAvailability);
router.delete('/:id', verifyToken, requireAdmin, menuController.deleteMenuItem);

module.exports = router;
