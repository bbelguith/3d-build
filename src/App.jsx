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
import {
  detectConnectionQuality,
  getConnectionInfo,
  getPreloadStrategy,
  onConnectionChange
} from "./utils/connectionDetector";

function AppContent() {
  const location = useLocation();
  const hideLayout =
    location.pathname === "/admin" || location.pathname === "/dashboard";
  const isHome = location.pathname === "/";

  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [currentVideoLoading, setCurrentVideoLoading] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isZoneEditorActive, setIsZoneEditorActive] = useState(false);

  // --- NEW: SCROLL RESTORATION LOGIC ---
  // This ensures the page starts at the top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  // -------------------------------------

  // Detect connection quality on mount
  useEffect(() => {
    const quality = detectConnectionQuality();
    const info = getConnectionInfo();
    setConnectionQuality(quality);
    setConnectionInfo(info);

    // Monitor connection changes
    onConnectionChange((newQuality, newInfo) => {
      setConnectionQuality(newQuality);
      setConnectionInfo(newInfo);
    });
  }, []);

  // Fetch videos from backend
  useEffect(() => {
    if (hideLayout) return;

    const apiBase = import.meta.env.VITE_API_BASE || "";
    axios
      .get(`${apiBase}/api/videos`)
      .then((res) => setVideos(res.data))
      .catch((err) => console.error("Failed to fetch videos:", err));
  }, [hideLayout]);

  useEffect(() => {
    const handler = (event) => {
      setIsZoneEditorActive(Boolean(event.detail?.active));
    };
    window.addEventListener("zone-editor-change", handler);
    return () => window.removeEventListener("zone-editor-change", handler);
  }, []);

  // Adaptive loader logic based on connection quality
  useEffect(() => {
    if (hideLayout || videos.length === 0 || !connectionQuality) return;

    const strategy = getPreloadStrategy(connectionQuality);
    const initialVideos = videos.slice(0, strategy.initialVideos);
    let loadedCount = 0;
    let totalToLoad = initialVideos.length;

    const preloadVideo = (video, index) =>
      new Promise((resolve) => {
        setCurrentVideoLoading(`Video ${index + 1} of ${totalToLoad}`);
        setIsBuffering(true);

        const vid = document.createElement("video");
        vid.src = video.src;
        vid.preload = strategy.preloadType;
        vid.muted = true; // Mute for faster loading
        vid.playsInline = true; // iOS requirement
        vid.setAttribute("playsinline", "true"); // iOS fallback

        // For slow connections, only wait for metadata
        const loadEvent = strategy.preloadType === 'metadata' ? 'loadedmetadata' : 'canplaythrough';

        const handleLoad = () => {
          loadedCount++;
          const newProgress = Math.round((loadedCount / totalToLoad) * 100);
          setProgress(newProgress);
          setIsBuffering(false);
          resolve();
        };

        vid.addEventListener(loadEvent, handleLoad, { once: true });
        vid.onerror = () => {
          setIsBuffering(false);
          resolve(); // Continue even if one video fails
        };

        vid.load();

        // Timeout for slow connections
        const timeout = strategy.preloadType === 'metadata' ? 5000 : 15000;
        setTimeout(() => {
          if (vid.readyState === 0) {
            setIsBuffering(false);
            resolve(); // Continue even if timeout
          }
        }, timeout);
      });

    // Load initial videos
    Promise.all(initialVideos.map((video, index) => preloadVideo(video, index))).then(() => {
      setCurrentVideoLoading(null);
      setIsBuffering(false);
      setTimeout(() => setIsReady(true), 300);

      // Background loading based on strategy
      if (strategy.backgroundLoad && videos.length > strategy.initialVideos) {
        setTimeout(() => {
          videos.slice(strategy.initialVideos).forEach((video, index) => {
            setTimeout(() => {
              const bgVid = document.createElement("video");
              bgVid.src = video.src;
              bgVid.preload = strategy.preloadType;
              bgVid.muted = true;
              bgVid.playsInline = true;
              bgVid.setAttribute("playsinline", "true");
              bgVid.load();
            }, index * strategy.staggerDelay);
          });
        }, 1000);
      }
    });
  }, [videos, hideLayout, connectionQuality]);

  if (!isReady && !hideLayout) {
    return (
      <Loader
        progress={progress}
        currentVideo={currentVideoLoading}
        connectionInfo={connectionInfo}
        isBuffering={isBuffering}
      />
    );
  }

  return (
    <div
      className={
        hideLayout
          ? "min-h-screen bg-white flex flex-col items-center justify-center"
          : "bg-gray-100 min-h-screen flex flex-col"
      }
    >
      {/* 1. Cinematic Grain Overlay (Global Texture) */}
      <div className="noise-overlay" />

      {/* 2. Scroll Progress Bar (Top) */}
      {!hideLayout && !isZoneEditorActive && <ScrollProgress />}

      {/* CustomCursor temporarily disabled to use default system cursor */}
      {/* {!hideLayout && <CustomCursor />} */}

      {!hideLayout && !isZoneEditorActive && <Navbar />}

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
        {isZoneEditorActive ? (
          <VideoPlayer videos={videos} />
        ) : (
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
        )}
      </main>

      {!hideLayout && !isZoneEditorActive && <Footer />}
      {/* Hide chat only on phone when on the home/video page */}
      {!hideLayout && !isZoneEditorActive && (!(isTouchDevice && isHome)) && <ChatBot />}

      {/* 3. Scroll To Top Button (Bottom) */}
      {!hideLayout && !isZoneEditorActive && <ScrollToTop />}
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
