const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authenticate = require('../../auth/middleware/authenticate');
const router = express.Router();
const { upload } = require('../../auth/utils/upload');

// 선물 추가
router.post('/', authenticate, upload.single('image'), wishlistController.addWishlist);

// 선물 수정
router.patch('/:gift_id', authenticate, upload.single('image'), wishlistController.updateWishlist);

// 선물 삭제
router.delete('/:gift_id', wishlistController.deleteWishlist);

// 특정 선물 조회-생일자
router.get('/', authenticate, wishlistController.getWishlistByMember);

// 특정 선물 조회-선물 주는 사람
router.get('/:gift_id', wishlistController.getWishlistByGiver);

// 위시리스트 조회-생일자
router.get('/member/birthday', authenticate, wishlistController.getWishlistByBirthday);

// 위시리스트 조회-선물 주는 사람
router.get('/giver/bylink', wishlistController.getWishlistByLink);

module.exports = router;
