const pool = require('../../../config/database');
const response = require('../../auth/utils/response');

// 사용자 정보 조회
exports.getUserInfo = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID

    try {
        // members 및 member_accounts 테이블에서 사용자 정보 조회
        const [userRows] = await pool.query(`
            SELECT 
                m.name, m.birth_date, m.email, 
                ma.bank_code, ma.account_number
            FROM members m
            LEFT JOIN member_accounts ma ON m.id = ma.member_id
            WHERE m.id = ?
        `, [userId]);

        if (!userRows.length) {
            return response.error(res, 'User not found', 404);
        }

        return response.success(res, 'User information fetched successfully', userRows[0]);
    } catch (error) {
        console.error('Error fetching user info:', error);
        return response.error(res, 'Failed to fetch user information', 500);
    }
};

// 사용자 정보 수정 (PATCH)
exports.updateUserInfo = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID
    const { name, birth_date, email, bank_code, account_number } = req.body;

    try {
        // 트랜잭션 시작
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // members 테이블 업데이트 (필드가 전달된 경우에만 수정)
            if (name || birth_date || email) {
                await connection.query(
                    'UPDATE members SET name = COALESCE(?, name), birth_date = COALESCE(?, birth_date), email = COALESCE(?, email) WHERE id = ?',
                    [name, birth_date, email, userId]
                );
            }

            // member_accounts 테이블 업데이트 (필드가 전달된 경우에만 수정)
            if (bank_code || account_number) {
                await connection.query(
                    `INSERT INTO member_accounts (member_id, bank_code, account_number, account_holder)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     bank_code = COALESCE(?, bank_code),
                     account_number = COALESCE(?, account_number)`,
                    [userId, bank_code, account_number, name || '', bank_code, account_number]
                );
            }

            await connection.commit();
            return response.success(res, 'User information updated successfully');
        } catch (err) {
            await connection.rollback();
            console.error('Error during update:', err);
            return response.error(res, 'Failed to update user information', 500);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating user info:', error);
        return response.error(res, 'Failed to update user information', 500);
    }
};

// 회원 탈퇴
exports.deleteUser = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID

    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // members 및 관련 데이터 삭제 (ON DELETE CASCADE로 처리)
            const [result] = await connection.query('DELETE FROM members WHERE id = ?', [userId]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return response.error(res, 'User not found', 404);
            }

            await connection.commit();
            return response.success(res, 'User account deleted successfully');
        } catch (err) {
            await connection.rollback();
            console.error('Error during user deletion:', err);
            return response.error(res, 'Failed to delete user account', 500);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return response.error(res, 'Failed to delete user account', 500);
    }
};
