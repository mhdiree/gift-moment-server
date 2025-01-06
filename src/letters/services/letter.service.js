const db = require('../../../config/database');

class letterService {
    
    async createLetter(wishlistId, senderName, content){
        const [result] = await db.execute(
            `INSERT INTO letters (wishlist_id, sender_name, content, created_at) VALUES (?, ?, ?, NOW())`,
            [wishlistId, senderName, content]
        );
        return { id: result.insertId };
    }

    async getLettersByRecipient(recipientId) {
        const [rows] = await db.execute(
          `SELECT * FROM letters WHERE wishlist_id = ? ORDER BY created_at DESC`,
          [recipientId]
        );
        return rows;
    }

}

module.exports = new letterService;