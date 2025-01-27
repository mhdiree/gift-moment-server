const express = require('express');
const letterController = require('../controllers/letter.controller');
const authMiddleware = require('../../auth/middleware/authenticate');
const router = express.Router();

// 편지 작성 (로그인 없이 고유 링크 사용)
router.post('/letters/create/:uniqueString', letterController.createLetter);

// 편지 목록 조회 (로그인 상태)
router.get('/letters', authMiddleware, letterController.getLettersForLoggedInUser);

// 편지 링크 복사하기
router.get('/letters/copy', letterController.generateLetterLink);

// 편지 상세 조회 (로그인 상태)
router.get('/letters/:letter_id', authMiddleware, letterController.getLetterDetails);

// 편지 목록 조회 (로그인 X)
router.get('/letters/guestview/:uniqueString', letterController.getLettersForGuest);

module.exports = router;