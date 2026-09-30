const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.post('/create', backupController.createBackup);
router.get('/list', backupController.listBackups);
router.post('/restore', backupController.restoreBackup);
router.get('/download/:filename', backupController.downloadBackup);
router.delete('/:filename', backupController.deleteBackup);

module.exports = router;
