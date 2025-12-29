import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import zonesData from "../data/final_zones.json";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    X,
    Loader2,
    Sun,
    Moon,
    ChevronDown
} from "lucide-react";
import { detectConnectionQuality, getPreloadStrategy } from "../utils/connectionDetector";

export default function VideoPlayer({ videos = [] }) {
    const navigate = useNavigate();

    // Plan images
    const planImages = useMemo(() => ({
        a: [
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986525/plan_rdc_villa_isolee_pyote8.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986610/plan_terrasse_villa_isolee_riz5mc.png",
            "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986523/WhatsApp_Image_2025-12-17_at_15.49.21_krfpum.jpg"
        ],
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
    const [houses, setHouses] = useState([]);

    // New state for the UI toggle
    const [hideOverlay, setHideOverlay] = useState(false);

    const v0 = useRef(null);
    const v1 = useRef(null);
    const videoContainerRef = useRef(null);
    const preloadedVideosRef = useRef(new Map());
    const hotspotOverlayRef = useRef(null);
    const importInputRef = useRef(null);
    const bufferingTimeoutRef = useRef(null);

    // Swipe gesture handlers
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const minSwipeDistance = 50;

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
        // Increased to 500ms to prevent showing buffering indicator for tiny hiccups
        bufferingTimeoutRef.current = setTimeout(() => {
            if (!videoEl || videoEl.readyState >= 3) return;
            setIsBuffering(true);
        }, 500);
    };

    const stopBufferingIndicator = () => {
        clearBufferingTimeout();
        setIsBuffering(false);
    };

    // Detect mobile & connection
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(isMobileDevice);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        const quality = detectConnectionQuality();
        setConnectionQuality(quality);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch houses
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE || "";
        const fetchHouses = async () => {
            try {
                const response = await axios.get(`${apiBase}/api/houses`);
                setHouses(response.data);
            } catch (error) {
                console.error("Error fetching houses:", error);
            }
        };
        fetchHouses();
    }, []);

    const handleDismissIndicator = () => {
        setShowMobileIndicator(false);
        localStorage.setItem('mobileZoneIndicatorDismissed', 'true');
    };

    const preloadVideo = (videoSrc, index) => {
        if (preloadedVideosRef.current.has(videoSrc)) return;

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

    // --- INITIALIZE PLAYER ---
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

    useEffect(() => {
        const activeVideo = activeLayer === 0 ? v0.current : v1.current;
        if (!activeVideo) return;

        const updateTime = () => {
            if (activeVideo) {
                setVideoCurrentTime(activeVideo.currentTime || 0);
                setVideoDuration(activeVideo.duration || 0);
            }
        };

        activeVideo.addEventListener('timeupdate', updateTime);
        activeVideo.addEventListener('loadedmetadata', updateTime);
        updateTime();

        return () => {
            activeVideo.removeEventListener('timeupdate', updateTime);
            activeVideo.removeEventListener('loadedmetadata', updateTime);
        };
    }, [activeLayer, current, isInitialized]);

    useEffect(() => {
        if (!allowBackgroundPreload) return;
        if (videos.length > 2 && isInitialized && connectionQuality) {
            const strategy = getPreloadStrategy(connectionQuality);
            if (strategy.backgroundLoad) {
                videos.slice(2).forEach((video, index) => {
                    setTimeout(() => {
                        preloadVideo(video.src, index + 2);
                    }, (index + 1) * strategy.staggerDelay);
                });
            }
        }
    }, [videos, isInitialized, connectionQuality]);

    // --- VIDEO LOGIC ---
    const playVideo = (url, index, reversed = false, isInteriorVideo = false) => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        scheduleBufferingCheck(activeLayer === 0 ? v1.current : v0.current);

        const nextLayer = activeLayer === 0 ? 1 : 0;
        const showEl = nextLayer === 0 ? v0.current : v1.current;
        const hideEl = activeLayer === 0 ? v0.current : v1.current;

        if (showEl) {
            if (index + 1 < videos.length && !loadedVideos.has(index + 1)) {
                preloadVideo(videos[index + 1].src, index + 1);
            }

            const startPlaying = () => {
                showEl.currentTime = 0;
                showEl.playbackRate = 1.4;

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
                setIsTransitioning(false);
            };

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

                if (showEl.readyState >= 3) {
                    startPlaying();
                    showEl.removeEventListener("canplay", onCanPlay);
                } else {
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

    // --- HANDLERS ---
    const findVideoIndexById = (targetId) => {
        if (!videos || !videos.length) return -1;
        const normalizedId = Number(targetId);
        const matchById = videos.findIndex(v => Number(v.id) === normalizedId);
        if (matchById !== -1) return matchById;
        if (videos.length >= 5 && normalizedId === 5) return 4;
        if (videos.length > 1) return 1;
        return 0;
    };

    const playVideoById = (targetId) => {
        const targetIndex = findVideoIndexById(targetId);
        if (targetIndex < 0 || !videos[targetIndex]) return;
        setIsInterior(false);
        playVideo(videos[targetIndex].src, targetIndex, false);
    };

    const handleNext = () => {
        if (isTransitioning) return;
        markArrowHintSeen();

        const atLastVideo = current === videos.length - 1;
        if (atLastVideo) {
            playVideoById(2);
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
        if (isTransitioning) return;
        markArrowHintSeen();
        if (!isReversed && videos[current]?.reverse) {
            playVideo(videos[current].reverse, current, true);
        } else {
            const prevIndex = (current - 1 + videos.length) % videos.length;
            playVideo(videos[prevIndex].src, prevIndex, false);
        }
    };

    const handleRestart = () => {
        if (isTransitioning) return;
        markArrowHintSeen();
        playVideoById(2);
    };

    // Swipe handlers
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
            handleNext();
            setShowSwipeHint(false);
        } else if (isLeftSwipe) {
            handlePrev();
            setShowSwipeHint(false);
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const isIOS = useMemo(() => {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    }, []);

    const enterMobileFullscreen = async () => {
        setIsMobileFullscreen(true);
        const containerEl = videoContainerRef.current;
        const activeVideoEl = activeLayer === 0 ? v0.current : v1.current;
        const videoEl = activeVideoEl || v0.current;

        if (containerEl) {
            try {
                if (containerEl.requestFullscreen) await containerEl.requestFullscreen();
                else if (containerEl.webkitRequestFullscreen) await containerEl.webkitRequestFullscreen();
                else if (containerEl.msRequestFullscreen) await containerEl.msRequestFullscreen();
            } catch (err) { }
        }

        if (!isIOS) {
            try {
                if (videoEl?.webkitEnterFullscreen) videoEl.webkitEnterFullscreen();
            } catch (err) { }
        }

        if (screen.orientation && screen.orientation.lock) {
            try { await screen.orientation.lock('landscape'); } catch { }
        }
        videoEl?.play().catch(() => { });
    };

    const exitMobileFullscreen = async () => {
        setIsMobileFullscreen(false);
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
            else if (document.msExitFullscreen) await document.msExitFullscreen();
        } catch (err) { }

        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (err) { }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            if (!isFullscreen && isMobileFullscreen) setIsMobileFullscreen(false);
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
        if (showArrowHint) setShowArrowHint(false);
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
    // Only show zones if hideOverlay is false
    const showHouseHotspots = !hideOverlay;
    const hoveredZone = currentZones.find((zone) => zone.id === hoveredZoneId);

    const getHouseType = (label) => {
        if (!label) return null;
        const upperLabel = label.toUpperCase().trim();
        if (upperLabel.startsWith("VT")) return "b";
        if (upperLabel.startsWith("VP")) return "a";
        return null;
    };

    const houseType = hoveredZone ? getHouseType(hoveredZone.label) : null;
    const planImage = houseType ? planImages[houseType]?.[0] : null;
    const planPath = houseType === "a" ? "/plan" : houseType === "b" ? "/planb" : null;

    const getHouseIdFromLabel = (label) => {
        if (!label) return null;
        const match = label.match(/(VP|VT)\s*(\d+)/i);
        if (!match) return null;
        const prefix = match[1].toUpperCase();
        const number = parseInt(match[2]);
        if (prefix === "VP") return number >= 1 && number <= 22 ? number : null;
        else if (prefix === "VT") return number >= 1 && number <= 87 ? (22 + number) : null;
        return null;
    };

    const houseId = hoveredZone ? getHouseIdFromLabel(hoveredZone.label) : null;
    const houseState = useMemo(() => {
        if (!houseId || !houses.length) return null;
        const house = houses.find(h => h.id === houseId);
        return house ? house.state : null;
    }, [houseId, houses]);

    const isHouseActive = houseState === "actif";

    const handleInteriorVideo = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsPopupHovered(false);
        setHoveredZoneId(null);
        if (videos.length > 0 && videos[0]) {
            playVideo(videos[0].src, 0, false, true);
        }
    };

    const handleInquiry = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (houseId) {
            setIsPopupHovered(false);
            setHoveredZoneId(null);
            navigate(`/house/${houseId}`);
        }
    };

    const handlePlanClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsPopupHovered(true);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
        if (planPath) navigate(planPath);
    };

    const handlePopupEnter = () => {
        setIsPopupHovered(true);
        if (popupHideTimeoutRef.current) {
            clearTimeout(popupHideTimeoutRef.current);
            popupHideTimeoutRef.current = null;
        }
    };

    const handlePopupLeave = () => {
        const timeout = setTimeout(() => {
            setIsPopupHovered(false);
            setHoveredZoneId(null);
        }, 500);
        popupHideTimeoutRef.current = timeout;
    };

    const handlePopupClick = (e) => {
        e.stopPropagation();
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

        const clickedZone = currentZones.find(z => z.id === zoneId);
        if (clickedZone) {
            const clickedHouseId = getHouseIdFromLabel(clickedZone.label);
            const clickedHouse = houses.find(h => h.id === clickedHouseId);
            if (clickedHouse && clickedHouse.state !== "actif") return;
        }

        if (isMobile) {
            setHoveredZoneId(zoneId);
            setIsPopupHovered(true);
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

        const touchedZone = currentZones.find(z => z.id === zoneId);
        if (touchedZone) {
            const touchedHouseId = getHouseIdFromLabel(touchedZone.label);
            const touchedHouse = houses.find(h => h.id === touchedHouseId);
            if (touchedHouse && touchedHouse.state !== "actif") return;
        }

        setHoveredZoneId(zoneId);
        setIsPopupHovered(true);

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

    const isVideoAtEnd = useMemo(() => {
        if (!videoDuration || videoDuration === 0) return false;
        if (editZones) return true;
        return (videoDuration - videoCurrentTime) <= ZONE_END_THRESHOLD_SECONDS;
    }, [videoCurrentTime, videoDuration, editZones]);

    useEffect(() => {
        if (!isMobile || editZones) {
            setShowMobileIndicator(false);
            return;
        }
        const hasZones = currentZones && currentZones.length > 0;
        if (hasZones && isVideoAtEnd) {
            const indicatorDismissed = localStorage.getItem('mobileZoneIndicatorDismissed');
            if (!indicatorDismissed) setShowMobileIndicator(true);
            else setShowMobileIndicator(false);
        } else {
            setShowMobileIndicator(false);
        }
    }, [isMobile, currentZones, isVideoAtEnd, editZones, currentVideoKey]);

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

    useEffect(() => {
        return () => {
            if (popupHideTimeoutRef.current) clearTimeout(popupHideTimeoutRef.current);
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
        if (isMobile && !editZones && isPopupHovered) {
            const targetTag = event.target?.tagName?.toLowerCase();
            if (targetTag !== "polygon" && targetTag !== "polyline" && targetTag !== "circle" && targetTag !== "svg" && targetTag !== "g") {
                handleClosePopup(event);
                return;
            }
        }

        if (!editZones || selectedZoneId == null) return;
        const targetTag = event.target?.tagName?.toLowerCase();
        if (targetTag === "polygon" || targetTag === "polyline" || targetTag === "circle") return;
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
        } catch { }
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

    const { scrollYProgress } = useScroll({
        offset: ["start start", "end start"]
    });

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
                className={`relative w-full bg-black overflow-hidden select-none font-sans ${isMobile && !isMobileFullscreen ? 'h-[60vh] md:h-screen' : 'h-screen'
                    }`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >

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

                {isMobile && showSwipeHint && (
                    <div className="absolute bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/30 animate-pulse shadow-lg">
                            <ChevronLeft className="w-4 h-4 text-white animate-pulse" />
                            <span className="text-xs font-bold text-white tracking-wider uppercase">Swipe to navigate</span>
                            <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                        </div>
                    </div>
                )}

                {isMobile && isMobileFullscreen && (
                    <button
                        onClick={exitMobileFullscreen}
                        className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition"
                        aria-label="Close fullscreen"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
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
                                if (zone.visible === false) return null;

                                const zoneHouseId = getHouseIdFromLabel(zone.label);
                                const zoneHouse = houses.find(h => h.id === zoneHouseId);
                                const isZoneActive = zoneHouse ? zoneHouse.state === "actif" : true;

                                return (
                                    <g key={zone.id}>
                                        {zone.points.length >= 3 ? (
                                            <polygon
                                                points={pointList}
                                                pointerEvents={showHoverOnly || isMobile ? "all" : "visiblePainted"}
                                                style={{ cursor: !isZoneActive ? "not-allowed" : "pointer" }}
                                                fill={!isZoneActive && isHovered ? "rgba(220,38,38,0.35)" : showHoverOnly || isMobile ? isHovered ? "rgba(30,64,175,0.35)" : "rgba(16,185,129,0)" : isSelected ? "rgba(139,92,246,0.28)" : isHovered ? "rgba(30,64,175,0.35)" : "rgba(16,185,129,0.12)"}
                                                stroke={!isZoneActive && isHovered ? "rgba(220,38,38,0.9)" : showHoverOnly || isMobile ? isHovered ? "rgba(30,64,175,0.9)" : "rgba(16,185,129,0)" : isSelected ? "rgba(139,92,246,0.95)" : isHovered ? "rgba(30,64,175,0.9)" : "rgba(16,185,129,0.5)"}
                                                strokeWidth={isSelected || isHovered ? 4 : 2}
                                                onPointerDown={(event) => handleZonePointerDown(event, zone)}
                                                onClick={(e) => {
                                                    if (!isZoneActive) { e.stopPropagation(); return; }
                                                    handleZoneClick(e, zone.id);
                                                }}
                                                onTouchStart={(e) => {
                                                    if (!isZoneActive) { e.stopPropagation(); return; }
                                                    handleZoneTouchStart(e, zone.id);
                                                }}
                                                onPointerEnter={() => { if (!isMobile && !isPopupHovered) setHoveredZoneId(zone.id); }}
                                                onPointerLeave={() => { if (!isMobile && !isPopupHovered) setHoveredZoneId(null); }}
                                            />
                                        ) : (
                                            <polyline
                                                points={pointList}
                                                fill="none"
                                                pointerEvents={showHoverOnly || isMobile ? "all" : "visiblePainted"}
                                                style={{ cursor: !isZoneActive ? "not-allowed" : "pointer" }}
                                                stroke={!isZoneActive && isHovered ? "rgba(220,38,38,0.9)" : showHoverOnly || isMobile ? isHovered ? "rgba(30,64,175,0.9)" : "rgba(16,185,129,0)" : isSelected ? "rgba(139,92,246,0.95)" : isHovered ? "rgba(30,64,175,0.9)" : "rgba(16,185,129,0.5)"}
                                                strokeWidth={isSelected || isHovered ? 4 : 2}
                                                onPointerDown={(event) => handleZonePointerDown(event, zone)}
                                                onClick={(e) => {
                                                    if (!isZoneActive) { e.stopPropagation(); return; }
                                                    handleZoneClick(e, zone.id);
                                                }}
                                                onTouchStart={(e) => {
                                                    if (!isZoneActive) { e.stopPropagation(); return; }
                                                    handleZoneTouchStart(e, zone.id);
                                                }}
                                                onPointerEnter={() => { if (!isMobile && !isPopupHovered && isZoneActive) setHoveredZoneId(zone.id); }}
                                                onPointerLeave={() => { if (!isMobile && !isPopupHovered) setHoveredZoneId(null); }}
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

                        {!editZones && hoveredZone && hoveredZone.label && (hoverPosition || isPopupHovered) && isHouseActive && (
                            <div
                                className="absolute z-40 pointer-events-auto"
                                style={{
                                    left: (() => {
                                        const rect = getOverlayRect();
                                        if (!rect || !hoverPosition) return 16;
                                        const popupWidth = isMobile ? Math.min(350, rect.width - 32) : 350;
                                        const mouseX = hoverPosition.x;
                                        let leftPos = mouseX + 16;
                                        if (leftPos + popupWidth > rect.width - 16) leftPos = mouseX - popupWidth - 16;
                                        return Math.max(16, Math.min(leftPos, rect.width - popupWidth - 16));
                                    })(),
                                    top: (() => {
                                        const rect = getOverlayRect();
                                        if (!rect || !hoverPosition) return 16;
                                        const popupHeight = 400;
                                        const mouseY = hoverPosition.y;
                                        let topPos = mouseY + 16;
                                        if (topPos + popupHeight > rect.height - 16) topPos = mouseY - popupHeight - 16;
                                        return Math.max(16, Math.min(topPos, rect.height - popupHeight - 16));
                                    })(),
                                    maxWidth: isMobile ? 'calc(100vw - 32px)' : '350px'
                                }}
                                onMouseEnter={handlePopupEnter}
                                onMouseLeave={handlePopupLeave}
                                onClick={handlePopupClick}
                                onTouchStart={handlePopupClick}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="relative"
                                >
                                    <div className="absolute top-0 left-8 transform -translate-y-full">
                                        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#1e293b]/95"></div>
                                    </div>

                                    <div className="relative rounded-2xl border border-[#fcd34d]/30 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                                        {isMobile && (
                                            <button
                                                onClick={handleClosePopup}
                                                className="absolute top-3 right-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition text-base font-bold"
                                                aria-label="Close"
                                            >
                                                ×
                                            </button>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#fcd34d]/10 via-transparent to-[#f97316]/10 pointer-events-none"></div>

                                        <div className="relative px-7 py-5 min-w-[260px]">
                                            <div className="text-xl font-bold text-white mb-4 tracking-tight">
                                                {hoveredZone.label}
                                            </div>

                                            {planImage && (
                                                <div
                                                    className="relative w-full bg-slate-800/50 cursor-pointer group overflow-hidden flex items-center justify-center mb-4 rounded-lg"
                                                    style={{ height: '190px', minHeight: '190px' }}
                                                >
                                                    <img
                                                        src={planImage}
                                                        alt="Floor Plan"
                                                        className="max-w-full max-h-full object-contain transition-transform duration-300"
                                                        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                                                    <button
                                                        onClick={handlePlanClick}
                                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#fcd34d]/90 text-slate-900 text-[13px] font-bold px-4 py-2 rounded-full border border-[#fcd34d] tracking-wider uppercase hover:bg-[#fcd34d] hover:scale-105 transition-all z-10"
                                                    >
                                                        See Plan
                                                    </button>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleInteriorVideo}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-[#fcd34d] to-[#f97316] text-slate-900 font-bold text-sm rounded-lg hover:from-[#fbbf24] hover:to-[#fb923c] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                                >
                                                    <Play className="w-4 h-4" fill="currentColor" />
                                                    See Interior
                                                </button>

                                                {houseId && (
                                                    <button
                                                        onClick={handleInquiry}
                                                        className="w-full px-4 py-3 bg-slate-800 border-2 border-[#fcd34d]/50 text-[#fcd34d] font-bold text-sm rounded-lg hover:bg-slate-700 hover:border-[#fcd34d] transition-all duration-200 flex items-center justify-center gap-2"
                                                    >
                                                        Make a Request
                                                    </button>
                                                )}

                                                <div className="text-center pt-2">
                                                    <p className="text-xs text-white/60 italic">
                                                        Click the house to see details
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

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

                {/* --- NEW UI DESIGN CONTROLS (DESKTOP) --- */}
                {!isMobile && (
                    <>
                        {/* SETTINGS CONTROLS - Moved to Bottom Left */}
                        <div className="absolute bottom-8 left-8 flex flex-col-reverse gap-2 w-60 pointer-events-auto z-50">
                            {/* Row 4: Hide Overlay Toggle */}
                            <div className="bg-gray-100/95 backdrop-blur w-full rounded-lg p-3 flex justify-between items-center text-sm font-medium shadow-sm text-slate-700">
                                <span>Hide overlay</span>
                                <div
                                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${!hideOverlay ? 'bg-emerald-400' : 'bg-slate-300'}`}
                                    onClick={() => setHideOverlay(!hideOverlay)}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${!hideOverlay ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>

                            {/* Row 3: Layouts Button */}
                            <button className="bg-gray-100/95 backdrop-blur hover:bg-white w-full rounded-lg p-3 flex justify-start items-center text-sm font-medium shadow-sm text-slate-700 transition-colors">
                                Layouts
                            </button>

                            {/* Row 2: 360 Tour Dropdown */}
                            <button className="bg-gray-100/95 backdrop-blur hover:bg-white w-full rounded-lg p-3 flex justify-between items-center text-sm font-medium shadow-sm text-slate-700 transition-colors">
                                360 tour <ChevronDown size={16} />
                            </button>

                            {/* Row 1: Theme Toggle & Help */}
                            <div className="flex gap-2">
                                <div className="bg-white rounded-lg p-1 flex gap-1 shadow-md">
                                    <button className="p-2 hover:bg-gray-100 rounded-md text-slate-700">
                                        <Sun size={20} />
                                    </button>
                                    <button className="p-2 bg-slate-800 text-white rounded-md shadow-sm">
                                        <Moon size={20} />
                                    </button>
                                </div>
                                <button className="bg-white rounded-lg p-2.5 px-3 shadow-md text-slate-600 font-bold hover:bg-gray-50">
                                    ?
                                </button>
                            </div>
                        </div>

                        {/* NAVIGATION CONTROLS - Centered, Transparent, Bottom */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                            <div className="bg-transparent px-2 py-2 flex items-center gap-4">
                                {/* Previous Button */}
                                <button
                                    onClick={handlePrev}
                                    disabled={(current === 0 && !isReversed) || isTransitioning}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    <ChevronLeft size={24} className="text-black" strokeWidth={2} />
                                </button>

                                {/* Status Text - Added Drop Shadow for visibility on transparent bg */}
                                <span className="text-white font-medium text-lg px-2 drop-shadow-md text-shadow-sm">
                                    360°
                                </span>

                                {/* Next Button */}
                                <button
                                    onClick={isLastVideo ? handleRestart : handleNext}
                                    disabled={isTransitioning}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    <ChevronRight size={24} className="text-black" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>

            {/* Editor Controls (Only visible in edit mode) */}
            {showHouseHotspots && showZoneToolbar && (
                <div className="w-full bg-slate-900 text-white border-t border-white/10">
                    <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setEditZones((v) => !v)} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20">{editZones ? "Stop Edit" : "Edit Zones"}</button>
                        <button type="button" onClick={addZone} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20">Add Zone</button>
                        <button type="button" onClick={deleteSelectedZone} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-600/90 text-white border border-red-400 hover:bg-red-500">Delete Zone</button>
                        <button type="button" onClick={logZones} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-600/90 text-white border border-emerald-400 hover:bg-emerald-500">Log Zones</button>
                        <button type="button" onClick={downloadZones} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-700/90 text-white border border-blue-500 hover:bg-blue-600">Save JSON</button>
                        <button type="button" onClick={() => importInputRef.current?.click()} className="zone-editor-button px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 hover:bg-white/20">Import JSON</button>
                        <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportZones} className="hidden" />
                        <span className="text-[11px] text-white/70 ml-auto">Selected: {selectedZoneId ?? "none"} | Click in video to add points</span>
                    </div>
                    {editZones && (
                        <div className="px-4 pb-4">
                            <div className="max-h-[260px] overflow-auto rounded-xl bg-black/50 text-white text-[11px] px-3 py-2 border border-white/10">
                                <div className="font-bold tracking-wider mb-2">Zones (px @ 1920x1080)</div>
                                {currentZones.map((zone) => (
                                    <div key={zone.id} className={`font-mono mb-2 rounded-lg px-2 py-1 ${selectedZoneId === zone.id ? "bg-violet-900/40 border border-violet-400/50" : ""}`} onClick={() => setSelectedZoneId(zone.id)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <button type="button" onClick={() => { setZonesByVideo((prev) => { const next = { ...prev }; const currentList = next[currentVideoKey]?.zones || []; const updated = currentList.map((z) => z.id === zone.id ? { ...z, visible: !z.visible } : z); next[currentVideoKey] = { zones: updated }; return next; }); }} className="zone-editor-button w-6 h-6 rounded bg-white/10 border border-white/10 text-[10px] flex items-center justify-center" title={zone.visible === false ? "Show zone" : "Hide zone"}>{zone.visible === false ? "H" : "V"}</button>
                                            <span>ID: {zone.id}</span>
                                            <input value={zone.label || ""} onChange={(event) => { const nextLabel = event.target.value; setZonesByVideo((prev) => { const next = { ...prev }; const currentList = next[currentVideoKey]?.zones || []; const updated = currentList.map((z) => z.id === zone.id ? { ...z, label: nextLabel } : z); next[currentVideoKey] = { zones: updated }; return next; }); }} className="bg-white/10 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white w-32" placeholder="Label" />
                                            <button type="button" onClick={() => { setZonesByVideo((prev) => { const next = { ...prev }; const currentList = next[currentVideoKey]?.zones || []; next[currentVideoKey] = { zones: currentList.filter((z) => z.id !== zone.id) }; return next; }); if (selectedZoneId === zone.id) setSelectedZoneId(null); }} className="zone-editor-button w-6 h-6 rounded bg-red-600/80 border border-red-400 text-[10px] flex items-center justify-center" title="Delete zone">×</button>
                                        </div>
                                        {zone.points.map((pt, idx) => (<div key={`${zone.id}-pt-${idx}`}>{idx + 1}: x={pt.x} y={pt.y}</div>))}
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