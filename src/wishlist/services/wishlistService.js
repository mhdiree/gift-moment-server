const pool = require('../../../config/database');
const { deleteImageFromS3 } = require('../../auth/utils/upload');

// 선물 추가
exports.addWishlist = async ({ memberId, title, image, price, link, description }) => {
    // 회원이 보유한 선물 수 확인
    const [existingGifts] = await pool.query(
        'SELECT COUNT(*) AS count FROM gift WHERE member_id = ?',
        [memberId]
    );

    if (existingGifts[0].count >= 5) {
        throw new Error("A member can have a maximum of 5 gifts"); // 5개 초과 시 에러
    }

    // 선물 데이터 추가
    const [result] = await pool.query(
        'INSERT INTO gift (member_id, title, image, price, link, description, target_amount, current_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
        [memberId, title, image, price, link, description, price]
    );

    // 추가된 선물 반환
    return {
        id: result.insertId,
        memberId,
        title,
        image,
        price,
        link,
        description,
    };
};

// 선물 수정
exports.updateWishlist = async (giftId, { link, description, image }) => {
    const updateFields = [];
    const queryParams = [];

    // 기존 데이터를 조회하여 기본값 확보
    const [existingGiftRows] = await pool.query(
        'SELECT * FROM gift WHERE id = ?',
        [giftId]
    );

    if (existingGiftRows.length === 0) {
        return null; // giftId가 잘못된 경우
    }

    const existingGift = existingGiftRows[0]; // 기존 데이터의 첫 번째 행
    const existingImage = existingGift.image; // 기존 image 값 저장

    // link 값 추가
    if (link !== undefined) {
        updateFields.push("link = ?");
        queryParams.push(link);
    }

    // description 값 추가
    if (description !== undefined) {
        updateFields.push("description = ?");
        queryParams.push(description);
    }

    // image 값 처리: null인지, undefined인지 확인
    if (image !== undefined && image !== null) {
        updateFields.push("image = ?");
        queryParams.push(image);
    } else if (image === undefined && image === null) {
        // image 값이 없으면 기존 값 유지
        updateFields.push("image = ?");
        queryParams.push(existingImage);
    }

    // 수정할 값이 없으면 null 반환
    if (updateFields.length === 0) {
        return null;
    }

    // SQL 쿼리 작성
    const query = 
        'UPDATE gift SET ' + updateFields.join(', ') + ', updated_at = NOW() WHERE id = ?';
    
    queryParams.push(giftId); // 마지막으로 giftId 추가

    // 쿼리 실행
    const [result] = await pool.query(query, queryParams);

    // 수정된 행이 없으면 null 반환
    if (result.affectedRows === 0) {
        return null;
    }

    // 수정된 선물 데이터 반환
    const [updatedGiftRows] = await pool.query(
        'SELECT * FROM gift WHERE id = ?',
        [giftId]
    );

    return updatedGiftRows.length > 0 ? updatedGiftRows[0] : null;
};

// 선물 삭제
exports.deleteWishlist = async (giftId) => {
    const wishlist = await this.getWishlistById(giftId);

    if (wishlist && wishlist.image) {
        await deleteImageFromS3(wishlist.image); // 이미지 삭제
    }

    const [result] = await pool.query('DELETE FROM gift WHERE id = ?', [giftId]);
    return result.affectedRows > 0;
};
// 선물 조회 함수
exports.getWishlistById = async (giftId) => {
    const [gift] = await pool.query('SELECT * FROM gift WHERE id = ?', [giftId]);
    return gift[0]; // 선물 반환
};

