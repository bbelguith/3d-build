import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const apiBase = import.meta.env.VITE_API_BASE || "";
    try {
      const res = await axios.post(`${apiBase}/api/auth/login`, {
        email,
        password,
      });

      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem("adminToken", res.data.token);
        }
        setLoggedIn(true);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Network error. Please check server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loggedIn) {
    return <Navigate to="/dashboard" state={{ email }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* --- Background Ambient Glow --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative z-10 transition-all">

        {/* --- Header --- */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="mt-6 text-2xl font-serif font-bold text-gray-900 tracking-wide">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Authorized Personnel Only
          </p>
        </div>

        {/* --- Error Message --- */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center justify-center gap-2 animate-pulse">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* --- Email Input --- */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800"
                placeholder="admin@architecture.com"
              />
            </div>
          </div>

          {/* --- Password Input --- */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-bold tracking-wide hover:bg-black hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-gray-900/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        {/* --- Footer --- */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group px-4 py-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;