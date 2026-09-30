const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', settingsController.getSettings);
router.put('/', verifyToken, requireAdmin, settingsController.updateSettings);

module.exports = router;
