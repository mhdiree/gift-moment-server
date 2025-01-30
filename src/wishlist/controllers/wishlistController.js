const wishlistService = require('../services/wishlistService');
const response = require('../../auth/utils/response');
const { uploadToS3 } = require('../../auth/utils/upload');

// 선물 추가
exports.addWishlist = async (req, res) => {
    const memberId = req.user.id; // JWT에서 인증된 사용자 ID
    const { title, price, link, description } = req.body;
    const image = req.file ? await uploadToS3(req.file) : null; // S3에 업로드 후 URL 받기

    try {
        const wishlist = await wishlistService.addWishlist({ memberId, title, image, price, link, description });
        return response.success(res, 'Wishlist created successfully', wishlist);
    } catch (error) {
        console.error('Error adding wishlist:', error);
        if (error.message === 'A member can have a maximum of 5 gifts') {
            return response.error(res, error.message, 400); // 선물 수 초과 시 400 에러 반환
        }
        return response.error(res, 'Failed to add wishlist', 500);
    }
};

// 선물 수정
exports.updateWishlist = async (req, res) => {
    const { gift_id } = req.params;
    const { link, description } = req.body;
    const image = req.file ? await uploadToS3(req.file) : null; // S3에 업로드 후 URL 받기

    try {
        const updatedWishlist = await wishlistService.updateWishlist(gift_id, { link, description, image });
        if (!updatedWishlist) {
            return response.error(res, 'Wishlist not found or no changes made', 404);
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
        // 선물이 존재하는지 확인
        const wishlist = await wishlistService.getWishlistById(gift_id);
        if (!wishlist) {
            return response.error(res, 'Wishlist not found', 404);
        }

        // 선물 삭제
        const deleted = await wishlistService.deleteWishlist(gift_id);
        if (!deleted) {
            return response.error(res, 'Failed to delete wishlist', 500);
        }

        // 삭제 성공 응답
        return response.success(res, 'Wishlist deleted successfully');
    } catch (error) {
        console.error('Error deleting wishlist:', error);
        return response.error(res, 'Failed to delete wishlist', 500);
    }
};

// 특정 선물 조회-생일자
exports.getWishlistByMember = async (req, res) => {
    const { gift_id } = req.query;  // 쿼리 파라미터에서 gift_id 가져오기
    const memberId = req.user.id;  // JWT로 얻은 member_id

    if (!gift_id) {
        return res.status(400).json({
            status: "error",
            message: "Gift ID is required",
            data: null,
        });
    }

    try {
        const giftDetails = await wishlistService.getGiftDetailsForWishlistByMember(gift_id, memberId);

        return res.status(200).json({
            status: "success",
            message: "Gift details fetched successfully",
            data: [giftDetails],
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred while fetching gift details",
            data: null,
        });
    }
};

// 특정 선물 조회-선물 주는 사람
exports.getWishlistByGiver = async (req, res) => {
    const { gift_id } = req.params;

    try {
        const giftDetails = await wishlistService.getGiftDetailsForWishlistByGiver(gift_id);

        return res.status(200).json({
            status: "success",
            message: "Gift details fetched successfully",
            data: [giftDetails],
        });
    } catch (error) {
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
exports.getWishlistByLink = async (req, res) => {
    try {
        const { letter_link } = req.query; // URL 쿼리에서 letter_link 추출

        if (!letter_link) {
            return res.status(400).json({
                status: 'error',
                message: 'Letter link is required',
                data: {}
            });
        }
        
        // letter_link 값 확인을 위한 로그 추가
        console.log('Query executed with letter_link:', letter_link);

        // 위시리스트 조회 서비스 호출
        const wishlist = await wishlistService.getWishlistByLink(letter_link);

        if (!wishlist) {
            return res.status(404).json({
                status: 'error',
                message: 'Wishlist not found for the given letter link',
                data: {}
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Wishlist fetched successfully',
            data: wishlist
        });
    } catch (error) {
        console.error('Error fetching wishlist by letter link:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            data: {}
        });
    }
};

// 특정 선물 조회-선물 주는 사람 (로그인한 사용자 ID 포함)
exports.getWishlistByGiverWithToken = async (req, res) => {
    const { gift_id } = req.params;
    const memberId = req.user.id;  // JWT에서 인증된 사용자 ID

    try {
        // 선물 정보 및 결제 정보 가져오기
        const giftDetails = await wishlistService.getGiftDetailsForWishlistByGiverWithToken(gift_id, memberId);

        return res.status(200).json({
            status: "success",
            message: "Gift details fetched successfully",
            data: giftDetails,
        });
    } catch (error) {
        console.error("Error fetching gift details:", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred while fetching gift details",
            data: null,
        });
    }
};
