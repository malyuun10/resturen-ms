const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', paymentController.processPayment);
router.get('/', paymentController.getPayments);
router.get('/receipt/:orderNumber', paymentController.getReceipt);

module.exports = router;
