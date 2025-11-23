import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

const AdminPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        setLoggedIn(true);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Network error");
      }
    }
  };


  if (loggedIn) {
    return <Navigate to="/dashboard" state={{ email }} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-10">
      {/* Card */}
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur p-8 sm:p-10">
        {/* Branding / Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-extrabold tracking-widest">
            BA
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.25em]">
            Architecture Admin
          </h1>
          <span className="mt-3 block h-[3px] w-24 bg-black mx-auto rounded-full" />
          <p className="mt-4 text-gray-600">
            Sign in to access your projects dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-7">
          {/* Email */}
          <div className="group relative">
            <label htmlFor="email" className="block text-sm font-semibold mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@architecture.com"
              className="peer w-full bg-transparent px-1 py-2 text-base border-b border-gray-300 focus:outline-none focus:border-black transition-colors"
            />
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-black transition-all duration-300 peer-focus:w-full" />
          </div>

          {/* Password */}
          <div className="group relative">
            <label htmlFor="password" className="block text-sm font-semibold mb-2">
              Password
            </label>
            <div className="flex items-center gap-2 border-b border-gray-300 focus-within:border-black transition-colors">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="peer w-full bg-transparent px-1 py-2 text-base focus:outline-none"
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-2 py-1 rounded-full"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-black transition-all duration-300 peer-focus:w-full" />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm text-center -mt-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-full bg-black text-white py-3 font-semibold tracking-wide hover:bg-gray-900 active:scale-[0.99] transition"
          >
            Sign In
          </button>

          {/* Go Back Button */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full mt-3 rounded-full border-2 border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white active:scale-[0.99] transition"
          >
            ← Go Back
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          &copy; 2025 Building & Architecture Admin
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
