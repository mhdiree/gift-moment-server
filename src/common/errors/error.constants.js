const ERROR_CODES = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500
};

const ERROR_MESSAGES = {
    COMMON: {
        INVALID_REQUEST: 'Invalid request',
        UNAUTHORIZED: 'Unauthorized access',
        NOT_FOUND: 'Resource not found',
        SERVER_ERROR: 'Internal server error',
        MISSING_REQUIRED: 'Required fields are missing'
    }
};

module.exports = {
    ERROR_CODES,
    ERROR_MESSAGES
};