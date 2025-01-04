class ApiResponse {
    static success(message, data = null) {
        return {
            status: 'success',
            message,
            data
        };
    }

    static error(message, status = 'error', data = null) {
        return {
            status,
            message,
            data
        };
    }
}

module.exports = ApiResponse;