import express from 'express';
import { generateSystemPrompt } from '../chatbot/generateSystemPrompt.js';
import { callClarifaiAPI } from '../chatbot/chatbot.js';
import db from '../models/index.js'; // Assuming you have an index.js that exports 'db'

const router = express.Router();
const House = db.House; // Access the House model

// Store history in memory (Note: In production, use Redis or DB)
const conversationHistory = new Map();

router.post('/', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({ error: 'Message and sessionId are required' });
        }

        // 1. Fetch Data from DB
        const houses = await db.House.findAll({ // Make sure you use db.House or House model
            where: { state: 'actif' },
            raw: true
        });

        // 2. Initialize History if new session
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, [
                { role: 'system', content: generateSystemPrompt(houses) }
            ]);
        } else {
            // Update system prompt with fresh DB data
            const history = conversationHistory.get(sessionId);
            history[0] = { role: 'system', content: generateSystemPrompt(houses) };
        }

        const history = conversationHistory.get(sessionId);
        history.push({ role: 'user', content: message });

        // 3. Keep history short (last 20 messages)
        const recentHistory = history.length > 21
            ? [history[0], ...history.slice(-20)]
            : history;

        // 4. Get AI Response
        const response = await callClarifaiAPI(recentHistory);
        history.push({ role: 'assistant', content: response });

        // 5. Suggest Houses (UI Helper)
        // Checks if the AI mentioned any specific unit numbers
        const suggestedHouses = houses.filter(house =>
            response.includes(house.number)
        );

        res.json({
            response,
            suggestedHouses
        });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;