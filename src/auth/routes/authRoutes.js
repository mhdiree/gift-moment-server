const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // JWT 인증 미들웨어

// 카카오 로그인 엔드포인트
router.post('/auth/kakao', authController.kakaoLogin);

// 사용자 프로필 조회
router.get('/auth/profile', authenticate, authController.getUserProfile);

// 사용자 프로필 업데이트
router.patch('/auth/profile', authenticate, authController.updateUserProfile);

// 회원 이름 및 생일 정보 반환
router.get('/auth/navigate', authenticate, authController.getUserNameAndBirthday);

// 로그아웃 엔드포인트
router.post('/auth/logout', authenticate, authController.logout);

module.exports = router;