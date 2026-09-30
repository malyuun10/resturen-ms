const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, tableController.getTables);
router.get('/:id', verifyToken, tableController.getTableById);
router.post('/', verifyToken, requireAdmin, tableController.createTable);
router.put('/:id', verifyToken, requireAdmin, tableController.updateTable);
router.patch('/:id/status', verifyToken, tableController.updateTableStatus);
router.delete('/:id', verifyToken, requireAdmin, tableController.deleteTable);

module.exports = router;
