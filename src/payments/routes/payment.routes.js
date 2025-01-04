const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const paymentController = new PaymentController();

router.post('/payments/kakao-pay', paymentController.ready);
router.post('/payments/kakao-pay/approve', paymentController.approve);
router.get('/payments/kakao-pay/cancel', paymentController.cancel);
router.get('/payments/kakao-pay/fail', paymentController.fail);

module.exports = router;