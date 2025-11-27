import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Construction } from "lucide-react";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 relative overflow-hidden font-sans text-gray-800">

            {/* --- Architectural Background --- */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
            />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-gray-100/80 pointer-events-none" />

            <div className="relative z-10 max-w-2xl w-full text-center animate-[fadeIn_0.6s_ease-out]">

                {/* --- 404 Visual --- */}
                <div className="relative mb-8">
                    <h1 className="text-[12rem] md:text-[16rem] font-bold leading-none text-gray-100 select-none tracking-tighter">
                        404
                    </h1>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 rotate-12">
                            <Construction size={64} className="text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* --- Message --- */}
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                    Structure Not Found
                </h2>
                <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
                    The page you are looking for has been moved, demolished, or never existed in our blueprints.
                </p>

                {/* --- Actions --- */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm w-full sm:w-auto justify-center"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-black hover:scale-105 transition-all duration-300 shadow-lg shadow-gray-200 w-full sm:w-auto justify-center"
                    >
                        <Home size={18} />
                        Return Home
                    </button>
                </div>

                {/* --- Footer --- */}
                <div className="mt-16 pt-8 border-t border-gray-200/60 w-full flex justify-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                        &copy; 2025 Building & Architecture
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
};

export default NotFound;