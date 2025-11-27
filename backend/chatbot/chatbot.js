import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Force load the .env file from the backend folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up one level from 'chatbot' to 'backend' to find .env
dotenv.config({ path: path.join(__dirname, '../.env') });

export async function callClarifaiAPI(messages) {
    // 2. DEBUG: Print the key status (Security: Don't print the whole key)
    const key = process.env.CLARIFAI_KEY;

    if (!key) {
        throw new Error("MISSING_API_KEY: Please add CLARIFAI_KEY to your backend/.env file");
    }

    try {
        const response = await fetch('https://api.clarifai.com/v2/ext/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'https://clarifai.com/openai/chat-completion/models/gpt-oss-120b',
                messages: messages,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            // 3. Print the actual error text from Clarifai to understand WHY it failed
            const errorText = await response.text();
            console.error("❌ Clarifai API Error Details:", errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error inside callClarifaiAPI:', error.message);
        throw error;
    }
}