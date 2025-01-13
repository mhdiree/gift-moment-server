const db = require('../../../config/database');

//편지 작성
const createLetter = async ({ recipient_id, sender_name, content, wishlist_id }) => {
    const connection = await db.getConnection();
    try {
        await connection.query(
            `INSERT INTO letters (recipient_id, sender_name, content, wishlist_id, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [recipient_id, sender_name, content, wishlist_id]
        );
    } finally {
        connection.release();
    }
};

//편지 목록 조회(로그인)
const getLettersForLoggedInUser = async (recipientId, userId) => {
    const connection = await db.getConnection();
    try{
        const [birthdayResult] = await connection.query(
            `SELECT DATE(NOW()) > birthday AS is_after_birthday FROM users WHERE id = ?`,
            [recipientId]
        );
        const [letters] = await connection.query(
            `SELECT id, wishlist_id, sender_name, content, created_at 
             FROM letters WHERE recipient_id = ?`,
            [recipientId]
        );
        return {
            is_after_birthday: !!birthdayResult[0]?.is_after_birthday,
            total_letters: letters.length,
            letters: letters,
        };
    }finally {
        connection.release();
    }
}

// 편지 상세 조회
const getLetterDetails = async (recipientId, letterId, userId) => {
    const connection = await db.getConnection();
    try {
        const [letter] = await connection.query(
            `SELECT id, wishlist_id, sender_name, content, created_at 
             FROM letters 
             WHERE recipient_id = ? AND id = ?`,
            [recipientId, letterId]
        );

        if (!letter.length) {
            throw new Error('Letter not found');
        }

        return letter[0];
    } finally {
        connection.release();
    }
};

const getLettersForGuest = async (accessLink) => {
    const connection = await db.getConnection();
    try {
        // 접속 링크의 주인 확인
        const [userResult] = await connection.query(
            `SELECT name FROM users WHERE access_link = ?`,
            [accessLink]
        );

        if (userResult.length === 0) {
            throw new Error('Invalid access link or user not found');
        }

        const birthdayOwnerName = userResult[0].name;

        // 해당 유저의 편지 개수 확인
        const [letterCountResult] = await connection.query(
            `SELECT COUNT(*) AS total_letters FROM letters WHERE recipient_id = (
                SELECT id FROM users WHERE access_link = ?
            )`,
            [accessLink]
        );

        return {
            birthday_owner_name: birthdayOwnerName,
            total_letters: letterCountResult[0].total_letters,
        };
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