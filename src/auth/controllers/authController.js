const kakaoService = require('../services/kakaoService');
const pool = require('../../../config/database');
const jwtUtil = require('../utils/jwt');
const response = require('../utils/response');

// 카카오 로그인 처리
exports.kakaoLogin = async (req, res) => {
    const { accessToken } = req.body; // 클라이언트에서 받은 Kakao Access Token
    if (!accessToken) {
        return response.error(res, 'Access token is required', 400);
    }

    try {
        // 카카오 사용자 정보 가져오기
        const kakaoUser = await kakaoService.getKakaoUser(accessToken);

        const email = kakaoUser.kakao_account.email;
        const name = kakaoUser.properties.nickname;

        // DB에서 사용자 확인
        const [rows] = await pool.query('SELECT * FROM members WHERE email = ?', [email]);

        let user;
        if (rows.length) {
            // 기존 회원
            user = rows[0];
        } else {
            // 신규 회원 등록
            const [result] = await pool.query(
                'INSERT INTO members (email, name) VALUES (?, ?)',
                [email, name]
            );
            user = { id: result.insertId, email, name };
        }

        // JWT 발급
        const token = jwtUtil.generateToken({ id: user.id, email: user.email });

        // 성공 응답
        return response.success(res, 'Login successful', {
            token,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        console.error('Error during Kakao login:', error);
        return response.error(res, 'Failed to log in with Kakao', 500);
    }
};

// 사용자 프로필 정보 가져오기
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID

    try {
        const [rows] = await pool.query('SELECT name, email FROM members WHERE id = ?', [userId]);

        if (!rows.length) {
            return response.error(res, 'User not found', 404);
        }

        const user = rows[0];
        return response.success(res, 'User profile fetched successfully', user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return response.error(res, 'Failed to fetch user profile', 500);
    }
};

// 사용자 프로필 업데이트
exports.updateUserProfile = async (req, res) => {
    const userId = req.user.id; // JWT에서 인증된 사용자 ID
    const { name, email, birth_date } = req.body;

    if (!name || !email || !birth_date) {
        return response.error(res, 'All fields (name, email, birth_date) are required', 400);
    }

    try {
        await pool.query(
            'UPDATE members SET name = ?, email = ?, birth_date = ? WHERE id = ?',
            [name, email, birth_date, userId]
        );

        return response.success(res, 'User profile updated successfully');
    } catch (error) {
        console.error('Error updating user profile:', error);
        return response.error(res, 'Failed to update user profile', 500);
    }
};