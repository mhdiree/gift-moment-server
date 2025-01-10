// 성공 응답
exports.success = (res, message, data = {}) => {
    res.status(200).json({
        status: 'success',
        message,
        data
    });
};

// 오류 응답
exports.error = (res, message, statusCode = 400) => {
    res.status(statusCode).json({
        status: 'error',
        message,
        data: {}
    });
};
