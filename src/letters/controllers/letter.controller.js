const letterService = require('../services/letter.service');
const jwtUtil = require('../../auth/utils/jwt');
const { ERROR_MESSAGES } = require('../../common/errors/error.constants');

// 편지 작성
const createLetter = async (req, res) => {
  try {
    const { recipient_to, sender_name, content } = req.body;
    const { uniqueString } = req.params;  // URL에서 uniqueString을 받음

    // content 길이 검사
    if (!content || content.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'Content must be between 1 and 500 characters',
        data: null,
      });
    }

    // 서비스 계층에 편지 작성 요청
    await letterService.createLetter({
      sender_name,
      recipient_to,
      content,
      uniqueString,
    });

    res.status(201).json({
      status: 'success',
      message: 'Letter created successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error:', error.message);
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
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Access token is required',
        data: null,
      });
    }

    const decodedToken = jwtUtil.verifyToken(accessToken);

    const result = await letterService.getLettersForLoggedInUser(decodedToken.id);

    res.status(200).json({
      status: 'success',
      message: 'Letters retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error:', error.message);
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
    const { letter_id } = req.params;
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Access token is required',
        data: null,
      });
    }

    const decodedToken = jwtUtil.verifyToken(accessToken);

    const result = await letterService.getLetterDetails(decodedToken.id, letter_id);

    res.status(200).json({
      status: 'success',
      message: 'Letter details retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error:', error.message);
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
    const { uniqueString } = req.params;

    const result = await letterService.getLettersForGuest(uniqueString);

    res.status(200).json({
      status: 'success',
      message: 'Guest letters retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
};

const generateLetterLink = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Access token is required',
        data: null,
      });
    }

    // 토큰에서 사용자 ID 추출
    const decodedToken = jwtUtil.verifyToken(accessToken);

    // 링크 생성 요청
    const letterLink = await letterService.createLetterLink(decodedToken.id);

    res.status(200).json({
      status: 'success',
      message: 'Letter link created successfully',
      data: { letter_link: letterLink },
    });
  } catch (error) {
    console.error('Error in generateLetterLink:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate letter link',
      data: null,
    });
  }
};

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
  generateLetterLink
};
