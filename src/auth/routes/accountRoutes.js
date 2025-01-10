const express = require('express');
const accountController = require('../controllers/accountController');
const authenticate = require('../middleware/authenticate'); // JWT 인증 미들웨어
const router = express.Router();

// 사용자 계좌 등록 라우트
router.post('/account', authenticate, accountController.addAccount);

module.exports = router;
