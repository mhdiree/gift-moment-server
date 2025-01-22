const letterService = require('../services/letter.service');
const ApiResponse = require('../../common/response/api.response');
const { ERROR_CODES, ERROR_MESSAGES } = require('../../common/errors/error.constants');

// 편지 작성
const createLetter = async (req, res) => {
  try {
    const { recipient_id, sender_name, content, wishlist_id } = req.body;

    // content 길이 검사
    if (content.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: ERROR_MESSAGES.COMMON.INVALID_REQUEST,
        data: null,
      });
    }

    await letterService.createLetter({ recipient_id, sender_name, content, wishlist_id });

    res.status(201).json({
      status: 'success',
      message: 'Letter created successfully',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
};

// 편지 목록 조회 (로그인 상태)
const getLettersForLoggedInUser = async (req, res) => {
  try {
    const recipientId = req.params.recipient_id;
    const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID

    const result = await letterService.getLettersForLoggedInUser(recipientId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Letters retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
};

// 편지 상세 조회
const getLetterDetails = async (req, res) => {
  try {
    const { recipient_id, letter_id } = req.params;
    const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID

    const result = await letterService.getLetterDetails(recipient_id, letter_id, userId);

    res.status(200).json({
      status: 'success',
      message: 'Letter details retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
};

// 편지 목록 조회 (로그인 X)
const getLettersForGuest = async (req, res) => {
  try {
    const { recipient_id } = req.params;

    const result = await letterService.getLettersForGuest(recipient_id);

    res.status(200).json({
      status: 'success',
      message: 'Guest letters retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
};

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
};
