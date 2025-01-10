const jwt = require('jsonwebtoken');
const response = require('../utils/response');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.error(res, 'Unauthorized: Missing token', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded; // 인증된 사용자 정보
        next();
    } catch (error) {
        return response.error(res, 'Unauthorized: Invalid or expired token', 401);
    }
};
