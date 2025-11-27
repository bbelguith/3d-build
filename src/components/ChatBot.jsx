import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useChatContext } from "../context/ChatContext";
import { MessageCircle, X, Send, RotateCcw, Image as ImageIcon, Sparkles, Minimize2 } from "lucide-react";

// --- 1. Helper: Parse Markdown & Create Interactive Chips ---
const formatMessage = (content, suggestedHouses = [], navigate, onImageClick) => {
  if (!content) return null;

  const houseMap = {};
  if (suggestedHouses && suggestedHouses.length > 0) {
    suggestedHouses.forEach(h => {
      houseMap[`Unit ${h.number}`] = h;
    });
  }

  const housePattern = Object.keys(houseMap).length > 0
    ? new RegExp(`(${Object.keys(houseMap).join('|')})`, 'gi')
    : null;

  const lines = content.split("\n");

  return lines.map((line, lineIdx) => {
    if (!housePattern || !housePattern.test(line)) {
      return (
        // FIXED: Removed 'text-gray-100' so it inherits correct color (Black for user, White for bot)
        <p key={lineIdx} className="my-1.5 text-[15px] leading-relaxed">
          {parseInlineMarkdown(line)}
        </p>
      );
    }

    const parts = line.split(housePattern);

    return (
      <div key={lineIdx} className="my-3 flex flex-wrap items-center gap-2 text-[15px] leading-relaxed">
        {parts.map((part, partIdx) => {
          const matchedHouse = houseMap[part.charAt(0).toUpperCase() + part.slice(1)];

          if (matchedHouse) {
            return (
              <motion.span
                key={partIdx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1f1f1f] to-[#252525] border border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all cursor-pointer group select-none"
                onClick={() => navigate(`/house/${matchedHouse.id}`)}
              >
                {/* Image Icon Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(matchedHouse);
                  }}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                  title="Preview Image"
                >
                  <ImageIcon size={14} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                </button>

                {/* Text Link */}
                <span className="font-bold text-emerald-400 text-sm tracking-wide group-hover:text-emerald-300">
                  {part}
                </span>
              </motion.span>
            );
          }
          // FIXED: Removed 'text-gray-100' here as well
          return <span key={partIdx}>{parseInlineMarkdown(part)}</span>;
        })}
      </div>
    );
  });
};

// --- 2. Helper: Simple Markdown Parser ---
const parseInlineMarkdown = (text) => {
  const parts = [];
  let currentIndex = 0;
  let keyCounter = 0;
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }
    // FIXED: Removed hardcoded colors (text-white/text-gray-300) so formatting works on white background too
    if (match[1] && match[2]) parts.push(<strong key={keyCounter++} className="font-bold">{match[2]}</strong>);
    else if (match[3] && match[4]) parts.push(<em key={keyCounter++} className="italic opacity-80">{match[4]}</em>);
    currentIndex = match.index + match[0].length;
  }
  if (currentIndex < text.length) parts.push(text.slice(currentIndex));
  return parts.length > 0 ? parts : text;
};

