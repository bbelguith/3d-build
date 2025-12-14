import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  User,
  Phone,
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle2,
  Maximize2,
  Building2,
  CalendarCheck
} from "lucide-react";

const HouseCommentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("call");
  const [message, setMessage] = useState("");

  // UI State
  const [success, setSuccess] = useState(false);
  const [showImg, setShowImg] = useState(false);
  const [currentHouseImage, setCurrentHouseImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // 1. Fetch the House Image from DB on mount
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || "";
    const fetchHouseImage = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/house-images`);
        const img = res.data.find((h) => h.houseId === parseInt(id));
        if (img) {
          setCurrentHouseImage(img.src);
        }
      } catch (error) {
        console.error("Error fetching house image:", error);
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchHouseImage();
  }, [id]);

  // 2. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const newComment = {
      houseId: parseInt(id),
      name,
      phone,
      request,
      text: message,
      date: new Date().toISOString(),
      seen: false
    };

    const apiBase = import.meta.env.VITE_API_BASE || "";
    try {
      await axios.post(`${apiBase}/api/comments`, newComment);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch (error) {
      console.error("Error saving comment:", error);
      alert("Failed to send request. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 md:p-8 font-sans text-gray-800">

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row">

        {/* --- LEFT SIDE: IMAGE & INFO --- */}
        <div className="w-full md:w-2/5 bg-gray-900 relative flex flex-col justify-between">
          {/* Image Background Layer */}
          <div className="absolute inset-0 z-0">
            {currentHouseImage ? (
              <>
                <img
                  src={currentHouseImage}
                  alt={`House ${id}`}
                  className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 animate-pulse" />
            )}
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-between text-white">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors mb-8"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-4xl font-serif font-bold mb-2 tracking-wide">Unit {id}</h1>
              <div className="flex items-center gap-2 text-emerald-400 font-medium tracking-widest text-xs uppercase mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Available for Inquiry
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                Interested in this premium residence? Fill out the form to schedule a viewing or request more details directly from our sales team.
              </p>
            </div>

            {currentHouseImage && (
              <button
                onClick={() => setShowImg(true)}
                className="group flex items-center gap-3 text-sm font-semibold text-white/80 hover:text-white transition-colors mt-8"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <Maximize2 size={18} />
                </div>
                View Full Image
              </button>
            )}
          </div>
        </div>

        {/* --- RIGHT SIDE: FORM --- */}
        <div className="w-full md:w-3/5 p-8 md:p-12 bg-white relative">

          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
              <p className="text-gray-500 max-w-sm mb-8">
                Thank you for your interest. One of our agents will contact you shortly regarding Unit {id}.
              </p>
              <div className="w-full max-w-xs h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest">Redirecting...</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Make an Inquiry</h2>
                <p className="text-gray-500 text-sm mt-1">We typically reply within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Phone & Request Type Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234..."
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Preference</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                        {request === 'call' ? <Phone size={18} /> : <CalendarCheck size={18} />}
                      </div>
                      <select
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        className="w-full pl-11 pr-8 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 appearance-none cursor-pointer"
                      >
                        <option value="call">Request Call</option>
                        <option value="meeting">Book Meeting</option>
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Message</label>
                  <div className="relative group">
                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                      <MessageSquare size={18} />
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="I'm interested in viewing this property..."
                      rows={4}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold tracking-wide hover:bg-black hover:shadow-xl hover:shadow-gray-200 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Request <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* --- IMAGE MODAL --- */}
      {showImg && currentHouseImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowImg(false)}>
          <div className="relative max-w-7xl w-full max-h-[90vh]">
            <img
              src={currentHouseImage}
              alt={`House ${id}`}
              className="w-full h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImg(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              Close <span className="text-2xl font-light">&times;</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default HouseCommentForm;