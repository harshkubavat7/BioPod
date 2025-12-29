// const express = require('express');
// const router = express.Router();
// const ChatbotService = require('../services/chatbot-service');

// router.post('/message', async (req, res) => {
//   try {
//     const { message } = req.body;
    
//     if (!message || message.trim() === '') {
//       return res.status(400).json({ error: 'Message required' });
//     }
    
//     // Process message
//     const response = await ChatbotService.processMessage(message);
    
//     // Save to database
//     await ChatbotService.saveMessage(message, response.message);
    
//     res.json(response);
    
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const ChatbotService = require('../services/chatbot-service');

router.post('/message', async (req, res) => {
  try {
    const message = req.body && req.body.message;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = await ChatbotService.processMessage(message);
    res.json(response);
  } catch (error) {
    console.error('[Chatbot Routes] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

