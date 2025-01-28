const axios = require('axios');
const db = require('../../../config/database');
const { PAYMENT_ERROR_MESSAGES } = require('./../constants/payment.error.constants');

class PaymentService {
    constructor() {
        this.adminKey = process.env.KAKAO_ADMIN_KEY;
        this.cid = 'TC0ONETIME';
        this.baseUrl = 'https://kapi.kakao.com/v1/payment';
        this.domain = process.env.FRONT_DOMAIN;
    }

    async readyPayment(giftId, amount) {
        const connection = await db.getConnection();

        try {
            // gift 존재 여부 확인
            const [gifts] = await connection.execute(
                'SELECT id FROM gift WHERE id = ?',
                [giftId]
            );

            if (gifts.length === 0) {
                throw new Error('Gift not found');
            }

            const response = await axios.post(
                `${this.baseUrl}/ready`,
                {
                    cid: this.cid,
                    partner_order_id: `GIFT_${giftId}`,
                    partner_user_id: giftId.toString(),
                    item_name: '선물하기',
                    quantity: 1,
                    total_amount: amount,
                    tax_free_amount: 0,
                    // TODO: 프론트엔드 도메인 및 결제완료 페이지 경로에 맞춰서 approval, cancel, fail url 수정하기
                    // 도메인은 .env에서 환경변수 변경하면 되고
                    // 경로는 여기서 수정
                    // 카카오 디벨로퍼스에서, Redirect URI 경로 추가도 필요 ('https://developers.kakao.com/console/app/1182262/product/login')
                    approval_url: `${this.domain}/payments/kakao-pay/success`,
                    cancel_url: `${this.domain}/api/v1/payments/kakao-pay/cancel`,
                    fail_url: `${this.domain}/api/v1/payments/kakao-pay/fail`
                },
                {
                    headers: {
                        Authorization: `KakaoAK ${this.adminKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );

            return {
                tid: response.data.tid,
                next_redirect_pc_url: response.data.next_redirect_pc_url,
                next_redirect_mobile_url: response.data.next_redirect_mobile_url,
                created_at: response.data.created_at
            };
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    async approvePayment(pgToken, tid, giftId, memberId, amount) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 카카오페이 승인 요청 전에 입력값 검증
            if (!pgToken || !tid || !giftId || !memberId || !amount) {
                throw new Error('Required parameters missing');
            }

            // amount가 숫자인지 확인
            if (isNaN(amount)) {
                throw new Error('Invalid amount type');
            }

            // gift 존재 여부 확인
            const [gifts] = await connection.execute(
                'SELECT id FROM gift WHERE id = ?',
                [giftId]
            );

            if (gifts.length === 0) {
                throw new Error('Gift not found');
            }

            console.log('Transaction started with params:', {
                pgToken, tid, giftId, memberId, amount
            });

            console.log('Transaction started with params:', {
                pgToken, tid, giftId, memberId, amount
            });

            // 1. 카카오페이 결제 승인 요청
            const response = await axios.post(
                `${this.baseUrl}/approve`,
                {
                    cid: this.cid,
                    tid: tid,
                    partner_order_id: `GIFT_${giftId}`,
                    partner_user_id: giftId.toString(),
                    pg_token: pgToken,
                },
                {
                    headers: {
                        Authorization: `KakaoAK ${this.adminKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );

            // 2. payments 테이블에 결제 정보 저장
            const [paymentResult] = await connection.execute(
                `INSERT INTO payments
                 (gift_id, member_id, amount, payment_type, payment_status, tid, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [giftId, memberId, amount, 'KAKAO_PAY', 'COMPLETED', tid]
            );
            console.log('Payment insert result:', paymentResult);

            // 3. gift 테이블의 current_amount 업데이트
            const [updateResult] = await connection.execute(
                `UPDATE gift
                 SET current_amount = current_amount + ?,
                     updated_at     = NOW()
                 WHERE id = ?`,
                [amount, giftId]
            );
            console.log('Gift update result:', updateResult);

            if (updateResult.affectedRows === 0) {
                throw new Error('Gift not found');
            }

            await connection.commit();
            console.log('Transaction committed successfully');

            return {
                aid: response.data.aid,
                payment_type: response.data.payment_type,
                amount: response.data.amount,
                approved_at: response.data.approved_at,
                item_name: response.data.item_name
            };

        } catch (error) {
            await connection.rollback();
            console.error('Payment approval failed:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = PaymentService;