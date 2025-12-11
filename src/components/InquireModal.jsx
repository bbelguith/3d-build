import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, MessageCircle, Calendar, ArrowRight } from "lucide-react"; // Added Calendar import
import { useNavigate } from "react-router-dom";

export default function InquireModal({ isOpen, onClose }) {
    const navigate = useNavigate();

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: { y: 100, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        },
        exit: { y: 100, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    };

    const handleScheduleClick = () => {
        onClose();
        // Pass state to Plan page
        navigate("/plan", { state: { scrollToSelection: true } });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    <motion.div
                        className="relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="h-32 bg-gradient-to-br from-gray-900 to-gray-800 relative">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }}></div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-6 left-8">
                                <h2 className="text-2xl font-serif font-bold text-white tracking-wide">Get in Touch</h2>
                                <p className="text-white/60 text-sm">Ambassadeur Prestige</p>
                            </div>
                        </div>

                        {/* Content Actions */}
                        <div className="p-8 space-y-4">

                            {/* 1. WhatsApp CALL Button */}
                            <a
                                href="https://wa.me/21612345678"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 border border-green-100 hover:border-green-300 hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">WhatsApp Call</h3>
                                    <p className="text-xs text-gray-500">Voice call via WhatsApp</p>
                                </div>
                                <ArrowRight size={18} className="text-green-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </a>

                            {/* 2. Schedule Visit Button */}
                            <button
                                onClick={handleScheduleClick}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group text-left"
                            >
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">Schedule Visit</h3>
                                    <p className="text-xs text-gray-500">Pick a residence to book</p>
                                </div>
                                <ArrowRight size={18} className="text-blue-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>

                        </div>

                        <div className="px-8 pb-8 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Available 9AM - 6PM</p>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}