const letterService = require('../services/letter.service');

// 편지 작성
const createLetter = async (req, res) => {
  try {
      const { recipient_id, sender_name, content, wishlist_id } = req.body;
      // content 길이 검사
      if (content.length > 500) {
        return res.status(400).json({ message: 'Content exceeds 500 characters limit' });
      }
      await letterService.createLetter({ recipient_id, sender_name, content, wishlist_id });
      res.status(201).json({ message: 'Letter created successfully' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};


// 편지 목록 조회 (로그인 상태)
const getLettersForLoggedInUser = async (req, res) => {
  try {
      const recipientId = req.params.recipient_id;
      const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID
      const result = await letterService.getLettersForLoggedInUser(recipientId, userId);
      res.status(200).json(result);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};
// 편지 상세 조회
const getLetterDetails = async (req, res) => {
  try {
      const { recipient_id, letter_id } = req.params;
      const userId = req.user.id; // JWT에서 추출한 로그인 사용자 ID
      const result = await letterService.getLetterDetails(recipient_id, letter_id, userId);
      res.status(200).json(result);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// 편지 목록 조회 (로그인 X)
const getLettersForGuest = async (req, res) => {
  try {
      const { access_link } = req.query; // 접속 링크를 쿼리 파라미터로 받음
      const result = await letterService.getLettersForGuest(access_link);
      res.status(200).json(result);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
};