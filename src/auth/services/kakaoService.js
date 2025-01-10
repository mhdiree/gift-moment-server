const axios = require('axios');

// 카카오 사용자 정보 요청
exports.getKakaoUser = async (accessToken) => {
    try {
        const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch user information from Kakao');
    }
};
