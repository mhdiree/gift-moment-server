const letterService = require('../services/letter.service');

class LetterController {

    async createLetter(req, res) {
        const { wishlist_id, sender_name, content } = req.body;
        if (!wishlist_id || !sender_name || !content) {
            return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const letter = await letterService.createLetter(wishlist_id, sender_name, content);
        return res.status(201).json(letter);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to create letter' });
      }
    }

    async getLetters(req, res) {
        const { recipient_id } = req.params;
        if (!recipient_id) {
          return res.status(400).json({ error: 'Recipient ID is required' });
        }
    
        try {
          const letters = await letterService.getLettersByRecipient(recipient_id);
          return res.status(200).json(letters);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to retrieve letters' });
        }
    }
}

module.exports = new LetterController();