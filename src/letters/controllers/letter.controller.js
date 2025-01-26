const letterService = require('../services/letter.service');
const jwtUtil = require('../../auth/utils/jwt');
const { ERROR_MESSAGES } = require('../../common/errors/error.constants');

// 편지 작성
const createLetter = async (req, res) => {
  try {
    const { to, sender_name, content, recipient_id } = req.body;

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
      to,
      content,
      recipient_id,
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
    const { recipient_id } = req.params;

    const result = await letterService.getLettersForGuest(recipient_id);

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

const generateLetterLink = (req, res) => {
  try{
    const letterCopyUrl = letterService.createLetterLink();

    res.status(200).json({ letter_copy_url: letterCopyUrl });
    
  }catch (error) {
    console.error('Error in generateLetterLink:', error.message);
    res.status(500).json({
      status: 'error',
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      data: null,
    });
  }
}

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
  generateLetterLink
};
