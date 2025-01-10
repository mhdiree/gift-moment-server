const express = require('express');
const mypageController = require('../controllers/mypageController');
const authenticate = require('../../auth/middleware/authenticate'); 
const router = express.Router();

// 사용자 정보 조회
router.get('/', authenticate, mypageController.getUserInfo);

// 사용자 정보 수정
router.patch('/', authenticate, mypageController.updateUserInfo);

// 회원 탈퇴
router.delete('/delete', authenticate, mypageController.deleteUser);

module.exports = router;
