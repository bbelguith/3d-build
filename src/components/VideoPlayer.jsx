import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    X
} from "lucide-react";

export default function VideoPlayer({ videos = [] }) {
    
    // --- STATE & REFS ---
    const [current, setCurrent] = useState(0);
    const [activeLayer, setActiveLayer] = useState(0);
    const [isReversed, setIsReversed] = useState(false);
    const [isInterior, setIsInterior] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showArrowHint, setShowArrowHint] = useState(true);

    const v0 = useRef(null);
    const v1 = useRef(null);
    const videoContainerRef = useRef(null);

    ///const INTERIOR_VIDEO = "https://res.cloudinary.com/dzbmwlwra/video/upload/f_auto,q_auto,vc_auto/v1762343546/1105_pyem6p.mp4";

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- 1. INITIALIZE PLAYER ---
    useEffect(() => {
        if (videos.length > 0 && v0.current && !isInitialized) {
            v0.current.src = videos[0].src;
            v0.current.muted = true; // Ensure muted for autoplay
            v0.current.playbackRate = 1.4; // Speed up playback
            v0.current.play().catch(() => {
                if (v0.current) {
                    v0.current.muted = true;
                    v0.current.playbackRate = 1.4;
                    v0.current.play();
                }
            });
            setIsInitialized(true);
            
            // Preload next video in background
            if (videos.length > 1 && v1.current) {
                v1.current.src = videos[1].src;
                v1.current.muted = true;
                v1.current.playbackRate = 1.4;
                v1.current.preload = "auto";
                v1.current.load();
            }
        }
    }, [videos, isInitialized]);
    
    // Preload remaining videos in background
    useEffect(() => {
        if (videos.length > 2 && isInitialized) {
            // Preload videos 2+ in background
                    videos.slice(2).forEach((video, index) => {
                        setTimeout(() => {
                            const bgVid = document.createElement("video");
                            bgVid.src = video.src;
                            bgVid.muted = true;
                            bgVid.preload = "auto";
                            bgVid.playbackRate = 1.4;
                            bgVid.playsInline = true; // iOS requirement
                            bgVid.setAttribute("playsinline", "true"); // iOS fallback
                            bgVid.load();
                        }, (index + 1) * 500); // Stagger background loading
            });
        }
    }, [videos, isInitialized]);

    // --- 2. VIDEO LOGIC ---
    const playVideo = (url, index, reversed = false, isInteriorVideo = false) => {
        // Block if already transitioning
        if (isTransitioning) return;
        
        setIsTransitioning(true);
        
        const nextLayer = activeLayer === 0 ? 1 : 0;
        const showEl = nextLayer === 0 ? v0.current : v1.current;
        const hideEl = activeLayer === 0 ? v0.current : v1.current;

        if (showEl) {
            const startPlaying = () => {
                showEl.currentTime = 0;
                showEl.playbackRate = 1.4; // Speed up playback for all transitions
                showEl.play().catch(() => { 
                    // If play fails, ensure muted and try again
                    if (showEl) {
                        showEl.muted = !isInteriorVideo;
                        showEl.playbackRate = 1.4;
                        showEl.play();
                    }
                });

                // Instant switch - no opacity transitions since videos are linked/continuous
                if (hideEl) {
                    hideEl.classList.remove("opacity-100");
                    hideEl.classList.add("opacity-0");
                }
                showEl.classList.remove("opacity-0");
                showEl.classList.add("opacity-100");

                setActiveLayer(nextLayer);
                setCurrent(index);
                setIsReversed(reversed);
                setIsInterior(isInteriorVideo);
                
                // Re-enable buttons immediately (no transition delay)
                setIsTransitioning(false);
            };

            showEl.src = url;
            showEl.muted = !isInteriorVideo; // Ensure muted unless interior video
            showEl.load();

            const onCanPlay = () => {
                startPlaying();
                showEl.removeEventListener("canplay", onCanPlay);
            };

            showEl.addEventListener("canplay", onCanPlay);
            
            // Fallback: if video is already loaded, play immediately
            if (showEl.readyState >= 3) {
                startPlaying();
                showEl.removeEventListener("canplay", onCanPlay);
            } else {
                // Safety timeout to re-enable if video fails to load
                setTimeout(() => {
                    if (isTransitioning) {
                        setIsTransitioning(false);
                    }
                }, 5000);
            }

            showEl.onended = () => {
                if (isInteriorVideo) {
                    const lastIndex = videos.length - 1;
                    setIsInterior(false);
                    playVideo(videos[lastIndex].src, lastIndex, false, false);
                } else if (index === videos.length - 1) {
                    showEl.pause();
                    if (showEl.duration) {
                        showEl.currentTime = showEl.duration - 0.05;
                    }
                }
            };
        } else {
            setIsTransitioning(false);
        }
    };

    // --- 3. HANDLERS ---
    // Find a video by its DB id, fallback to the 2nd video, then the first
    const findVideoIndexById = (targetId) => {
        if (!videos || !videos.length) return -1;
        const normalizedId = Number(targetId);
        const matchById = videos.findIndex(v => Number(v.id) === normalizedId);
        if (matchById !== -1) return matchById;
        if (videos.length > 1) return 1; // fallback to video #2 when id is missing
        return 0;
    };

    const playVideoById = (targetId) => {
        const targetIndex = findVideoIndexById(targetId);
        if (targetIndex < 0 || !videos[targetIndex]) return;
        setIsInterior(false);
        playVideo(videos[targetIndex].src, targetIndex, false);
    };

    const handleNext = () => {
        if (isTransitioning) return; // Block if transitioning
        markArrowHintSeen();

        const atLastVideo = current === videos.length - 1;
        if (atLastVideo) {
            playVideoById(2); // Loop back to the video whose DB id is 2
            return;
        }

        if (isReversed) {
            playVideo(videos[current].src, current, false);
        } else {
            const nextIndex = Math.min(current + 1, videos.length - 1);
            playVideo(videos[nextIndex].src, nextIndex, false);
        }
    };

    const handlePrev = () => {
        if (isTransitioning) return; // Block if transitioning
        markArrowHintSeen();
        if (!isReversed && videos[current]?.reverse) {
            playVideo(videos[current].reverse, current, true);
        } else {
            const prevIndex = (current - 1 + videos.length) % videos.length;
            playVideo(videos[prevIndex].src, prevIndex, false);
        }
    };

    const handleRestart = () => {
        if (isTransitioning) return; // Block if transitioning
        markArrowHintSeen();
        playVideoById(2); // Always jump to the video whose DB id is 2
    };

    const handleBackToExterior = () => {
        if (isTransitioning) return; // Block if transitioning
        // If already exterior, avoid restarting
        if (!isInterior) return;
        setIsInterior(false);
        playVideo(videos[current].src, current, false);
    };

    const isIOS = useMemo(() => {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const iOSDevice = /iPad|iPhone|iPod/.test(ua);
        const iPadOS13Up = ua.includes("Mac") && "ontouchend" in document;
        return iOSDevice || iPadOS13Up;
    }, []);

    // Handle fullscreen mode for mobile - request on the container (keeps UI/buttons) and play active video
    const enterMobileFullscreen = async () => {
        setIsMobileFullscreen(true);

        const containerEl = videoContainerRef.current;
        const activeVideoEl = activeLayer === 0 ? v0.current : v1.current;
        const videoEl = activeVideoEl || v0.current;

        // Request fullscreen on the container so overlays/buttons stay visible
        if (containerEl) {
            try {
                if (containerEl.requestFullscreen) {
                    await containerEl.requestFullscreen();
                } else if (containerEl.webkitRequestFullscreen) {
                    await containerEl.webkitRequestFullscreen();
                } else if (containerEl.msRequestFullscreen) {
                    await containerEl.msRequestFullscreen();
                }
            } catch (err) {
                console.log('Fullscreen not supported or denied');
            }
        }

        // Avoid native iOS fullscreen so overlays/rotation stay visible.
        // We keep playback inline and rely on the container taking the full viewport.
        if (!isIOS) {
            try {
                if (videoEl?.webkitEnterFullscreen) {
                    videoEl.webkitEnterFullscreen();
                }
            } catch (err) {
                // ignore
            }
        }

        // Attempt orientation lock to landscape where supported
        if (screen.orientation && screen.orientation.lock) {
            try {
                await screen.orientation.lock('landscape');
            } catch {
                // silently ignore if not supported
            }
        }

        // Start playing video
        videoEl?.play().catch(() => { });
    };

    const exitMobileFullscreen = async () => {
        setIsMobileFullscreen(false);
        
        // Exit fullscreen
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
        } catch (err) {
            console.log('Error exiting fullscreen');
        }
        
        // Unlock orientation
        if (screen.orientation && screen.orientation.unlock) {
            try {
                screen.orientation.unlock();
            } catch (err) {
                console.log('Orientation unlock not supported');
            }
        }
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement
            );
            
            if (!isFullscreen && isMobileFullscreen) {
                setIsMobileFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, [isMobileFullscreen]);


    const markArrowHintSeen = () => {
        if (showArrowHint) {
            setShowArrowHint(false);
        }
    };

    if (videos.length === 0) return null;

    const isLastVideo = current === videos.length - 1;

    // --- STYLES (Matching Navbar) ---
    // The "Glass" container
    const glassContainer = "bg-[#4a6fa5]/60 backdrop-blur-md border border-[#fcd34d]/60 shadow-lg flex items-center h-10";
    const glassContainerNav = "bg-[#1f2d4d]/85 backdrop-blur-lg border border-[#fcd34d]/80 shadow-2xl flex items-center h-14 px-2 rounded-full";

    // Buttons
    const btnBase = "h-full px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap";
    const btnActive = "bg-white text-slate-900";
    const btnInactive = "text-white hover:bg-white/10 hover:text-[#fcd34d]";
    const btnDisabled = "text-white/30 cursor-not-allowed";
    const btnArrow = "relative w-14 h-14 rounded-full bg-gradient-to-br from-white to-[#fcd34d]/90 text-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.35)] border border-white/70 transition-all duration-200 flex items-center justify-center hover:scale-110 hover:shadow-[0_12px_50px_rgba(252,211,77,0.6)]";
    const btnArrowDisabled = "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.35)]";

    // Dividers
    const separator = "w-[1px] h-5 bg-[#fcd34d]/40";

    return (
        <div 
            ref={videoContainerRef}
            className={`relative w-full bg-black overflow-hidden select-none font-sans ${
                isMobile && !isMobileFullscreen ? 'h-[60vh] md:h-screen' : 'h-screen'
            }`}
        >
            {/* Button to play video with id=5 */}
            <button
                onClick={() => playVideoById(5)}
                className="absolute top-4 right-4 z-50 px-4 py-2 rounded-full bg-gradient-to-br from-[#fcd34d] to-[#f97316] text-slate-900 font-bold shadow-lg hover:scale-105 transition-all text-xs md:text-sm lg:text-base"
                style={{minWidth: '44px', minHeight: '44px'}}
                aria-label="Peek a House"
            >
                Show Video 5
            </button>
            {/* Mobile overlay button - shown only on mobile when not in fullscreen */}
            {isMobile && !isMobileFullscreen && (
                <div 
                    className="absolute inset-0 flex items-center justify-center z-40 cursor-pointer bg-black/50"
                    onClick={enterMobileFullscreen}
                >
                    <div className="text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition">
                            <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="white" />
                        </div>
                        <p className="text-white text-lg md:text-xl font-semibold">Show Project</p>
                        <p className="text-white/80 text-sm mt-2">Tap to view in fullscreen</p>
                    </div>
                </div>
            )}

            {/* Close button for mobile fullscreen */}
            {isMobile && isMobileFullscreen && (
                <button
                    onClick={exitMobileFullscreen}
                    className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition"
                    aria-label="Close fullscreen"
                >
                    <X className="w-6 h-6" />
                </button>
            )}


            {/* --- VIDEO LAYERS --- */}
            <div 
                className="absolute inset-0 w-full h-full bg-black overflow-hidden"
            >
                <video 
                    ref={v0} 
                    className="absolute inset-0 w-full h-full object-cover opacity-100" 
                    playsInline 
                    muted={!isInterior} 
                    autoPlay 
                    preload="auto"
                />
                <video 
                    ref={v1} 
                    className="absolute inset-0 w-full h-full object-cover opacity-0" 
                    playsInline 
                    muted={!isInterior} 
                    autoPlay 
                    preload="auto"
                />
            </div>

            {/* --- CONTROLS --- (hidden on mobile when not in fullscreen) */}
            {(!isMobile || isMobileFullscreen) && (
            <div className="absolute bottom-4 md:bottom-8 left-0 right-0 z-50 flex justify-center px-4">
                <div className="flex flex-wrap items-center justify-center gap-3">

                    {/* GROUP 1: CONTEXT SWITCHER (Exterior only) */}
                    <div className={`${glassContainer} rounded-full p-1 gap-1`}>
                        <button
                            onClick={handleBackToExterior}
                            disabled={isTransitioning}
                            className={`rounded-full px-6 h-full text-xs font-bold tracking-wider uppercase transition-all ${!isInterior ? "bg-white text-slate-900 shadow-sm" : "text-white hover:bg-white/10"} ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Exterior
                        </button>
                    </div>

                    {/* GROUP 3: NAVIGATION (Rectangular Segmented Control) */}
                    <div className={`${glassContainerNav} relative`}>
                        {/* Prev Button */}
                        <button
                            onClick={handlePrev}
                            disabled={(current === 0 && !isReversed) || isTransitioning}
                            className={`${btnArrow} ${((current === 0 && !isReversed) || isTransitioning) ? btnArrowDisabled : ""}`}
                            aria-label="Play previous video"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className={`${separator} h-8`}></div>

                        {/* Status / Middle Indicator */}
                        <div className="h-full px-4 flex items-center justify-center text-xs font-bold text-white tracking-widest min-w-[90px]">
                            {isTransitioning ? "LOADING..." : isLastVideo ? "FINISHED" : "PLAYING"}
                        </div>

                        <div className={`${separator} h-8`}></div>

                        {/* Next Button (always an arrow, even on last video) */}
                        <div className="relative">
                            {showArrowHint && (
                                <span className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f97316] to-[#fcd34d] text-[11px] font-semibold text-slate-900 shadow-lg whitespace-nowrap">
                                    Tap to play →
                                </span>
                            )}
                            <button
                                onClick={isLastVideo ? handleRestart : handleNext}
                                disabled={isTransitioning}
                                className={`${btnArrow} ${isTransitioning ? btnArrowDisabled : ""} ${showArrowHint ? "animate-pulse ring-4 ring-[#fcd34d]/40" : ""}`}
                                aria-label="Play next video"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            )}
        </div>
    );
}