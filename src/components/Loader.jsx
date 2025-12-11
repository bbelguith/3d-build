import React from "react";
import logo from "../assets/Logo2-BNG.png";
import { motion, AnimatePresence } from "framer-motion";

export default function Loader({ progress }) {
  // --- VARIANTS FOR ORCHESTRATION ---

  // 1. The Background Curtain (Wipes up after content is gone)
  const containerVariants = {
    initial: {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    },
    exit: {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", // Wipes from bottom to top
      transition: {
        duration: 1.1,
        ease: [0.76, 0, 0.24, 1], // Cinematic "Quart" easing
        delay: 0.2, // Wait slightly for content to start fading
      },
    },
  };

  // 2. The Inner Content (Fades out & zooms away first)
  const contentVariants = {
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      filter: "blur(10px)", // Adds a cinematic motion blur feel
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {progress < 100 && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
          variants={containerVariants}
          initial="initial"
          exit="exit"
        >
          {/* --- 1. Subtle Background Texture --- */}
          {/* We keep this static inside the container so it gets clipped with the parent */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            ></div>
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/50 to-black opacity-90" />
          </div>

          {/* --- CONTENT WRAPPER (For Staggered Exit) --- */}
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center space-y-12"
            variants={contentVariants}
            exit="exit" // Triggers the content exit animation
          >
            {/* --- 2. LOGO --- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Gold Glow */}
              <div className="absolute inset-0 bg-[#FFD700] blur-[100px] opacity-10 rounded-full scale-150" />
              <img
                src={logo}
                alt="BNGIMMO Logo"
                className="w-64 md:w-80 object-contain relative z-10 drop-shadow-2xl"
              />
            </motion.div>

            {/* --- 3. Typography --- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-4">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#FFD700]/50"></span>
                <p className="text-xs sm:text-sm text-[#FFD700] tracking-[0.5em] uppercase font-light">
                  Ambassadeur Prestige
                </p>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#FFD700]/50"></span>
              </div>
            </motion.div>

            {/* --- 4. Progress Bar --- */}
            <div className="w-64 sm:w-80 space-y-3">
              <div className="h-[2px] bg-gray-800 w-full relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-[#FFD700]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
                <motion.div
                  className="absolute top-0 h-full w-[50px] bg-gradient-to-r from-transparent to-white opacity-60 blur-sm"
                  initial={{ left: "-20%" }}
                  animate={{ left: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>

              <div className="flex justify-between text-[10px] tracking-[0.2em] text-gray-600 font-mono uppercase">
                <span>Loading Experience</span>
                <span className="text-[#FFD700]">{Math.round(progress)}%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}