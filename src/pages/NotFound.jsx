import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Ruler, Compass } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
    const navigate = useNavigate();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, duration: 0.8 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
    };

    const drawDraw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { delay: 0.5, type: "spring", duration: 2, bounce: 0 },
                opacity: { delay: 0.5, duration: 0.01 }
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 relative overflow-hidden font-sans text-gray-800">

            {/* --- 1. Dynamic Architectural Grid Background --- */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
                        backgroundSize: '200px 200px'
                    }}
                />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#f0f2f5]/50 to-[#f0f2f5]" />
            </div>

            {/* --- Decorative Floating Elements --- */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                className="absolute top-10 left-10 text-gray-200 opacity-50"
            >
                <Compass size={120} strokeWidth={1} />
            </motion.div>
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 right-10 text-gray-200 opacity-50"
            >
                <Ruler size={120} strokeWidth={1} />
            </motion.div>

            {/* --- Main Content Card --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-3xl w-full text-center"
            >
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[3rem] p-12 md:p-16 relative overflow-hidden">

                    {/* Subtle Noise Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

                    {/* --- The "Drafted" 404 Animation --- */}
                    <div className="relative mb-6 flex justify-center">
                        <svg width="300" height="150" viewBox="0 0 300 150" className="w-full max-w-[300px] h-auto">
                            <motion.text
                                x="50%"
                                y="50%"
                                dominantBaseline="middle"
                                textAnchor="middle"
                                fontSize="120"
                                fontWeight="800"
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="2"
                                variants={drawDraw}
                                className="font-serif tracking-tighter"
                            >
                                404
                            </motion.text>
                        </svg>

                        {/* Floating Tag */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.5, type: "spring" }}
                            className="absolute -top-2 right-[20%] bg-red-50 text-red-500 text-xs font-bold px-3 py-1 rounded-full border border-red-100 shadow-sm rotate-12"
                        >
                            MISSING PLAN
                        </motion.div>
                    </div>

                    {/* --- Text Content --- */}
                    <motion.div variants={itemVariants}>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 tracking-wide">
                            Structure Not Found
                        </h2>
                        <p className="text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed text-lg">
                            We've searched our blueprints, but the floor you are looking for hasn't been built yet or has been demolished.
                        </p>
                    </motion.div>

                    {/* --- Interactive Actions --- */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-900 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Go Back</span>
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#1f2937] text-white font-semibold hover:bg-black transition-all duration-300 shadow-lg shadow-gray-300/50 hover:shadow-gray-400/50 hover:-translate-y-1 w-full sm:w-auto justify-center"
                        >
                            <Home size={18} />
                            <span>Return Home</span>
                        </button>
                    </motion.div>

                    {/* --- Technical Footer --- */}
                    <motion.div variants={itemVariants} className="mt-12 pt-6 border-t border-gray-200/50 flex flex-col items-center gap-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                            Error Code: 0x404_NOT_FOUND
                        </p>
                        <p className="text-[10px] text-gray-300 font-mono">
                            System: Ambassadeur Prestige v2.0
                        </p>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;