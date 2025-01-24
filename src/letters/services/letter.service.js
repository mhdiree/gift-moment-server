const db = require('../../../config/database');
const jwtUtil = require('../../auth/utils/jwt');
const { ERROR_MESSAGES } = require('../../common/errors/error.constants');

// 편지 작성
const createLetter = async ({ to, sender_name, content, accessToken }) => {
  const connection = await db.getConnection();
  try {
    // 토큰 검증 및 발신자 ID 추출
    const decodedToken = jwtUtil.verifyToken(accessToken);
    const senderId = decodedToken.id;

    // 수신자 ID 확인
    const [recipientResult] = await connection.query(
      'SELECT id FROM members WHERE name = ?',
      [to]
    );

    if (recipientResult.length === 0) {
      throw new Error('Recipient not found');
    }

    const recipientId = recipientResult[0].id;

    // 편지 저장
    await connection.query(
      `INSERT INTO letters (recipient_id, sender_id, sender_name, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [recipientId, senderId, sender_name, content]
    );
  } catch (error) {
    console.error('Error in createLetter:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 편지 목록 조회 (로그인 상태)
const getLettersForLoggedInUser = async (userId) => {
  const connection = await db.getConnection();
  try {
    const [letters] = await connection.query(
      'SELECT id, sender_name, content, created_at FROM letters WHERE recipient_id = ?',
      [userId]
    );

    return {
      total_letters: letters.length,
      letters,
    };
  } catch (error) {
    console.error('Error in getLettersForLoggedInUser:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 편지 상세 조회
const getLetterDetails = async (recipientId, letterId) => {
  const connection = await db.getConnection();
  try {
    const [letter] = await connection.query(
      `SELECT id, sender_name, content, created_at 
       FROM letters 
       WHERE recipient_id = ? AND id = ?`,
      [recipientId, letterId]
    );

    if (!letter.length) {
      throw new Error('Letter not found');
    }

    return letter[0];
  } catch (error) {
    console.error('Error in getLetterDetails:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 손님용 편지 목록 조회
const getLettersForGuest = async (recipientId) => {
  const connection = await db.getConnection();
  try {
    const [userResult] = await connection.query(
      'SELECT name FROM memers WHERE id = ?',
      [recipientId]
    );

    if (!userResult.length) {
      throw new Error('Recipient not found');
    }

    const [letters] = await connection.query(
      'SELECT COUNT(*) AS total_letters FROM letters WHERE recipient_id = ?',
      [recipientId]
    );

    return {
      birthday_owner_name: userResult[0].name,
      total_letters: letters[0].total_letters,
    };
  } catch (error) {
    console.error('Error in getLettersForGuest:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createLetter,
  getLettersForLoggedInUser,
  getLetterDetails,
  getLettersForGuest,
};
