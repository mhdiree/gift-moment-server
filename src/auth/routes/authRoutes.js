const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // JWT 인증 미들웨어

// 카카오 로그인 엔드포인트
router.post('/auth/kakao', authController.kakaoLogin);

// 사용자 프로필 조회
router.get('/profile', authenticate, authController.getUserProfile);

// 사용자 프로필 업데이트
router.post('/profile', authenticate, authController.updateUserProfile);

module.exports = router;
