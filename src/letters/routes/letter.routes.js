const express = require('express');
const letterController = require('../controllers/letter.controller');

const router = express.Router();

// 편지 작성
router.post('/letters', letterController.createLetter);

// 편지 목록 조회
router.get('/letters/:recipient_id', letterController.getLetters);

module.exports = router;