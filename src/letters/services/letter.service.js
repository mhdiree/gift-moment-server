const db = require('../../../config/database');
const jwtUtil = require('../../auth/utils/jwt');
const { ERROR_MESSAGES } = require('../../common/errors/error.constants');
const crypto = require('crypto');

// 사용자 정보 조회 함수 (중복 제거)
const getUserInfo = async (recipientId) => {
  const connection = await db.getConnection();
  const [userResult] = await connection.query(
    'SELECT name, birth_date FROM members WHERE id = ?',
    [recipientId]
  );
  connection.release();
  if (!userResult.length) {
    throw new Error('Recipient not found');
  }
  return userResult[0];
};

// 편지 작성
const createLetter = async ({ sender_name, recipient_to, content, uniqueString }) => {
  const connection = await db.getConnection();
  try {
    // 수신자 `letter_link`를 기반으로 `recipient_id` 확인
    const [recipientResult] = await connection.query(
      'SELECT id FROM members WHERE letter_link = ?',
      [uniqueString]
    );
    if (recipientResult.length === 0) {
      throw new Error('Recipient not found');
    }

    const recipient_id = recipientResult[0].id;

    // 편지 저장
    await connection.query(
      `INSERT INTO letters (sender_name, recipient_to, content, recipient_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [sender_name, recipient_to, content, recipient_id]
    );
  } catch (error) {
    console.error('Error in createLetter:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 편지 목록 조회 (로그인 상태)
const getLettersForLoggedInUser = async (recipientId) => {
  const connection = await db.getConnection();
  try {
    // 사용자 이름과 생일 조회
    const { name, birth_date } = await getUserInfo(recipientId);

    // 현재 날짜와 비교하여 생일 전후 여부 결정
    const currentDate = new Date();
    const birthDate = new Date(birth_date); // 생일 날짜를 Date 객체로 변환

    // 생일이 아직 지나지 않았으면 true, 지나면 false
    const beforeBirthday = currentDate.getMonth() < birthDate.getMonth() ||
                           (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate());

    const [letters] = await connection.query(
      'SELECT * FROM letters WHERE recipient_id = ?',
      [recipientId]
    );

    return {
      username: name,
      before_birthday: beforeBirthday,
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
      `SELECT id, recipient_to, sender_name, content, created_at 
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

// 편지 목록 조회 (로그인 X)
const getLettersForGuest = async (uniqueString) => {
  const connection = await db.getConnection();
  try {
    // 수신자 `letter_link`를 기반으로 `recipient_id` 확인
    const [recipientResult] = await connection.query(
      'SELECT id FROM members WHERE letter_link = ?',
      [uniqueString]
    );
    if (recipientResult.length === 0) {
      throw new Error('Recipient not found');
    }
    const recipientId = recipientResult[0].id; // id를 추출
    // 사용자 이름과 생일 조회
    const { name, birth_date } = await getUserInfo(recipientId);
    
    // 현재 날짜와 비교하여 생일 전후 여부 결정
    const currentDate = new Date();
    const birthDate = new Date(birth_date); // 생일 날짜를 Date 객체로 변환

    // 생일이 아직 지나지 않았으면 true, 지나면 false
    const beforeBirthday = currentDate.getMonth() < birthDate.getMonth() ||
                           (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate());

    const [letters] = await connection.query(
      'SELECT COUNT(*) AS total_letters FROM letters WHERE recipient_id = ?',
      [recipientId]
    );

    return {
      birthday_owner_name: name,
      before_birthday: beforeBirthday,
      total_letters: letters[0].total_letters,
    };
  } catch (error) {
    console.error('Error in getLettersForGuest:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 랜덤 문자열 생성 함수 (8자리)
const generateRandomString = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');  // 16진수 문자열 생성
};

// 고유 링크 생성 및 DB 업데이트 함수
const createLetterLink = async (userId) => {
  const connection = await db.getConnection();
  try {
    // 사용자 확인
    const [userResult] = await connection.query(
      'SELECT id FROM members WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    // 고유 랜덤 문자열 생성
    const uniqueString = generateRandomString(8); // 8자리 랜덤 문자열 생성

    // 고유 링크 생성
    const letterLink = `/gm-letter/${uniqueString}`;

    // 링크를 DB에 업데이트
    await connection.query(
      'UPDATE members SET letter_link = ? WHERE id = ?',
      [uniqueString, userId]
    );

    return letterLink;
  } catch (error) {
    console.error('Error in createLetterLink:', error.message);
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
  createLetterLink
};