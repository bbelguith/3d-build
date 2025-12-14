import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { AnimatePresence } from "framer-motion";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Navbar from "./components/Navbar";
import Location from "./components/Location";
import Technology from "./components/Technology";
import Contact from "./components/Contact";
import Projects from "./components/Projects";
import Footer from "./components/Footer";
import VideoPlayer from "./components/VideoPlayer";
import Loader from "./components/Loader";
import ChatBot from "./components/ChatBot";
import CustomCursor from "./components/CustomCursor";
import PageTransition from "./components/PageTransition";
import ScrollProgress from "./components/ScrollProgress";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Plan from "./pages/Plan";
import Planb from "./pages/Planb";
import AdminPage from "./pages/AdminPage";
import Dashboard from "./pages/Dashboard";
import HouseCommentForm from "./pages/HouseCommentForm";
import NotFound from "./pages/NotFound";
import { ChatProvider } from "./context/ChatContext";

function AppContent() {
  const location = useLocation();
  const hideLayout =
    location.pathname === "/admin" || location.pathname === "/dashboard";
  const isHome = location.pathname === "/";

  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device to conditionally apply cursor-none
  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    setIsTouchDevice(checkTouchDevice());
  }, []);

  // --- NEW: SCROLL RESTORATION LOGIC ---
  // This ensures the page starts at the top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  // -------------------------------------

  // Fetch videos from backend
  useEffect(() => {
    if (hideLayout) return;

    const apiBase = import.meta.env.VITE_API_BASE || "";
    axios
      .get(`${apiBase}/api/videos`)
      .then((res) => setVideos(res.data))
      .catch((err) => console.error("Failed to fetch videos:", err));
  }, [hideLayout]);

  // Loader logic - Only load first 2 videos initially
  useEffect(() => {
    if (hideLayout || videos.length === 0) return;

    const initialVideos = videos.slice(0, 2); // Changed from 3 to 2
    let loadedCount = 0;

    const preloadVideo = (video) =>
      new Promise((resolve) => {
        const vid = document.createElement("video");
        vid.src = video.src;
        vid.preload = "auto";
        vid.muted = true; // Mute for faster loading
        vid.playsInline = true; // iOS requirement
        vid.setAttribute("playsinline", "true"); // iOS fallback
        vid.oncanplaythrough = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / initialVideos.length) * 100));
          resolve();
        };
        vid.onerror = resolve;
        vid.load();
      });

    Promise.all(initialVideos.map(preloadVideo)).then(() => {
      setTimeout(() => setIsReady(true), 200); // Reduced delay
      
      // Preload remaining videos in background (non-blocking)
      setTimeout(() => {
        videos.slice(2).forEach((video) => {
          const bgVid = document.createElement("video");
          bgVid.src = video.src;
          bgVid.preload = "auto";
          bgVid.muted = true;
          bgVid.playsInline = true; // iOS requirement
          bgVid.setAttribute("playsinline", "true"); // iOS fallback
          bgVid.load();
        });
      }, 1000); // Start background loading after 1 second
    });
  }, [videos, hideLayout]);

  if (!isReady && !hideLayout) return <Loader progress={progress} />;

  return (
    <div
      className={
        hideLayout
          ? "min-h-screen bg-white flex flex-col items-center justify-center"
          : `bg-gray-100 min-h-screen flex flex-col ${isTouchDevice ? '' : 'cursor-none'}`
      }
    >
      {/* 1. Cinematic Grain Overlay (Global Texture) */}
      <div className="noise-overlay" />

      {/* 2. Scroll Progress Bar (Top) */}
      {!hideLayout && <ScrollProgress />}

      {!hideLayout && <CustomCursor />}

      {!hideLayout && <Navbar />}

      <ToastContainer
        position="top-center"
        autoClose={2800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <main className="flex-grow w-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* HOME PAGE */}
            <Route
              path="/"
              element={
                <PageTransition>
                  <VideoPlayer videos={videos} />
                  <Location />
                  <Technology />
                  <Contact />
                  <Projects />
                </PageTransition>
              }
            />

            {/* PLAN PAGE A */}
            <Route
              path="/plan"
              element={
                <PageTransition>
                  <Plan />
                </PageTransition>
              }
            />

            {/* PLAN PAGE B */}
            <Route
              path="/planb"
              element={
                <PageTransition>
                  <Planb />
                </PageTransition>
              }
            />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/dashboard"
              element={
                location.state?.email ? (
                  <Dashboard email={location.state.email} />
                ) : (
                  <Navigate to="/admin" replace />
                )
              }
            />

            {/* HOUSE DETAIL */}
            <Route
              path="/house/:id"
              element={
                <PageTransition>
                  <HouseCommentForm />
                </PageTransition>
              }
            />

            {/* 404 PAGE */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {!hideLayout && <Footer />}
      {/* Hide chat only on phone when on the home/video page */}
      {!hideLayout && (!(isTouchDevice && isHome)) && <ChatBot />}

      {/* 3. Scroll To Top Button (Bottom) */}
      {!hideLayout && <ScrollToTop />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </Router>
  );
}

export default App;