const wishlistService = require('../services/wishlistService');
const response = require('../../auth/utils/response');
const pool = require('../../../config/database');

// 선물 추가
exports.addWishlist = async (req, res) => {
    const memberId = req.user.id; // JWT에서 인증된 사용자 ID
    const { title, image, price, link, description } = req.body;

    try {
       const wishlist = await wishlistService.addWishlist({ memberId, title, image, price, link, description });
       return response.success(res, 'Wishlist created successfully', wishlist);
    } catch (error) {
        console.error('Error adding wishlist:', error);
        return response.error(res, 'Failed to add wishlist', 500);
    }
};

// 선물 수정
exports.updateWishlist = async (req, res) => {
    const { gift_id } = req.params;
    const { link, description } = req.body;

    try {
        const updatedWishlist = await wishlistService.updateWishlist(gift_id, { link, description });
        if (!updatedWishlist) {
            return response.error(res, 'Wishlist not found', 404);
        }
        return response.success(res, 'Wishlist updated successfully', updatedWishlist);
    } catch (error) {
        console.error('Error updating wishlist:', error);
        return response.error(res, 'Failed to update wishlist', 500);
    }
};

// 선물 삭제
exports.deleteWishlist = async (req, res) => {
    const { gift_id } = req.params;

    try {
        const deleted = await wishlistService.deleteWishlist(gift_id);
        if (!deleted) {
            return response.error(res, 'Wishlist not found', 404);
        }
        return response.success(res, 'Wishlist deleted successfully');
    } catch (error) {
        console.error('Error deleting wishlist:', error);
        return response.error(res, 'Failed to delete wishlist', 500);
    }
};

// 특정 선물 조회
exports.getWishlistById = async (req, res) => {
    const { gift_id } = req.params;

    try {
        const giftDetails = await wishlistService.getGiftDetailsForWishlist(gift_id);

        // 성공적인 응답 반환
        return res.status(200).json({
            status: "success",
            message: "Gift details fetched successfully",
            data: [giftDetails],  // 데이터를 배열로 감싸서 반환
        });
    } catch (error) {
        // 오류 응답 처리
        return res.status(500).json({
            status: "error",
            message: "An error occurred while fetching gift details",
            data: null,
        });
    }
};

// 위시리스트 조회-생일자
exports.getWishlistByBirthday = async (req, res) => {
    try {
        const memberId = req.user.id;  // JWT에서 인증된 사용자 ID

        const wishlist = await wishlistService.getWishlistByBirthday(memberId,  req.query.before_birthday === 'true');

        res.status(200).json({
            status: 'success',
            message: 'Wishlist Fetched successfully',
            data: wishlist
        });
    } catch (error) {
        console.error("Error in getWishlistBeforeBirthday Controller:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            data: {}
        });
    }
};

// 위시리스트 조회-선물 주는 사람
exports.getWishlistByMemberId = async (req, res) => {
    try {
        const { member_id } = req.params; // URL 경로에서 member_id 추출

        if (!member_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Member ID is required',
                data: {}
            });
        }

        // 위시리스트 조회 서비스 호출
        const wishlist = await wishlistService.getWishlistForMember(member_id);

        if (!wishlist) {
            return res.status(404).json({
                status: 'error',
                message: 'Wishlist not found for the given Member ID',
                data: {}
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Wishlist Fetched successfully',
            data: wishlist
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            data: {}
        });
    }
};