// 특정 선물 조회-생일자
exports.getGiftDetailsForWishlistByMember = async (gift_id, memberId) => {
    try {
        // 선물 정보 가져오기
        const [gift] = await pool.query(
            `SELECT g.id, g.title, g.image, g.price, g.link, g.description, 
                    m.name, DATE_FORMAT(m.birth_date, '%m\uC6D4 %d\uC77C') AS birth, 
                    g.member_id, m.birth_date
             FROM gift g
             JOIN members m ON g.member_id = m.id
             WHERE g.id = ? AND g.member_id = ?`,  // 선물 소유자(member_id)가 로그인한 사용자와 일치해야 함
            [gift_id, memberId]
        );

        if (gift.length === 0) {
            throw new Error("Gift not found or access denied");
        }

        const giftData = gift[0];

        // 결제 정보 가져오기
        const [payments] = await pool.query(
            `SELECT p.id AS payment_id, p.amount, m.name
             FROM payments p
             JOIN members m ON p.member_id = m.id
             WHERE p.gift_id = ?`,
            [gift_id]
        );

        // 결제 정보 가공 (가격과 결제 금액을 정수로 변환)
        const paymentDetails = payments.map(payment => ({
            name: payment.name,
            amount: Math.floor(payment.amount),  // 소수점 없이 정수로 반환
            payment_id: payment.payment_id,
        }));

        // 생일을 기준으로 D-day 계산
        const today = new Date();
        const birthDate = new Date(giftData.birth_date);

        // 생일을 현재 연도로 변경 (이미 지났다면 내년 생일로 설정)
        birthDate.setFullYear(today.getFullYear());
        if (birthDate < today) {
            birthDate.setFullYear(today.getFullYear() + 1);
        }

        // D-day 계산
        const timeDiff = birthDate.getTime() - today.getTime();
        let dday = Math.ceil(timeDiff / (1000 * 3600 * 24));  // D-day 계산

        // D-day가 0이거나 365일인 경우 "day"로 설정
        if (dday === 0 || dday === 365) {
            dday = "day";
        }

        // 반환할 데이터 구성 (가격을 소수점 없이 정수로 반환)
        return {
            name: giftData.name,
            birth: giftData.birth,
            dday: dday,
            member_id: giftData.member_id,
            gift: {
                id: giftData.id,
                title: giftData.title,
                image: giftData.image,  // S3 URL로 반환
                price: Math.floor(giftData.price),  // 가격을 정수로 반환
                link: giftData.link,
                description: giftData.description,
                payments: paymentDetails,
            }
        };
    } catch (error) {
        console.error("Error in getGiftDetailsForWishlistByMember:", error);
        throw error;
    }
};

// 특정 선물 조회-선물 주는 사람
exports.getGiftDetailsForWishlistByGiver = async (gift_id) => {
    try {
        // 선물 정보 가져오기
        const [gift] = await pool.query(
            `SELECT g.id, g.title, g.image, g.price, g.link, g.description, 
                    m.name, DATE_FORMAT(m.birth_date, '%m\uC6D4 %d\uC77C') AS birth, 
                    g.member_id, m.birth_date
             FROM gift g
             JOIN members m ON g.member_id = m.id
             WHERE g.id = ?`,
            [gift_id]
        );

        if (gift.length === 0) {
            throw new Error("Gift not found");
        }

        const giftData = gift[0];

        // 결제 정보 가져오기
        const [payments] = await pool.query(
            `SELECT p.id AS payment_id, m.name, p.amount
             FROM payments p
             JOIN members m ON p.member_id = m.id
             WHERE p.gift_id = ?`,
            [gift_id]
        );

        // 결제 정보에 percentage 추가
        const paymentDetails = payments.map(payment => ({
            name: payment.name,
            percentage: giftData.price > 0 ? Math.floor((parseFloat(payment.amount) / parseFloat(giftData.price)) * 100) : 0,
        }));

        // 생일을 기준으로 D-day 계산
        const today = new Date();
        const birthDate = new Date(giftData.birth_date);

        // 생일을 현재 연도로 변경 (이미 지났다면 내년 생일로 설정)
        birthDate.setFullYear(today.getFullYear());
        if (birthDate < today) {
            birthDate.setFullYear(today.getFullYear() + 1);
        }

        // D-day 계산
        const timeDiff = birthDate.getTime() - today.getTime();
        let dday = Math.ceil(timeDiff / (1000 * 3600 * 24)); // D-day 계산

        // D-day가 0이거나 365일인 경우 "day"로 설정
        if (dday === 0 || dday === 365) {
            dday = "day";
        }

        // 반환할 데이터 구성 (price를 정수로 변환)
        return {
            name: giftData.name,
            birth: giftData.birth,
            dday: dday,
            member_id: giftData.member_id,
            gift: {
                id: giftData.id,
                title: giftData.title,
                image: giftData.image,
                price: Math.floor(giftData.price), // 소수점 없이 정수 반환
                link: giftData.link,
                description: giftData.description,
                payments: paymentDetails,
            }
        };
    } catch (error) {
        console.error("Error in getGiftDetailsForWishlistByGiver:", error);
        throw error;
    }
};

