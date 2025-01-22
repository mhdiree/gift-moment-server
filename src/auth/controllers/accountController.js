const pool = require('../../../config/database');
const response = require('../utils/response');

// 사용자 계좌 등록
exports.addAccount = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID
    const { bank_code, account_number } = req.body;

    // 입력 검증
    if (!bank_code || !account_number) {
        return response.error(res, 'Bank code and account number are required', 400);
    }

    try {
        // 사용자의 이름 가져오기 (계좌 소유주 이름 설정)
        const [userRows] = await pool.query('SELECT name FROM members WHERE id = ?', [userId]);
        if (!userRows.length) {
            return response.error(res, 'User not found', 404);
        }
        const accountHolder = userRows[0].name;

        // 계좌 정보 삽입
        await pool.query(
            'INSERT INTO member_accounts (member_id, bank_code, account_number) VALUES (?, ?, ?)',
            [userId, bank_code, account_number]
        );

        return response.success(res, 'Account added successfully');
    } catch (error) {
        console.error('Error adding account:', error);
        return response.error(res, 'Failed to add account', 500);
    }
};
