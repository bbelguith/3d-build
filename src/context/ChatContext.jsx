import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm Ambassadeur Prestige Bot. I can help you with available properties and contact info. How can I help you today?"
    }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick replies configuration
  const quickReplies = [
    { id: 'available', text: 'Show available properties' },
    { id: 'contact', text: 'Contact Info' },
  ];

  const toggleChat = () => setIsOpen(!isOpen);
  const clearConversation = () => setMessages([messages[0]]);

  // THE IMPORTANT PART: Connecting to your Backend
  const sendMessage = async (text) => {
    // 1. Add User Message immediately
    const userMsg = { id: Date.now(), type: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Call your specific Backend API (Port 5000)
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          sessionId: 'session-' + Date.now() // Simple session ID
        }),
      });

      // --- SAFETY CHECK 1: Did the server crash (500) or fail (404)? ---
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();

      // --- SAFETY CHECK 2: Is the response valid? ---
      // If data.response is missing, use a fallback string to prevent "split undefined" crash
      const safeContent = data.response || "I'm sorry, I couldn't generate a response at this moment. Please try again.";

      // 3. Add Bot Response + The Property Cards
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: safeContent,
        suggestedHouses: data.suggestedHouses || [] // Ensure this is always an array
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Error connecting to backend:", error);

      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I'm having trouble connecting to the server. Please check if the backend is running on port 5000."
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isOpen,
      isLoading,
      quickReplies,
      sendMessage,
      clearConversation,
      toggleChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};