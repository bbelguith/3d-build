import React from "react";
import logo from "../assets/Logo2-BNG.png";
import { motion, AnimatePresence } from "framer-motion";

export default function Loader({ progress }) {
  return (
    <AnimatePresence>
      {progress < 100 && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
          exit={{
            y: "-100%",
            transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          {/* --- 1. Subtle Background Texture (Luxury Feel) --- */}
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

          <div className="relative z-10 flex flex-col items-center justify-center space-y-12">
            {/* --- 2. LOGO (Centerpiece) --- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Subtle Gold Glow behind logo */}
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

            {/* --- 4. Minimalist Progress Bar --- */}
            <div className="w-64 sm:w-80 space-y-3">
              {/* Bar Container */}
              <div className="h-[2px] bg-gray-800 w-full relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-[#FFD700]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
                {/* Shine effect on the bar */}
                <motion.div
                  className="absolute top-0 h-full w-[50px] bg-gradient-to-r from-transparent to-white opacity-60 blur-sm"
                  initial={{ left: "-20%" }}
                  animate={{ left: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>

              {/* Status Text */}
              <div className="flex justify-between text-[10px] tracking-[0.2em] text-gray-600 font-mono uppercase">
                <span>Loading Experience</span>
                <span className="text-[#FFD700]">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}