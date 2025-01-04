const PaymentService = require('../services/payment.service');
const ApiResponse = require('../../common/response/api.response');
const { ERROR_CODES } = require('../../common/errors/error.constants');
const { PAYMENT_ERROR_MESSAGES } = require('../constants/payment.error.constants');

class PaymentController {
    constructor() {
        this.paymentService = new PaymentService();
    }

    ready = async (req, res) => {
        try {
            const { amount, gift_id } = req.body;
            if (!amount || !gift_id) {
                return res.status(ERROR_CODES.BAD_REQUEST).json(
                    ApiResponse.error(PAYMENT_ERROR_MESSAGES.MISSING_REQUIRED)
                );
            }

            const response = await this.paymentService.readyPayment(gift_id, amount);

            res.status(200).json(
                ApiResponse.success('Payment initialization successful', {
                    tid: response.tid,
                    next_redirect_pc_url: response.next_redirect_pc_url,
                    next_redirect_mobile_url: response.next_redirect_mobile_url
                })
            );
        } catch (error) {
            console.error('Payment ready error:', error.message || error);

            if (error.message === 'Gift not found') {
                return res.status(ERROR_CODES.NOT_FOUND).json(
                    ApiResponse.error('Gift not found')
                );
            }

            res.status(ERROR_CODES.INTERNAL_SERVER).json(
                ApiResponse.error(PAYMENT_ERROR_MESSAGES.INITIALIZATION_FAILED)
            );
        }
    }

    approve = async (req, res) => {
        try {
            const { pg_token, tid, gift_id, member_id, amount } = req.body;

            if (!pg_token || !tid || !gift_id || !member_id || !amount) {
                return res.status(ERROR_CODES.BAD_REQUEST).json(
                    ApiResponse.error(PAYMENT_ERROR_MESSAGES.MISSING_REQUIRED)
                );
            }

            const response = await this.paymentService.approvePayment(
                pg_token,
                tid,
                gift_id,
                member_id,
                amount
            );

            res.status(200).json(
                ApiResponse.success('Payment approved successfully', {
                    aid: response.aid,
                    amount: response.amount,
                    approved_at: response.approved_at,
                    item_name: response.item_name
                })
            );
        } catch (error) {
            console.error('Payment approve error:', error.message || error);

            if (error.message === 'Gift not found') {
                return res.status(ERROR_CODES.NOT_FOUND).json(
                    ApiResponse.error('Gift not found')
                );
            }

            if (error.message === 'Required parameters missing') {
                return res.status(ERROR_CODES.BAD_REQUEST).json(
                    ApiResponse.error(PAYMENT_ERROR_MESSAGES.MISSING_REQUIRED)
                );
            }

            if (error.message === 'Invalid amount type') {
                return res.status(ERROR_CODES.BAD_REQUEST).json(
                    ApiResponse.error(PAYMENT_ERROR_MESSAGES.INVALID_AMOUNT)
                );
            }

            res.status(ERROR_CODES.INTERNAL_SERVER).json(
                ApiResponse.error(PAYMENT_ERROR_MESSAGES.APPROVAL_FAILED)
            );
        }
    }

    cancel = async (req, res) => {
        res.status(200).json(
            ApiResponse.success(PAYMENT_ERROR_MESSAGES.CANCELLED)
        );
    }

    fail = async (req, res) => {
        res.status(200).json(
            ApiResponse.error(PAYMENT_ERROR_MESSAGES.FAILED)
        );
    }
}

module.exports = PaymentController;