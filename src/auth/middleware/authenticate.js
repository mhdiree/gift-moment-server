const jwtUtil = require('../utils/jwt');
const response = require('../utils/response');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.error(res, 'Unauthorized: Missing token', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwtUtil.verifyToken(token);
        req.user = decoded; // 인증된 사용자 정보
        next();
    } catch (error) {
        return response.error(res, 'Unauthorized: Invalid or expired token', 401);
    }
};
