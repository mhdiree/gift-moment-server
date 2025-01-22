const letterService = require('../services/letter.service');
const ApiResponse = require('../../common/response/api.response');
const { ERROR_CODES, ERROR_MESSAGES } = require('../../common/errors/error.constants');

// 편지 작성
const createLetter = async (req, res) => {
  try {
      const { recipient_id, sender_name, content, wishlist_id } = req.body;
      // content 길이 검사
      if (content.length > 500) {
        return res
                .status(ERROR_CODES.BAD_REQUEST)
                .json(ApiResponse.error(ERROR_MESSAGES.COMMON.INVALID_REQUEST));
      }
      await letterService.createLetter({ recipient_id, sender_name, content, wishlist_id });
      res.status(201).json(ApiResponse.success('Letter created successfully'));
  } catch (error) {
    res
      .status(ERROR_CODES.INTERNAL_SERVER)
      .json(ApiResponse.error(ERROR_MESSAGES.COMMON.SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER));
  }
};


// 편지 목록 조회 (로그인 상태)
const getLettersForLoggedInUser = async (req, res) => {
  try {
      const recipientId = req.params.recipient_id;
      const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID
      const result = await letterService.getLettersForLoggedInUser(recipientId, userId);
      res.status(200).json(ApiResponse.success('Letters retrieved successfully', result));
  } catch (error) {
    res
      .status(ERROR_CODES.INTERNAL_SERVER)
      .json(ApiResponse.error(ERROR_MESSAGES.COMMON.SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER));
  }
};
// 편지 상세 조회
const getLetterDetails = async (req, res) => {
  try {
      const { recipient_id, letter_id } = req.params;
      const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID
      const result = await letterService.getLetterDetails(recipient_id, letter_id, userId);
      rres.status(200).json(ApiResponse.success('Letter details retrieved successfully', result));
  } catch (error) {
    res
    .status(ERROR_CODES.INTERNAL_SERVER)
    .json(ApiResponse.error(ERROR_MESSAGES.COMMON.SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER));
  }
};

// 편지 목록 조회 (로그인 X)
const getLettersForGuest = async (req, res) => {
  try {
      const { recipient_id  } = req.params;
      const result = await letterService.getLettersForGuest(recipient_id);
      res.status(200).json(ApiResponse.success('Guest letters retrieved successfully', result));
  } catch (error) {
    res
    .status(ERROR_CODES.INTERNAL_SERVER)
    .json(ApiResponse.error(ERROR_MESSAGES.COMMON.SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER));
  }
};

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
};