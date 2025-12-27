import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import zonesData from "../data/final_zones.json";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    X,
    Loader2
} from "lucide-react";
import { detectConnectionQuality, getPreloadStrategy } from "../utils/connectionDetector";

export default function VideoPlayer({ videos = [] }) {
    const navigate = useNavigate();
    
    // Plan images - same as used in Plan pages
    const planImages = useMemo(() => ({
        // Type "a" (VP houses) - from Plan.jsx
        a: [
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986525/plan_rdc_villa_isolee_pyote8.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986610/plan_terrasse_villa_isolee_riz5mc.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986523/WhatsApp_Image_2025-12-17_at_15.49.21_krfpum.jpg"
        ],
        // Type "b" (VT houses) - from Planb.jsx
        b: [
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986532/rdc-villabande_pqwwts.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986531/1ER-villabande_zze0o3.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986533/terrase-villabande_dman5u.png"
        ]
    }), []);
    
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
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferingProgress, setBufferingProgress] = useState(0);
    const [loadedVideos, setLoadedVideos] = useState(new Set());
    const [connectionQuality, setConnectionQuality] = useState(null);
    const [editZones, setEditZones] = useState(false);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [draggingPoint, setDraggingPoint] = useState(null);
    const [draggingZone, setDraggingZone] = useState(null);
    const [hoveredZoneId, setHoveredZoneId] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);
    const [allowBackgroundPreload, setAllowBackgroundPreload] = useState(false);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const popupHideTimeoutRef = useRef(null);
    const [videoCurrentTime, setVideoCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [showMobileIndicator, setShowMobileIndicator] = useState(false);

    const v0 = useRef(null);
    const v1 = useRef(null);
    const videoContainerRef = useRef(null);
    const preloadedVideosRef = useRef(new Map());
    const hotspotOverlayRef = useRef(null);
    const importInputRef = useRef(null);
    const bufferingTimeoutRef = useRef(null);
    
    // Swipe gesture handlers for mobile
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const minSwipeDistance = 50; // Minimum distance for a swipe (px)

    ///const INTERIOR_VIDEO = "https://res.cloudinary.com/dzbmwlwra/video/upload/f_auto,q_auto,vc_auto/v1762343546/1105_pyem6p.mp4";
    const BASE_WIDTH = zonesData.baseWidth || 1920;
    const BASE_HEIGHT = zonesData.baseHeight || 1080;
    const [zonesByVideo, setZonesByVideo] = useState(() => {
        const raw = zonesData.videos || {};
        const normalized = {};
        Object.keys(raw).forEach((key) => {
            const zones = (raw[key]?.zones || []).map((zone) => ({
                ...zone,
                visible: zone.visible !== false
            }));
            normalized[key] = { zones };
        });
        return normalized;
    });
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const showZoneToolbar = false;
    
    // Zone visibility threshold: show zones only in the last 0.5 seconds of video
    const ZONE_END_THRESHOLD_SECONDS = 0.5;

    const clearBufferingTimeout = () => {
        if (bufferingTimeoutRef.current) {
            clearTimeout(bufferingTimeoutRef.current);
            bufferingTimeoutRef.current = null;
        }
    };

    const scheduleBufferingCheck = (videoEl) => {
        clearBufferingTimeout();
        setIsBuffering(false);
        if (!videoEl) return;
        bufferingTimeoutRef.current = setTimeout(() => {
            if (!videoEl || videoEl.readyState >= 3) return;
            setIsBuffering(true);
        }, 200);
    };

    const stopBufferingIndicator = () => {
        clearBufferingTimeout();
        setIsBuffering(false);
    };

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
    
    
    const handleDismissIndicator = () => {
        setShowMobileIndicator(false);
        localStorage.setItem('mobileZoneIndicatorDismissed', 'true');
    };

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
            scheduleBufferingCheck(v0.current);
            const strategy = connectionQuality
                ? getPreloadStrategy(connectionQuality)
                : { initialVideos: 1, preloadType: "metadata" };
            v0.current.src = videos[0].src;
            v0.current.muted = true;
            v0.current.playbackRate = 1.4;
            v0.current.preload = strategy.preloadType;

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
            v0.current.addEventListener('canplay', () => stopBufferingIndicator());
            v0.current.addEventListener('waiting', () => setIsBuffering(true));
            v0.current.addEventListener('playing', () => stopBufferingIndicator());

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
            if (videos.length > 1 && v1.current && strategy.initialVideos >= 2) {
                v1.current.src = videos[1].src;
                v1.current.muted = true;
                v1.current.playbackRate = 1.4;
                v1.current.preload = strategy.preloadType;
                v1.current.load();
                setLoadedVideos(prev => new Set([...prev, 1]));
            }
        }
    }, [videos, isInitialized, connectionQuality]);

    useEffect(() => {
        if (!isInitialized) return;
        const timeoutId = setTimeout(() => {
            setAllowBackgroundPreload(true);
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [isInitialized]);

    // Track video time for zone visibility
    useEffect(() => {
        const activeVideo = activeLayer === 0 ? v0.current : v1.current;
        if (!activeVideo) return;

        const updateTime = () => {
            if (activeVideo) {
                setVideoCurrentTime(activeVideo.currentTime || 0);
                setVideoDuration(activeVideo.duration || 0);
            }
        };

        // Update on timeupdate event
        activeVideo.addEventListener('timeupdate', updateTime);
        // Update on loadedmetadata to get duration
        activeVideo.addEventListener('loadedmetadata', updateTime);
        // Initial update
        updateTime();

        return () => {
            activeVideo.removeEventListener('timeupdate', updateTime);
            activeVideo.removeEventListener('loadedmetadata', updateTime);
        };
    }, [activeLayer, current, isInitialized]);

    // Progressive preloading - only load videos when needed or on fast connections
    useEffect(() => {
        if (!allowBackgroundPreload) return;
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
        scheduleBufferingCheck(activeLayer === 0 ? v1.current : v0.current);

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
                showEl.addEventListener('canplay', () => stopBufferingIndicator());
                showEl.addEventListener('waiting', () => setIsBuffering(true));
                showEl.addEventListener('playing', () => stopBufferingIndicator());

                showEl.play().catch(() => {
                    if (showEl) {
                        showEl.muted = !isInteriorVideo;
                        showEl.playbackRate = 1.4;
                        showEl.play();
                    }
                });

                const swapLayers = () => {
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
                };

                showEl.addEventListener("playing", swapLayers, { once: true });

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
                            stopBufferingIndicator();
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

    // Swipe gesture handlers
    const onTouchStart = (e) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isRightSwipe) {
            // Swipe right = next video
            handleNext();
            setShowSwipeHint(false);
        } else if (isLeftSwipe) {
            // Swipe left = previous video
            handlePrev();
            setShowSwipeHint(false);
        }

        // Reset touch values
        touchStartX.current = null;
        touchEndX.current = null;
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
    const currentVideoKey = useMemo(() => {
        if (!currentVideoSrc) return "unknown";
        const clean = currentVideoSrc.split("?")[0];
        const parts = clean.split("/");
        return parts[parts.length - 1] || "unknown";
    }, [currentVideoSrc]);
    const currentZones = zonesByVideo[currentVideoKey]?.zones || [];
    const showHouseHotspots = true;
    const hoveredZone = currentZones.find((zone) => zone.id === hoveredZoneId);
    
    // Determine house type from label (VT = type "b", VP = type "a")
    const getHouseType = (label) => {
        if (!label) return null;
        const upperLabel = label.toUpperCase().trim();
        if (upperLabel.startsWith("VT")) return "b";
        if (upperLabel.startsWith("VP")) return "a";
        return null;
    };
    
    // Get plan image and navigation path for hovered zone
    const houseType = hoveredZone ? getHouseType(hoveredZone.label) : null;
    const planImage = houseType ? planImages[houseType]?.[0] : null;
    const planPath = houseType === "a" ? "/plan" : houseType === "b" ? "/planb" : null;
    
    const handlePlanClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Lock popup before navigating
        setIsPopupHovered(true);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
        if (planPath) {
            navigate(planPath);
        }
    };
    
    // Handle popup hover/click to keep it visible
    const handlePopupEnter = () => {
        setIsPopupHovered(true);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
    };
    
    const handlePopupLeave = () => {
        // Only unlock if user actually leaves (not just moving mouse)
        const timeout = setTimeout(() => {
            setIsPopupHovered(false);
            setHoveredZoneId(null);
        }, 500);
        popupHideTimeoutRef.current = timeout;
    };
    
    const handlePopupClick = (e) => {
        e.stopPropagation();
        // Lock popup when clicked/tapped
        setIsPopupHovered(true);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
    };
    
    const handleClosePopup = (e) => {
        e.stopPropagation();
        setIsPopupHovered(false);
        setHoveredZoneId(null);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
    };
    
    const handleZoneClick = (e, zoneId) => {
        if (editZones) return;
        e.stopPropagation();
        // On mobile, set hovered zone and lock popup immediately
        if (isMobile) {
            setHoveredZoneId(zoneId);
            setIsPopupHovered(true);
            // Get touch position for popup placement
            const rect = getOverlayRect();
            if (rect && e.touches && e.touches[0]) {
                setHoverPosition({
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                });
            } else if (rect && e.clientX) {
                setHoverPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
            if (popupHideTimeoutRef.current) {
                clearTimeout(popupHideTimeoutRef.current);
                popupHideTimeoutRef.current = null;
            }
        } else {
            // Desktop: Lock popup when clicking on the zone
            if (hoveredZoneId === zoneId) {
                setIsPopupHovered(true);
                if (popupHideTimeoutRef.current) {
                    clearTimeout(popupHideTimeoutRef.current);
                    popupHideTimeoutRef.current = null;
                }
            }
        }
    };
    
    const handleZoneTouchStart = (e, zoneId) => {
        if (editZones || !isMobile) return;
        e.stopPropagation();
        // Set hovered zone and show popup
        setHoveredZoneId(zoneId);
        setIsPopupHovered(true);
        
        // Get touch position for popup placement
        const rect = getOverlayRect();
        if (rect && e.touches && e.touches[0]) {
            setHoverPosition({
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            });
        }
        
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
    };
    
    // Calculate if video is at the end (for zone visibility)
    const isVideoAtEnd = useMemo(() => {
        if (!videoDuration || videoDuration === 0) return false;
        if (editZones) return true; // Always show zones in edit mode
        
        const timeRemaining = videoDuration - videoCurrentTime;
        
        // Show zones only in the last 0.5 seconds
        return timeRemaining <= ZONE_END_THRESHOLD_SECONDS;
    }, [videoCurrentTime, videoDuration, editZones]);
    
    // Show indicator when video reaches end on mobile (must be after currentZones and isVideoAtEnd are defined)
    useEffect(() => {
        if (!isMobile || editZones) {
            setShowMobileIndicator(false);
            return;
        }
        
        // Check if zones are available and video is at end
        const hasZones = currentZones && currentZones.length > 0;
        if (hasZones && isVideoAtEnd) {
            const indicatorDismissed = localStorage.getItem('mobileZoneIndicatorDismissed');
            if (!indicatorDismissed) {
                setShowMobileIndicator(true);
            } else {
                setShowMobileIndicator(false);
            }
        } else {
            setShowMobileIndicator(false);
        }
    }, [isMobile, currentZones, isVideoAtEnd, editZones, currentVideoKey]);
    

    useEffect(() => {
        console.log("[VideoPlayer] current video id:", currentVideoId, "key:", currentVideoKey);
    }, [currentVideoId, currentVideoKey]);

    useEffect(() => {
        setSelectedZoneId(null);
        setHoveredZoneId(null);
    }, [currentVideoKey]);

    useEffect(() => {
        if (!hoveredZoneId || editZones) {
            setHoverPosition(null);
            setIsPopupHovered(false);
        }
    }, [hoveredZoneId, editZones]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (popupHideTimeoutRef.current) {
                clearTimeout(popupHideTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle("edit-zones", editZones);
        return () => document.body.classList.remove("edit-zones");
    }, [editZones]);

    const getOverlayRect = () => hotspotOverlayRef.current?.getBoundingClientRect() || null;

    const getBasePointFromEvent = (event) => {
        const rect = getOverlayRect();
        if (!rect) return null;
        const baseX = ((event.clientX - rect.left) / rect.width) * BASE_WIDTH;
        const baseY = ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT;
        return { x: Math.round(baseX), y: Math.round(baseY) };
    };

    const handleOverlayClick = (event) => {
        // On mobile, close popup if clicking outside
        if (isMobile && !editZones && isPopupHovered) {
            const targetTag = event.target?.tagName?.toLowerCase();
            if (targetTag !== "polygon" && targetTag !== "polyline" && targetTag !== "circle" && targetTag !== "svg" && targetTag !== "g") {
                // Clicked outside zone, close popup
                handleClosePopup(event);
                return;
            }
        }
        
        if (!editZones || selectedZoneId == null) return;
        const targetTag = event.target?.tagName?.toLowerCase();
        if (targetTag === "polygon" || targetTag === "polyline" || targetTag === "circle") {
            return;
        }
        const basePoint = getBasePointFromEvent(event);
        if (!basePoint) return;
        setZonesByVideo((prev) => {
            const next = { ...prev };
            const currentList = next[currentVideoKey]?.zones || [];
            const updated = currentList.map((zone) => {
                if (zone.id !== selectedZoneId) return zone;
                return { ...zone, points: [...zone.points, basePoint] };
            });
            next[currentVideoKey] = { zones: updated };
            return next;
        });
    };

    const handlePointPointerDown = (event, zoneId, pointIndex) => {
        if (!editZones) return;
        event.stopPropagation();
        if (zoneId !== selectedZoneId) {
            setSelectedZoneId(zoneId);
            return;
        }
        if (event.altKey) {
            setZonesByVideo((prev) => {
                const next = { ...prev };
                const currentList = next[currentVideoKey]?.zones || [];
                const updated = currentList.map((zone) => {
                    if (zone.id !== zoneId) return zone;
                    return {
                        ...zone,
                        points: zone.points.filter((_, idx) => idx !== pointIndex)
                    };
                });
                next[currentVideoKey] = { zones: updated };
                return next;
            });
            return;
        }
        setDraggingPoint({ zoneId, pointIndex });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleZonePointerDown = (event, zone) => {
        if (!editZones) return;
        event.stopPropagation();
        setSelectedZoneId(zone.id);
        const startPoint = getBasePointFromEvent(event);
        if (!startPoint) return;
        setDraggingZone({
            zoneId: zone.id,
            startPoint,
            startPoints: zone.points.map((pt) => ({ ...pt }))
        });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleOverlayPointerMove = (event) => {
        if (!editZones && hoveredZoneId && !isPopupHovered && !isMobile) {
            const rect = getOverlayRect();
            if (rect) {
                setHoverPosition({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                });
            }
        }
    };
    
    const handleOverlayTouchMove = (event) => {
        if (!editZones && hoveredZoneId && isMobile && event.touches && event.touches[0]) {
            const rect = getOverlayRect();
            if (rect) {
                setHoverPosition({
                    x: event.touches[0].clientX - rect.left,
                    y: event.touches[0].clientY - rect.top
                });
            }
        }
        if (!editZones || (!draggingPoint && !draggingZone)) return;
        const basePoint = getBasePointFromEvent(event);
        if (!basePoint) return;

        setZonesByVideo((prev) => {
            const next = { ...prev };
            const currentList = next[currentVideoKey]?.zones || [];
            const updated = currentList.map((zone) => {
                if (draggingPoint && zone.id === draggingPoint.zoneId) {
                    const nextPoints = zone.points.map((pt, idx) => {
                        if (idx !== draggingPoint.pointIndex) return pt;
                        return {
                            x: clamp(basePoint.x, 0, BASE_WIDTH),
                            y: clamp(basePoint.y, 0, BASE_HEIGHT)
                        };
                    });
                    return { ...zone, points: nextPoints };
                }
                if (draggingZone && zone.id === draggingZone.zoneId) {
                    const deltaX = basePoint.x - draggingZone.startPoint.x;
                    const deltaY = basePoint.y - draggingZone.startPoint.y;
                    const nextPoints = draggingZone.startPoints.map((pt) => ({
                        x: clamp(pt.x + deltaX, 0, BASE_WIDTH),
                        y: clamp(pt.y + deltaY, 0, BASE_HEIGHT)
                    }));
                    return { ...zone, points: nextPoints };
                }
                return zone;
            });
            next[currentVideoKey] = { zones: updated };
            return next;
        });
    };

    const handleOverlayPointerUp = (event) => {
        if (!editZones || (!draggingPoint && !draggingZone)) return;
        setDraggingPoint(null);
        setDraggingZone(null);
        try {
            event.target.releasePointerCapture?.(event.pointerId);
        } catch {
            // Ignore if pointer capture isn't set on this target
        }
    };

    const addZone = () => {
        const nextId = currentZones.length > 0 ? Math.max(...currentZones.map((z) => z.id)) + 1 : 1;
        const newZone = {
            id: nextId,
            label: `Zone ${nextId}`,
            points: []
        };
        setZonesByVideo((prev) => {
            const next = { ...prev };
            const currentList = next[currentVideoKey]?.zones || [];
            next[currentVideoKey] = { zones: [...currentList, newZone] };
            return next;
        });
        setSelectedZoneId(nextId);
    };

    const deleteSelectedZone = () => {
        if (selectedZoneId == null) return;
        setZonesByVideo((prev) => {
            const next = { ...prev };
            const currentList = next[currentVideoKey]?.zones || [];
            next[currentVideoKey] = { zones: currentList.filter((zone) => zone.id !== selectedZoneId) };
            return next;
        });
        setSelectedZoneId(null);
    };

    const logZones = () => {
        console.log("[VideoPlayer] zones:", {
            baseWidth: BASE_WIDTH,
            baseHeight: BASE_HEIGHT,
            videos: zonesByVideo
        });
    };

    const handleImportZones = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const raw = parsed?.videos || {};
                const normalized = {};
                Object.keys(raw).forEach((key) => {
                    const zones = (raw[key]?.zones || []).map((zone) => ({
                        ...zone,
                        visible: zone.visible !== false
                    }));
                    normalized[key] = { zones };
                });
                setZonesByVideo(normalized);
                setSelectedZoneId(null);
                setHoveredZoneId(null);
            } catch (err) {
                console.error("[VideoPlayer] Failed to import zones:", err);
            }
        };
        reader.readAsText(file);
    };

    const downloadZones = () => {
        const payload = {
            baseWidth: BASE_WIDTH,
            baseHeight: BASE_HEIGHT,
            videos: zonesByVideo
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "zones.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
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

    // Subtle parallax scroll effect for video container (only when not in fullscreen)
    // This ensures video controls and interactions remain unchanged
    const { scrollYProgress } = useScroll({
        offset: ["start start", "end start"]
    });
    
    // Very subtle parallax - only apply when not in mobile fullscreen to preserve all interactions
    const y = useTransform(scrollYProgress, [0, 1], ["0%", isMobileFullscreen ? "0%" : "15%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, isMobileFullscreen ? 1 : 0.95]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, isMobileFullscreen ? 1 : 1.02]);

    return (
        <div className="w-full bg-black">
        <motion.div 
            ref={videoContainerRef}
            style={{ 
                y: isMobileFullscreen ? 0 : y, 
                opacity: isMobileFullscreen ? 1 : opacity, 
                scale: isMobileFullscreen ? 1 : scale 
            }}
            className={`relative w-full bg-black overflow-hidden select-none font-sans ${
                isMobile && !isMobileFullscreen ? 'h-[60vh] md:h-screen' : 'h-screen'
            }`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
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

            {/* Swipe Hint Indicator - shown on mobile (hides after first swipe) */}
            {isMobile && showSwipeHint && (
                <div className="absolute bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/30 animate-pulse shadow-lg">
                        <ChevronLeft className="w-4 h-4 text-white animate-pulse" />
                        <span className="text-xs font-bold text-white tracking-wider uppercase">Swipe to navigate</span>
                        <ChevronRight className="w-4 h-4 text-white animate-pulse" />
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
                {/* Primary video layer - brightness filter removed */}
                <video 
                    ref={v0} 
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                    playsInline 
                    muted={!isInterior} 
                    autoPlay 
                    preload="auto"
                />
                {/* Secondary video layer for transitions - brightness filter removed */}
                <video 
                    ref={v1} 
                    className="absolute inset-0 w-full h-full object-cover opacity-0"
                    playsInline 
                    muted={!isInterior} 
                    autoPlay 
                    preload="auto"
                />
            </div>

            {showHouseHotspots && (isVideoAtEnd || editZones) && (
                <div
                    ref={hotspotOverlayRef}
                    className={`absolute inset-0 z-30 ${editZones ? "cursor-crosshair" : ""}`}
                    onClick={handleOverlayClick}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    onTouchMove={handleOverlayTouchMove}
                >
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
                        preserveAspectRatio="none"
                    >
                        {currentZones.map((zone) => {
                            const isSelected = zone.id === selectedZoneId;
                            const isHovered = zone.id === hoveredZoneId;
                            const showHoverOnly = !editZones;
                            const pointList = zone.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
                            if (zone.visible === false) {
                                return null;
                            }
                            return (
                                <g key={zone.id}>
                                    {zone.points.length >= 3 ? (
                                        <polygon
                                            points={pointList}
                                            pointerEvents={showHoverOnly || isMobile ? "all" : "visiblePainted"}
                                            fill={
                                                showHoverOnly || isMobile
                                                    ? isHovered
                                                        ? "rgba(30,64,175,0.35)"
                                                        : "rgba(16,185,129,0)"
                                                    : isSelected
                                                        ? "rgba(139,92,246,0.28)"
                                                        : isHovered
                                                            ? "rgba(30,64,175,0.35)"
                                                            : "rgba(16,185,129,0.12)"
                                            }
                                            stroke={
                                                showHoverOnly || isMobile
                                                    ? isHovered
                                                        ? "rgba(30,64,175,0.9)"
                                                        : "rgba(16,185,129,0)"
                                                    : isSelected
                                                        ? "rgba(139,92,246,0.95)"
                                                        : isHovered
                                                            ? "rgba(30,64,175,0.9)"
                                                            : "rgba(16,185,129,0.5)"
                                            }
                                            strokeWidth={isSelected || isHovered ? 4 : 2}
                                            onPointerDown={(event) => handleZonePointerDown(event, zone)}
                                        onClick={(e) => handleZoneClick(e, zone.id)}
                                        onTouchStart={(e) => handleZoneTouchStart(e, zone.id)}
                                        onPointerEnter={() => {
                                            if (!isMobile && !isPopupHovered) {
                                                setHoveredZoneId(zone.id);
                                            }
                                        }}
                                        onPointerLeave={() => {
                                            // Don't hide on mobile or if popup is locked
                                            if (!isMobile && !isPopupHovered) {
                                                setHoveredZoneId(null);
                                            }
                                        }}
                                        />
                                    ) : (
                                        <polyline
                                            points={pointList}
                                            fill="none"
                                            pointerEvents={showHoverOnly || isMobile ? "all" : "visiblePainted"}
                                            stroke={
                                                showHoverOnly || isMobile
                                                    ? isHovered
                                                        ? "rgba(30,64,175,0.9)"
                                                        : "rgba(16,185,129,0)"
                                                    : isSelected
                                                        ? "rgba(139,92,246,0.95)"
                                                        : isHovered
                                                            ? "rgba(30,64,175,0.9)"
                                                            : "rgba(16,185,129,0.5)"
                                            }
                                            strokeWidth={isSelected || isHovered ? 4 : 2}
                                            onPointerDown={(event) => handleZonePointerDown(event, zone)}
                                            onClick={(e) => handleZoneClick(e, zone.id)}
                                            onTouchStart={(e) => handleZoneTouchStart(e, zone.id)}
                                            onPointerEnter={() => {
                                                if (!isMobile && !isPopupHovered) {
                                                    setHoveredZoneId(zone.id);
                                                }
                                            }}
                                            onPointerLeave={() => {
                                                // Don't hide on mobile or if popup is locked
                                                if (!isMobile && !isPopupHovered) {
                                                    setHoveredZoneId(null);
                                                }
                                            }}
                                        />
                                    )}
                                    {editZones && isSelected &&
                                        zone.points.map((pt, idx) => (
                                            <circle
                                                key={`${zone.id}-${idx}`}
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={3}
                                                fill={isSelected ? "#8b5cf6" : "#10b981"}
                                                stroke={isSelected ? "#4c1d95" : "#064e3b"}
                                                strokeWidth={2}
                                                onPointerDown={(event) => handlePointPointerDown(event, zone.id, idx)}
                                            />
                                        ))}
                                </g>
                            );
                        })}
                    </svg>

                    {!editZones && hoveredZone && hoveredZone.label && (hoverPosition || isPopupHovered) && (
                        <div
                            className="absolute z-40 pointer-events-auto"
                            style={{
                                left: isMobile 
                                    ? (() => {
                                        const popupWidth = Math.min(350, window.innerWidth - 32);
                                        const leftPos = (hoverPosition?.x || 0) + 16;
                                        return Math.min(Math.max(leftPos, 16), window.innerWidth - popupWidth - 16);
                                    })()
                                    : (() => {
                                        const popupWidth = 350;
                                        const leftPos = (hoverPosition?.x || 0) + 16;
                                        if (leftPos + popupWidth > window.innerWidth - 16) {
                                            return window.innerWidth - popupWidth - 16;
                                        }
                                        return Math.max(leftPos, 16);
                                    })(),
                                top: isMobile
                                    ? Math.max((hoverPosition?.y || 0) - 8, 10)
                                    : (() => {
                                        const topPos = (hoverPosition?.y || 0) - 8;
                                        const popupHeight = 400;
                                        if (topPos + popupHeight > window.innerHeight - 16) {
                                            return window.innerHeight - popupHeight - 16;
                                        }
                                        return Math.max(topPos, 10);
                                    })(),
                                transform: isMobile && (hoverPosition?.y || 0) < 200 ? 'translateY(0)' : 'translateY(-100%)',
                                maxWidth: isMobile ? 'calc(100vw - 32px)' : '350px'
                            }}
                            onMouseEnter={handlePopupEnter}
                            onMouseLeave={handlePopupLeave}
                            onClick={handlePopupClick}
                            onTouchStart={handlePopupClick}
                        >
                            {/* Popup Container with modern design */}
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="relative"
                            >
                                {/* Arrow pointer */}
                                <div className="absolute bottom-0 left-8 transform translate-y-full">
                                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#1e293b]/95"></div>
                                </div>
                                
                                {/* Main popup card */}
                                <div className="relative rounded-2xl border border-[#fcd34d]/30 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                                    {/* Close button for mobile */}
                                    {isMobile && (
                                        <button
                                            onClick={handleClosePopup}
                                            className="absolute top-3 right-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition text-base font-bold"
                                            aria-label="Close"
                                        >
                                            ×
                                        </button>
                                    )}
                                    {/* Decorative gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#fcd34d]/10 via-transparent to-[#f97316]/10 pointer-events-none"></div>
                                    
                                    {/* Plan Image Section - Clickable */}
                                    {planImage && (
                                        <div 
                                            onClick={handlePlanClick}
                                            className="relative w-full bg-slate-800/50 cursor-pointer group overflow-hidden flex items-center justify-center"
                                            style={{ height: '190px', minHeight: '190px' }}
                                        >
                                            <img 
                                                src={planImage} 
                                                alt="Floor Plan"
                                                className="max-w-full max-h-full object-contain transition-transform duration-300"
                                                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="bg-[#fcd34d]/90 text-slate-900 text-[13px] font-bold px-4 py-1.5 rounded-full border border-[#fcd34d] tracking-wider uppercase">
                                                    View Plan
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Content container */}
                                    <div className="relative px-7 py-5 min-w-[260px]">
                                        {/* Header section */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#fcd34d] animate-pulse"></div>
                                            <div className="text-[13px] uppercase tracking-widest text-[#fcd34d]/80 font-bold">
                                                Maison
                                            </div>
                                        </div>
                                        
                                        {/* House label/name */}
                                        <div className="text-xl font-bold text-white mb-2 tracking-tight">
                                            {hoveredZone.label}
                                        </div>
                                        
                                        {/* Additional info section */}
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="text-sm text-white/70">
                                                {planImage && (
                                                    <div className="text-[#fcd34d]/80 font-medium">
                                                        Click plan to view details
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom accent line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#fcd34d]/50 to-transparent"></div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {editZones && (
                        <div className="absolute top-4 right-4 z-40 rounded-2xl bg-black/60 text-white text-[11px] px-3 py-2 border border-white/10">
                            Zones editor visible below
                        </div>
                    )}
                    
                </div>
            )}
            
            {/* Mobile Indicator - Click to see house details (outside hotspot overlay for proper z-index) */}
            {isMobile && showMobileIndicator && !editZones && isVideoAtEnd && currentZones && currentZones.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto w-full px-4"
                    style={{ maxWidth: '100vw' }}
                >
                    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-[#fcd34d]/30 rounded-2xl shadow-2xl px-4 py-3 max-w-[90vw] mx-auto">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex-1">
                                <p className="text-white text-sm font-semibold mb-1">
                                    Click a house to see more details
                                </p>
                                <p className="text-white/70 text-xs">
                                    Tap on any house area to view floor plans
                                </p>
                            </div>
                            <button
                                onClick={handleDismissIndicator}
                                className="px-4 py-2 bg-[#fcd34d] text-slate-900 font-bold text-xs rounded-lg hover:bg-[#fbbf24] active:bg-[#f59e0b] transition-colors whitespace-nowrap w-full sm:w-auto"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </motion.div>
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

            {/* --- CONTROLS --- (hidden on mobile, only shown on desktop) */}
            {!isMobile && (
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
        </motion.div>
        {showHouseHotspots && showZoneToolbar && (
            <div className="w-full bg-slate-900 text-white border-t border-white/10">
                <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setEditZones((v) => !v)}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                    {editZones ? "Stop Edit" : "Edit Zones"}
                </button>
                <button
                    type="button"
                    onClick={addZone}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                    Add Zone
                </button>
                <button
                    type="button"
                    onClick={deleteSelectedZone}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-600/90 text-white border border-red-400 hover:bg-red-500"
                >
                    Delete Zone
                </button>
                <button
                    type="button"
                    onClick={logZones}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-600/90 text-white border border-emerald-400 hover:bg-emerald-500"
                >
                    Log Zones
                </button>
                <button
                    type="button"
                    onClick={downloadZones}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-700/90 text-white border border-blue-500 hover:bg-blue-600"
                >
                    Save JSON
                </button>
                <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                    Import JSON
                </button>
                <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleImportZones}
                    className="hidden"
                />
                <span className="text-[11px] text-white/70 ml-auto">
                    Selected: {selectedZoneId ?? "none"} | Click in video to add points
                </span>
            </div>
                {editZones && (
                    <div className="px-4 pb-4">
                        <div className="max-h-[260px] overflow-auto rounded-xl bg-black/50 text-white text-[11px] px-3 py-2 border border-white/10">
                            <div className="font-bold tracking-wider mb-2">Zones (px @ 1920x1080)</div>
                            {currentZones.map((zone) => (
                                <div
                                    key={zone.id}
                                    className={`font-mono mb-2 rounded-lg px-2 py-1 ${selectedZoneId === zone.id ? "bg-violet-900/40 border border-violet-400/50" : ""}`}
                                    onClick={() => setSelectedZoneId(zone.id)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setZonesByVideo((prev) => {
                                                    const next = { ...prev };
                                                    const currentList = next[currentVideoKey]?.zones || [];
                                                    const updated = currentList.map((z) =>
                                                        z.id === zone.id ? { ...z, visible: !z.visible } : z
                                                    );
                                                    next[currentVideoKey] = { zones: updated };
                                                    return next;
                                                });
                                            }}
                                            className="zone-editor-button w-6 h-6 rounded bg-white/10 border border-white/10 text-[10px] flex items-center justify-center"
                                            title={zone.visible === false ? "Show zone" : "Hide zone"}
                                        >
                                            {zone.visible === false ? "H" : "V"}
                                        </button>
                                        <span>ID: {zone.id}</span>
                                        <input
                                            value={zone.label || ""}
                                            onChange={(event) => {
                                                const nextLabel = event.target.value;
                                                setZonesByVideo((prev) => {
                                                    const next = { ...prev };
                                                    const currentList = next[currentVideoKey]?.zones || [];
                                                    const updated = currentList.map((z) =>
                                                        z.id === zone.id ? { ...z, label: nextLabel } : z
                                                    );
                                                    next[currentVideoKey] = { zones: updated };
                                                    return next;
                                                });
                                            }}
                                            className="bg-white/10 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white w-32"
                                            placeholder="Label"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setZonesByVideo((prev) => {
                                                    const next = { ...prev };
                                                    const currentList = next[currentVideoKey]?.zones || [];
                                                    next[currentVideoKey] = {
                                                        zones: currentList.filter((z) => z.id !== zone.id)
                                                    };
                                                    return next;
                                                });
                                                if (selectedZoneId === zone.id) {
                                                    setSelectedZoneId(null);
                                                }
                                            }}
                                            className="zone-editor-button w-6 h-6 rounded bg-red-600/80 border border-red-400 text-[10px] flex items-center justify-center"
                                            title="Delete zone"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    {zone.points.map((pt, idx) => (
                                        <div key={`${zone.id}-pt-${idx}`}>
                                            {idx + 1}: x={pt.x} y={pt.y}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        </div>
    );
}