// --- 3. Main ChatBot Component ---
export default function ChatBot() {
  const {
    messages,
    isOpen,
    isLoading,
    quickReplies,
    sendMessage,
    clearConversation,
    toggleChat,
  } = useChatContext();

  const [inputValue, setInputValue] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [houseImages, setHouseImages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/house-images");
        if (response.ok) {
          const data = await response.json();
          setHouseImages(data);
        }
      } catch (error) {
        console.error("Failed to fetch house images:", error);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small timeout to ensure animation allows focus
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const FloatingButton = () => (
    <motion.button
      onClick={toggleChat}
      initial={{ scale: 0, rotate: 180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-black to-gray-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center border border-white/10 hover:shadow-[0_8px_40px_rgba(255,255,255,0.15)] group transition-all duration-500"
    >
      <div className="absolute inset-0 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
      <MessageCircle size={30} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-black"></span>
      </span>
    </motion.button>
  );

  return (
    <>
      <AnimatePresence mode="wait">{!isOpen && <FloatingButton />}</AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className={`
                fixed z-50 flex flex-col overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-3xl
                /* Mobile Styles: Full Screen */
                inset-0 w-full h-[100dvh] rounded-none
                /* Desktop Styles: Floating Card */
                sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:h-[650px] sm:max-h-[80vh] sm:rounded-3xl
            `}
          >
            {/* --- Header --- */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 select-none">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="p-2.5 bg-gradient-to-tr from-gray-800 to-black rounded-xl border border-white/10 shadow-inner">
                    <Sparkles size={18} className="text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-[15px] tracking-wide">Bot Assistant</h3>
                  <p className="text-xs text-emerald-400/80 font-medium">Ambassadeur Prestige AI</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={clearConversation}
                  className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  title="Reset Chat"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={toggleChat}
                  className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  {/* Show Minimize on Mobile, X on Desktop */}
                  <span className="sm:hidden"><Minimize2 size={20} /></span>
                  <span className="hidden sm:block"><X size={20} /></span>
                </button>
              </div>
            </div>

            {/* --- Messages Area --- */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    index={index}
                    onPreviewImage={(house) => {
                      const matchedImg = houseImages.find(img => img.houseId === house.id);
                      const imgSrc = matchedImg ? matchedImg.src : "https://res.cloudinary.com/dzbmwlwra/image/upload/f_auto,q_auto/v1762360930/49ba186a-621c-4825-859e-ff097bec92c5_rdji7t.jpg";
                      setPreviewImage(imgSrc);
                    }}
                  />
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* --- Footer Area --- */}
            <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-2 pb-4 sm:pb-5 px-4 sm:px-5">
              {/* Quick Replies (Horizontal Scroll) */}
              <AnimatePresence>
                {quickReplies.length > 0 && messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 overflow-x-auto pb-3 scrollbar-none mask-fade-right"
                  >
                    {quickReplies.map((reply) => (
                      <button
                        key={reply.id}
                        onClick={() => sendMessage(reply.text)}
                        className="whitespace-nowrap text-xs font-medium text-white/80 bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 hover:border-emerald-500/30 transition-all active:scale-95"
                      >
                        {reply.text}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Field */}
              <form
                onSubmit={handleSend}
                className="relative flex items-center gap-2 p-1.5 bg-[#161616] border border-white/10 rounded-[20px] focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all shadow-lg"
              >
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about properties..."
                  className="flex-1 bg-transparent border-none px-4 py-2.5 text-white placeholder-white/30 text-[15px] focus:outline-none min-w-0"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-white text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Send size={18} fill="currentColor" className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Fullscreen Image Modal --- */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-lg"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-5xl max-h-[85vh] w-full bg-[#111] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="absolute top-0 inset-x-0 p-4 flex justify-end z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 bg-black/50 hover:bg-white hover:text-black rounded-full text-white transition-all backdrop-blur-md border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image Container */}
              <div className="flex-1 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <img src={previewImage} alt="House Preview" className="w-full h-full object-contain" />
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#111] border-t border-white/10 text-center">
                <p className="text-sm font-medium tracking-widest text-white/60 uppercase">Property Preview</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- 4. Message Bubble Component ---
const Message = ({ message, index, onPreviewImage }) => {
  const isBot = message.type === "bot";
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`
            relative max-w-[85%] sm:max-w-[80%] px-4 sm:px-5 py-3 sm:py-3.5 shadow-sm
            ${isBot
            ? "bg-[#1a1a1a] border border-white/5 text-gray-100 rounded-2xl rounded-tl-none"
            : "bg-white text-black font-medium rounded-2xl rounded-tr-none"
          }
        `}
      >
        <div className="text-sm sm:text-[15px] leading-relaxed break-words">
          {/* Formatted Content with Interactive Chips */}
          {formatMessage(message.content, message.suggestedHouses, navigate, onPreviewImage)}
        </div>

        {/* Tiny Timestamp or Role Indicator (Optional) */}
        <div className={`text-[10px] mt-1 opacity-40 uppercase tracking-wider font-bold ${isBot ? 'text-left' : 'text-right'}`}>
          {isBot ? 'AI Assistant' : 'You'}
        </div>
      </div>
    </motion.div>
  );
};