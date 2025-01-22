const express = require('express');
const letterController = require('../controllers/letter.controller');
const authMiddleware = require('../../auth/middleware/authenticate');
const router = express.Router();

// 편지 작성
router.post('/letters', letterController.createLetter);

// 편지 목록 조회 (로그인 상태)
router.get('/letters:token', authMiddleware, letterController.getLettersForLoggedInUser);

// 편지 상세 조회 (로그인 상태)
router.get('/letters/:letter_id', authMiddleware, letterController.getLetterDetails);

// 편지 목록 조회 (로그인 X)
router.get('/letters/:recipient_id/summary', letterController.getLettersForGuest);

module.exports = router;