// 위시리스트 조회-생일자
exports.getWishlistByBirthday = async (member_id, before_birthday) => {
    try {
        // 회원 정보를 먼저 가져오기
        const [members] = await pool.query(
            `SELECT m.name, DATE_FORMAT(m.birth_date, '%m\uC6D4 %d\uC77C') AS birth, m.id AS member_id, m.birth_date
             FROM members m
             WHERE m.id = ?`, 
            [member_id]
        );

        const member = members.length > 0 ? members[0] : null; // 회원 정보 (선물 데이터에서 첫 번째로 가져오기)

        if (!member) {
            return [{
                name: "회원 정보 없음",
                birth: "N/A",
                dday: "N/A",
                member_id: member_id,
                before_birthday: false,
                gift: []  // 선물이 없으면 빈 배열 반환
            }];
        }

        // 선물 정보 가져오기
        const [gifts] = await pool.query(
            `SELECT g.id, g.title, g.image, g.price, g.link, g.description, g.target_amount 
             FROM gift g
             WHERE g.member_id = ?`, 
            [member_id]
        );

        const wishlist = await Promise.all(
            gifts.map(async (gift) => {
                // 각 선물에 대한 payments 테이블에서 금액 합산
                const [paymentData] = await pool.query(
                    `SELECT SUM(amount) AS total_amount 
                     FROM payments 
                     WHERE gift_id = ?`,
                    [gift.id]
                );

                const current_amount = paymentData[0]?.total_amount || 0;

                await pool.query(
                    `UPDATE gift 
                     SET current_amount = ? 
                     WHERE id = ?`,
                    [current_amount, gift.id]
                );

                const percent = (current_amount / gift.target_amount) * 100;
                const state = percent >= 100 ? '완료' : '진행 중';

                return {
                    id: gift.id,
                    title: gift.title,
                    image: gift.image,
                    percent: Math.floor(percent.toFixed(0)),
                    state: state
                };
            })
        );

        const today = new Date();
        const birthDate = new Date(member.birth_date); 
        
        birthDate.setFullYear(today.getFullYear());

        if (birthDate.toDateString() === today.toDateString()) {
            return [{
                name: member.name,
                birth: member.birth,
                dday: "day",  
                member_id: member.member_id,
                before_birthday: false,  
                gift: wishlist.length > 0 ? wishlist : []  // 선물이 없으면 빈 배열 반환
            }];
        }

        if (birthDate < today) {
            birthDate.setFullYear(today.getFullYear() + 1);
        }
        
        const timeDiff = birthDate.getTime() - today.getTime();
        const dday = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const beforeBirthday = dday > 0;  

        return [{
            name: member.name,
            birth: member.birth,
            dday: dday,  
            member_id: member.member_id,
            before_birthday: beforeBirthday,  
            gift: wishlist.length > 0 ? wishlist : []  // 선물이 없으면 빈 배열 반환
        }];
    } catch (error) {
        console.error("Error occurred in getWishlistByBirthday:", error);
        throw error;
    }
};

// 위시리스트 조회-선물 주는 사람
exports.getWishlistForMember = async (member_id) => {
    try {
        // 선물 주는 사람 정보 가져오기
        const [members] = await pool.query(
            `SELECT m.name, DATE_FORMAT(m.birth_date, '%m월 %d일') AS birth, m.id AS member_id, m.birth_date
             FROM members m
             WHERE m.id = ?`, 
            [member_id]
        );

        const member = members.length > 0 ? members[0] : null; // 회원 정보 (선물 데이터에서 첫 번째로 가져오기)

        if (!member) {
            return {
                name: "회원 정보 없음",
                birth: "N/A",
                dday: "N/A",
                gift: []  // 선물이 없으면 빈 배열 반환
            };
        }

        // 선물 정보 가져오기
        const [gifts] = await pool.query(
            `SELECT g.id AS gift_id, g.title, g.image 
             FROM gift g
             WHERE g.member_id = ?`, 
            [member_id]
        );

        // 선물이 없으면 빈 배열 반환
        const giftList = gifts.length > 0 ? gifts.map(gift => ({
            id: gift.gift_id,
            title: gift.title,
            image: gift.image
        })) : [];

        // 생일 D-day 계산
        const birthDate = new Date(member.birth_date);
        const today = new Date();
        const currentYear = today.getFullYear();
        const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const diffTime = nextBirthday - today;
        let dday;

        if (diffTime === 0) {
            dday = 'day';  // 생일 당일
        } else if (diffTime > 0) {
            dday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  // 생일 전
        } else {
            const nextYearBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
            const nextDiffTime = nextYearBirthday - today;
            dday = Math.ceil(nextDiffTime / (1000 * 60 * 60 * 24));  // 내년 생일로 D-day 계산
        }

        return {
            name: member.name,
            birth: member.birth,
            dday: dday,
            gift: giftList  // 선물이 없으면 빈 배열 반환
        };
    } catch (error) {
        console.error("Error occurred in getWishlistForMember:", error);
        throw error;
    }
};
