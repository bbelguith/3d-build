import React, { useEffect, useState, useRef, useMemo } from "react";
import zonesData from "../data/zones.json";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    X,
    Loader2
} from "lucide-react";
import { detectConnectionQuality, getPreloadStrategy } from "../utils/connectionDetector";

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
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferingProgress, setBufferingProgress] = useState(0);
    const [loadedVideos, setLoadedVideos] = useState(new Set());
    const [connectionQuality, setConnectionQuality] = useState(null);
    const [editZones, setEditZones] = useState(false);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [draggingPoint, setDraggingPoint] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);

    const v0 = useRef(null);
    const v1 = useRef(null);
    const videoContainerRef = useRef(null);
    const preloadedVideosRef = useRef(new Map());
    const hotspotOverlayRef = useRef(null);

    ///const INTERIOR_VIDEO = "https://res.cloudinary.com/dzbmwlwra/video/upload/f_auto,q_auto,vc_auto/v1762343546/1105_pyem6p.mp4";
    const BASE_WIDTH = zonesData.baseWidth || 1920;
    const BASE_HEIGHT = zonesData.baseHeight || 1080;
    const [zones, setZones] = useState(zonesData.zones || []);
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const showZoneToolbar = false;

    // Detect mobile device and connection quality
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Detect connection quality
        const quality = detectConnectionQuality();
        setConnectionQuality(quality);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper function to preload a video
    const preloadVideo = (videoSrc, index) => {
        if (preloadedVideosRef.current.has(videoSrc)) {
            return; // Already preloaded
        }

        const strategy = connectionQuality ? getPreloadStrategy(connectionQuality) : { preloadType: 'auto' };
        const bgVid = document.createElement("video");
        bgVid.src = videoSrc;
        bgVid.muted = true;
        bgVid.preload = strategy.preloadType;
        bgVid.playbackRate = 1.4;
        bgVid.playsInline = true;
        bgVid.setAttribute("playsinline", "true");

        bgVid.addEventListener('canplaythrough', () => {
            preloadedVideosRef.current.set(videoSrc, bgVid);
            setLoadedVideos(prev => new Set([...prev, index]));
        }, { once: true });

        bgVid.load();
    };

    // --- 1. INITIALIZE PLAYER ---
    useEffect(() => {
        if (videos.length > 0 && v0.current && !isInitialized) {
            setIsBuffering(true);
            v0.current.src = videos[0].src;
            v0.current.muted = true;
            v0.current.playbackRate = 1.4;

            // Add buffering progress tracking
            const updateBuffering = () => {
                if (v0.current && v0.current.buffered.length > 0) {
                    const bufferedEnd = v0.current.buffered.end(v0.current.buffered.length - 1);
                    const duration = v0.current.duration || 1;
                    const progress = (bufferedEnd / duration) * 100;
                    setBufferingProgress(progress);
                }
            };

            v0.current.addEventListener('progress', updateBuffering);
            v0.current.addEventListener('canplay', () => setIsBuffering(false));
            v0.current.addEventListener('waiting', () => setIsBuffering(true));
            v0.current.addEventListener('playing', () => setIsBuffering(false));

            v0.current.play().catch(() => {
                if (v0.current) {
                    v0.current.muted = true;
                    v0.current.playbackRate = 1.4;
                    v0.current.play();
                }
            });

            setLoadedVideos(prev => new Set([...prev, 0]));
            setIsInitialized(true);
            
            // Preload next video based on connection quality
            if (videos.length > 1 && v1.current) {
                const strategy = connectionQuality ? getPreloadStrategy(connectionQuality) : { preloadType: 'auto' };
                v1.current.src = videos[1].src;
                v1.current.muted = true;
                v1.current.playbackRate = 1.4;
                v1.current.preload = strategy.preloadType;
                v1.current.load();
                setLoadedVideos(prev => new Set([...prev, 1]));
            }
        }
    }, [videos, isInitialized, connectionQuality]);
    
    // Progressive preloading - only load videos when needed or on fast connections
    useEffect(() => {
        if (videos.length > 2 && isInitialized && connectionQuality) {
            const strategy = getPreloadStrategy(connectionQuality);

            // For fast connections, preload all videos
            if (strategy.backgroundLoad) {
                videos.slice(2).forEach((video, index) => {
                    setTimeout(() => {
                        preloadVideo(video.src, index + 2);
                    }, (index + 1) * strategy.staggerDelay);
                });
            }
            // For slow/medium connections, videos will be loaded on-demand
        }
    }, [videos, isInitialized, connectionQuality]);

    // --- 2. VIDEO LOGIC ---
    const playVideo = (url, index, reversed = false, isInteriorVideo = false) => {
        // Block if already transitioning
        if (isTransitioning) return;
        
        setIsTransitioning(true);
        setIsBuffering(true);

        const nextLayer = activeLayer === 0 ? 1 : 0;
        const showEl = nextLayer === 0 ? v0.current : v1.current;
        const hideEl = activeLayer === 0 ? v0.current : v1.current;

        if (showEl) {
            // Preload next video if not already loaded (progressive loading)
            if (index + 1 < videos.length && !loadedVideos.has(index + 1)) {
                preloadVideo(videos[index + 1].src, index + 1);
            }

            const startPlaying = () => {
                showEl.currentTime = 0;
                showEl.playbackRate = 1.4;

                // Add buffering listeners
                const updateBuffering = () => {
                    if (showEl && showEl.buffered.length > 0) {
                        const bufferedEnd = showEl.buffered.end(showEl.buffered.length - 1);
                        const duration = showEl.duration || 1;
                        const progress = (bufferedEnd / duration) * 100;
                        setBufferingProgress(progress);
                    }
                };

                showEl.addEventListener('progress', updateBuffering);
                showEl.addEventListener('canplay', () => setIsBuffering(false));
                showEl.addEventListener('waiting', () => setIsBuffering(true));
                showEl.addEventListener('playing', () => setIsBuffering(false));

                showEl.play().catch(() => {
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
                    // Remove old listeners
                    hideEl.removeEventListener('progress', updateBuffering);
                    hideEl.removeEventListener('canplay', () => setIsBuffering(false));
                    hideEl.removeEventListener('waiting', () => setIsBuffering(true));
                    hideEl.removeEventListener('playing', () => setIsBuffering(false));
                }
                showEl.classList.remove("opacity-0");
                showEl.classList.add("opacity-100");

                setActiveLayer(nextLayer);
                setCurrent(index);
                setIsReversed(reversed);
                setIsInterior(isInteriorVideo);
                
                // Re-enable buttons
                setIsTransitioning(false);
            };

            // Check if video is already preloaded
            const preloadedVideo = preloadedVideosRef.current.get(url);
            if (preloadedVideo && preloadedVideo.readyState >= 3) {
                showEl.src = url;
                showEl.muted = !isInteriorVideo;
                startPlaying();
            } else {
                showEl.src = url;
                showEl.muted = !isInteriorVideo;
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
                            setIsBuffering(false);
                        }
                    }, connectionQuality === 'slow' ? 10000 : 5000);
                }
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
        // Try to find by id property (from DB)
        const normalizedId = Number(targetId);
        const matchById = videos.findIndex(v => Number(v.id) === normalizedId);
        if (matchById !== -1) return matchById;
        // If no id property, fallback to index (id=5 means index 4)
        if (videos.length >= 5 && normalizedId === 5) return 4;
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
    const currentVideoId = Number(videos[current]?.id);
    const currentVideoSrc = videos[current]?.src || "";
    const showHouseHotspots = currentVideoSrc.includes("2_fqtpzq.mp4");

    useEffect(() => {
        console.log("[VideoPlayer] current video id:", currentVideoId, "hotspots enabled:", showHouseHotspots);
    }, [currentVideoId, showHouseHotspots]);

    const getOverlayRect = () => hotspotOverlayRef.current?.getBoundingClientRect() || null;

    const getBasePointFromEvent = (event) => {
        const rect = getOverlayRect();
        if (!rect) return null;
        const baseX = ((event.clientX - rect.left) / rect.width) * BASE_WIDTH;
        const baseY = ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT;
        return { x: Math.round(baseX), y: Math.round(baseY) };
    };

    const handleOverlayClick = (event) => {
        if (!editZones || selectedZoneId == null) return;
        const basePoint = getBasePointFromEvent(event);
        if (!basePoint) return;
        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== selectedZoneId) return zone;
                return { ...zone, points: [...zone.points, basePoint] };
            })
        );
    };

    const handlePointPointerDown = (event, zoneId, pointIndex) => {
        if (!editZones) return;
        setDraggingPoint({ zoneId, pointIndex });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleOverlayPointerMove = (event) => {
        if (!editZones || !draggingPoint) return;
        const basePoint = getBasePointFromEvent(event);
        if (!basePoint) return;

        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id !== draggingPoint.zoneId) return zone;
                const nextPoints = zone.points.map((pt, idx) => {
                    if (idx !== draggingPoint.pointIndex) return pt;
                    return {
                        x: clamp(basePoint.x, 0, BASE_WIDTH),
                        y: clamp(basePoint.y, 0, BASE_HEIGHT)
                    };
                });
                return { ...zone, points: nextPoints };
            })
        );
    };

    const handleOverlayPointerUp = (event) => {
        if (!editZones || !draggingPoint) return;
        setDraggingPoint(null);
        try {
            event.target.releasePointerCapture?.(event.pointerId);
        } catch {
            // Ignore if pointer capture isn't set on this target
        }
    };

    const addZone = () => {
        const nextId = zones.length > 0 ? Math.max(...zones.map((z) => z.id)) + 1 : 1;
        const newZone = {
            id: nextId,
            points: []
        };
        setZones((prev) => [...prev, newZone]);
        setSelectedZoneId(nextId);
    };

    const deleteSelectedZone = () => {
        if (selectedZoneId == null) return;
        setZones((prev) => prev.filter((zone) => zone.id !== selectedZoneId));
        setSelectedZoneId(null);
    };

    const logZones = () => {
        console.log("[VideoPlayer] zones:", {
            baseWidth: BASE_WIDTH,
            baseHeight: BASE_HEIGHT,
            zones
        });
    };

    // --- STYLES (Matching Navbar) ---
    // The "Glass" container
    const glassContainer = "bg-[#4a6fa5]/60 backdrop-blur-md border border-[#fcd34d]/60 shadow-lg flex items-center h-10";
    const glassContainerNav = "bg-[#1f2d4d]/85 backdrop-blur-lg border border-[#fcd34d]/80 shadow-2xl flex items-center h-14 px-2 rounded-full";

    // Buttons
    const btnBase = "h-full px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap";
    const btnActive = "bg-white text-slate-900";
    const btnInactive = "text-white hover:bg-white/10 hover:text-[#fcd34d]";
    const btnDisabled = "text-white/30 cursor-not-allowed";
    const btnArrow = "relative w-14 h-14 rounded-full bg-gradient-to-br from-[#fcd34d] to-[#f97316] text-slate-900 shadow-xl border-2 border-[#fcd34d] transition-all duration-200 flex items-center justify-center hover:scale-110 hover:shadow-[0_12px_50px_rgba(252,211,77,0.6)] focus:outline-none focus:ring-4 focus:ring-[#fcd34d]/40";
    const btnArrowDisabled = "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-xl";

    // Dividers
    const separator = "w-[1px] h-5 bg-[#fcd34d]/40";

    return (
        <div className="w-full bg-black">
        <div 
            ref={videoContainerRef}
            className={`relative w-full bg-black overflow-hidden select-none font-sans ${
                isMobile && !isMobileFullscreen ? 'h-[60vh] md:h-screen' : 'h-screen'
            }`}
        >

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
                        <p className="text-white text-lg md:text-xl font-semibold">Show Project full screen</p>
                        
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

            {showHouseHotspots && (
                <div
                    ref={hotspotOverlayRef}
                    className={`absolute inset-0 z-30 ${editZones ? "cursor-crosshair" : ""}`}
                    onClick={handleOverlayClick}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                >
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
                        preserveAspectRatio="none"
                    >
                        {zones.map((zone) => {
                            const isSelected = zone.id === selectedZoneId;
                            const isHovered = zone.id === hoveredZoneId;
                            const pointList = zone.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
                            return (
                                <g key={zone.id}>
                                    {zone.points.length >= 3 ? (
                                        <polygon
                                            points={pointList}
                                            fill={
                                                isHovered
                                                    ? "rgba(30,64,175,0.35)"
                                                    : isSelected
                                                        ? "rgba(16,185,129,0.25)"
                                                        : "rgba(16,185,129,0.12)"
                                            }
                                            stroke={
                                                isHovered
                                                    ? "rgba(30,64,175,0.9)"
                                                    : isSelected
                                                        ? "rgba(16,185,129,0.9)"
                                                        : "rgba(16,185,129,0.5)"
                                            }
                                            strokeWidth={isSelected || isHovered ? 4 : 2}
                                            onPointerDown={() => {
                                                if (!editZones) return;
                                                setSelectedZoneId(zone.id);
                                            }}
                                            onPointerEnter={() => setHoveredZoneId(zone.id)}
                                            onPointerLeave={() => setHoveredZoneId(null)}
                                        />
                                    ) : (
                                        <polyline
                                            points={pointList}
                                            fill="none"
                                            stroke={
                                                isHovered
                                                    ? "rgba(30,64,175,0.9)"
                                                    : isSelected
                                                        ? "rgba(16,185,129,0.9)"
                                                        : "rgba(16,185,129,0.5)"
                                            }
                                            strokeWidth={isSelected || isHovered ? 4 : 2}
                                            pointerEvents="stroke"
                                            onPointerDown={() => {
                                                if (!editZones) return;
                                                setSelectedZoneId(zone.id);
                                            }}
                                            onPointerEnter={() => setHoveredZoneId(zone.id)}
                                            onPointerLeave={() => setHoveredZoneId(null)}
                                        />
                                    )}
                                    {editZones &&
                                        zone.points.map((pt, idx) => (
                                            <circle
                                                key={`${zone.id}-${idx}`}
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={6}
                                                fill={isSelected ? "#22c55e" : "#10b981"}
                                                stroke="#064e3b"
                                                strokeWidth={2}
                                                onPointerDown={(event) => handlePointPointerDown(event, zone.id, idx)}
                                            />
                                        ))}
                                </g>
                            );
                        })}
                    </svg>

                    {editZones && (
                        <div className="absolute top-4 right-4 z-40 max-h-[70vh] overflow-auto rounded-2xl bg-black/60 text-white text-[11px] px-3 py-2 border border-white/10">
                            <div className="font-bold tracking-wider mb-2">Zones (px @ 1920x1080)</div>
                            {zones.map((zone) => (
                                <div key={zone.id} className="font-mono mb-2">
                                    <div>ID: {zone.id}</div>
                                    {zone.points.map((pt, idx) => (
                                        <div key={`${zone.id}-pt-${idx}`}>
                                            {idx + 1}: x={pt.x} y={pt.y}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- BUFFERING INDICATOR --- */}
            {isBuffering && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-[#fcd34d] animate-spin mx-auto" />
                        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#fcd34d] to-[#f97316]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${bufferingProgress}%` }}
                                transition={{ ease: "linear", duration: 0.3 }}
                            />
                        </div>
                        <p className="text-white text-sm">Buffering video...</p>
                    </div>
                </div>
            )}

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
                            <ChevronLeft className="w-7 h-7 text-[#f97316] drop-shadow-[0_2px_6px_rgba(252,211,77,0.5)]" />
                        </button>

                        <div className={`${separator} h-8`}></div>

                        {/* Status / Middle Indicator */}
                        <div className="h-full px-4 flex items-center justify-center text-xs font-bold text-white tracking-widest min-w-[90px]">
                            {isBuffering ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>BUFFERING</span>
                                </div>
                            ) : isTransitioning ? (
                                "LOADING..."
                            ) : isLastVideo ? (
                                "FINISHED"
                            ) : (
                                "PLAYING"
                            )}
                        </div>

                        <div className={`${separator} h-8`}></div>

                        {/* Next Button (always an arrow, even on last video) */}
                        <div className="relative">
                            {showArrowHint && (
                                <span className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f97316] to-[#fcd34d] text-[11px] font-semibold text-slate-900 shadow-lg whitespace-nowrap">
                                    Tap to play
                                </span>
                            )}
                            <button
                                onClick={isLastVideo ? handleRestart : handleNext}
                                disabled={isTransitioning}
                                className={`${btnArrow} ${isTransitioning ? btnArrowDisabled : ""} ${showArrowHint ? "animate-pulse ring-4 ring-[#fcd34d]/40" : ""}`}
                                aria-label="Play next video"
                            >
                                <ChevronRight className="w-7 h-7 text-[#f97316] drop-shadow-[0_2px_6px_rgba(252,211,77,0.5)]" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            )}
        </div>
        {showHouseHotspots && showZoneToolbar && (
            <div className="w-full bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center gap-2 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => setEditZones((v) => !v)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                    {editZones ? "Stop Edit" : "Edit Zones"}
                </button>
                <button
                    type="button"
                    onClick={addZone}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                    Add Zone
                </button>
                <button
                    type="button"
                    onClick={deleteSelectedZone}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-600/90 text-white border border-red-400 hover:bg-red-500"
                >
                    Delete Zone
                </button>
                <button
                    type="button"
                    onClick={logZones}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-600/90 text-white border border-emerald-400 hover:bg-emerald-500"
                >
                    Export Zones
                </button>
                <span className="text-[11px] text-white/70 ml-auto">
                    Selected: {selectedZoneId ?? "none"} | Click in video to add points
                </span>
            </div>
        )}
        </div>
    );
}
