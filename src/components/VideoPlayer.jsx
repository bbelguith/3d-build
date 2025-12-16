import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Play,
    CheckCircle2,
    X
} from "lucide-react";

export default function VideoPlayer({ videos = [] }) {
    const navigate = useNavigate();
    
    // --- STATE & REFS ---
    const [current, setCurrent] = useState(0);
    const [activeLayer, setActiveLayer] = useState(0);
    const [isReversed, setIsReversed] = useState(false);
    const [isInterior, setIsInterior] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showClickableZones, setShowClickableZones] = useState(false);
    const [videoTime, setVideoTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [hoveredZone, setHoveredZone] = useState(null);
    // Visual feedback state for the special "SEE INTERIOR" button (zone id 4)
    const [isPeekButtonHovered, setIsPeekButtonHovered] = useState(false);
    const [isPeekButtonActive, setIsPeekButtonActive] = useState(false);
    const [showArrowHint, setShowArrowHint] = useState(true);
    
    // Advanced zone editor state (existing)
    const [isZoneEditorMode, setIsZoneEditorMode] = useState(false);
    const [editingZoneId, setEditingZoneId] = useState(null);
    const [capturedPoints, setCapturedPoints] = useState({});
    const [videoDisplayRect, setVideoDisplayRect] = useState(null);

    // Simple ad‑hoc zone editor (for capturing raw coords) – kept for future use, disabled for now
    const [isSimpleZoneEditor, setIsSimpleZoneEditor] = useState(false);
    const [simplePoints, setSimplePoints] = useState([]);

    const v0 = useRef(null);
    const v1 = useRef(null);
    const videoContainerRef = useRef(null);
    const videoDisplayRef = useRef(null);
    
    // Original image dimensions from the image map (approximate based on coordinates)
    // These are the dimensions of the frameplanmass.jpg image
    const IMAGE_WIDTH = 3600; // Approximate max x coordinate
    const IMAGE_HEIGHT = 1920; // Approximate max y coordinate
    
    // Clickable zones for blocs in a specific video frame
    // Coordinates are in pixels from the image map (final adjusted coordinates)
    // Format: { id, coords (pixel array), label, houseId, videoId? }
    // - videoId (optional for now): DB id of the video this zone belongs to.
    //   If omitted, the zone will be treated as attached to "the last video"
    //   for backwards compatibility. For new zones, ALWAYS set videoId so
    //   adding videos later won't break the mapping.
    // Tuning knobs for the newly added custom area (videoId 3)
    // Adjust these to nudge the whole polygon left/right/up/down without redrawing
    const CUSTOM_AREA_OFFSET_X = 0; // + moves right, - moves left
    const CUSTOM_AREA_OFFSET_Y = -100; // + moves down, - moves up

    const clickableZones = [
        { 
            id: 1, 
            // Area shown on video with DB id 5 (final overview with 3 areas)
            coords: [2393,295,2400,220,2427,183,2475,166,3482,122,3560,153,3591,214,3591,1706,3570,1710,3050,1740,2315,1760,2275,1756,2240,1702,2230,1680],
            label: "Prime Villas", 
            houseId: 1,
            videoId: 5, // DB video id that shows this area
            // targetVideoId: <videoId>, // set later to jump to a detail video
        },
        { 
            id: 2, 
            // Area shown on video with DB id 5
            coords: [2000,129,2353,109,2168,1645,2112,1675,2057,1695,1700,1706],
            label: "Commercial Hub", 
            houseId: 2,
            videoId: 5,
            // targetVideoId: <videoId>,
        },
        { 
            id: 3, 
            // Area shown on video with DB id 5
            coords: [1817,136,1572,146,1118,64,870,146,799,166,772,244,90,1845,324,1919,433,1940,1376,1984],
            label: "Twin Villas", 
            houseId: 3,
            videoId: 5,
            // targetVideoId: <videoId>,
        },
        { 
            id: 4,
            // New clickable area (coords you provided) – attached to video with DB id 2
            coords: [
                1636.4084278768232,1184.1296596434358,
                1810.6709886547812,1351.7536466774718,
                1961.6985413290113,1282.0486223662883,
                1911.9092382495949,1235.5786061588333,
                1916.8881685575366,1164.2139384116695,
                1813.9902755267424,1081.2317666126419,
                1752.583468395462,1102.807131280389,
                1701.1345218800648,1127.7017828200974,
                1704.453808752026,1160.8946515397083
            ],
            label: "", // no text label – we render a custom "SEE INTERIOR" button instead
            houseId: 1,
            videoId: 2, // DB video id that shows this single area with the SEE INTERIOR button
            // Manual adjustment knobs for fine‑tuning position (in video pixels)
            offsetX: -2,  // + moves area to the right, - moves to the left
            offsetY: -128, // + moves area down, - moves up
            // Optional: when set later, clicking this zone/button jumps to that interior video id
            // targetVideoId: <interiorVideoId>,
        },
        { 
            id: 5,
            // New clickable area drawn on video with DB id 3 (SEE INTERIOR button)
            coords: [
                1264.0258819124685,1354.8653833575477,
                1773.7438520189737,1100.9399477000945,
                1799.8832351013587,1115.876738032886,
                1971.6563239284592,1029.9901936193355,
                2223.714660794313,1134.5477259488753,
                1811.0858278509522,1633.0631033057866,
                1766.2754568525781,1672.2721779293638,
                1719.5979870626052,1692.810264636952,
                1652.382430565044,1698.4115610117487,
                1601.9707631918732,1692.810264636952,
                1551.5590958187022,1662.9366839713693
            ],
            label: "", // render SEE INTERIOR button
            houseId: 1,
            videoId: 3,
            offsetX: CUSTOM_AREA_OFFSET_X,
            offsetY: CUSTOM_AREA_OFFSET_Y,
        },
    ];
    
    // Convert pixel coordinates to percentage coordinates
    const convertCoordsToPercent = (coords) => {
        const points = [];
        for (let i = 0; i < coords.length; i += 2) {
            const x = (coords[i] / IMAGE_WIDTH) * 100;
            const y = (coords[i + 1] / IMAGE_HEIGHT) * 100;
            points.push(`${x}%`);
            points.push(`${y}%`);
        }
        return points.join(',');
    };
    
    // Handle zone click - hook for navigation / video jump
    const handleZoneClick = (zone) => {
        if (isZoneEditorMode) return; // Block during editor mode
        // TEMP: disable all navigation until all videos are ready
        console.log(`Zone ${zone.id} clicked (navigation disabled until all videos are configured).`);
    };
    
    // Helper function to calculate video display area with object-cover
    // With object-cover, video fills container and may be cropped
    const calculateVideoDisplayArea = (videoElement) => {
        if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) return null;
        
        const rect = videoElement.getBoundingClientRect();
        const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
        const containerAspect = rect.width / rect.height;
        
        let scaleX, scaleY, offsetX, offsetY, cropX, cropY;
        
        if (videoAspect > containerAspect) {
            // Video is wider - fit to height, crop sides
            scaleY = rect.height / videoElement.videoHeight;
            scaleX = scaleY;
            const scaledWidth = videoElement.videoWidth * scaleX;
            offsetX = (rect.width - scaledWidth) / 2;
            offsetY = 0;
            cropX = (scaledWidth - rect.width) / 2 / scaleX; // How much is cropped on each side
            cropY = 0;
        } else {
            // Video is taller - fit to width, crop top/bottom
            scaleX = rect.width / videoElement.videoWidth;
            scaleY = scaleX;
            const scaledHeight = videoElement.videoHeight * scaleY;
            offsetX = 0;
            offsetY = (rect.height - scaledHeight) / 2;
            cropX = 0;
            cropY = (scaledHeight - rect.height) / 2 / scaleY; // How much is cropped on top/bottom
        }
        
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            offsetX,
            offsetY,
            scaleX,
            scaleY,
            cropX,
            cropY,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight
        };
    };
    
    // Zone Editor Functions
    const startEditingZone = (zoneId) => {
        setEditingZoneId(zoneId);
        setCapturedPoints(prev => ({ ...prev, [zoneId]: [] }));
        // Get video display dimensions
        const activeVideo = activeLayer === 0 ? v0.current : v1.current;
        if (activeVideo) {
            const displayArea = calculateVideoDisplayArea(activeVideo);
            if (displayArea) {
                setVideoDisplayRect(displayArea);
            }
        }
    };
    
    const handleVideoClick = (e) => {
        const activeVideo = activeLayer === 0 ? v0.current : v1.current;

        // NOTE: Simple zone editor branch kept for future use but disabled in UI.
        // if (isSimpleZoneEditor) { ... }

        // Normal user clicks on the video surface should NOT restart or change playback.
        // We only use this handler when the advanced zone editor is active.

        // If not in editor mode, do nothing.
        if (!isZoneEditorMode || !editingZoneId) return;

        // Advanced editor mode: add points into capturedPoints[editingZoneId]
        if (!activeVideo) return;
        const displayArea = calculateVideoDisplayArea(activeVideo);
        if (!displayArea) return;

        const clickX = e.clientX - displayArea.x;
        const clickY = e.clientY - displayArea.y;

        if (clickX >= 0 && clickX <= displayArea.width && clickY >= 0 && clickY <= displayArea.height) {
            const adjustedX = (clickX - displayArea.offsetX) / displayArea.scaleX;
            const adjustedY = (clickY - displayArea.offsetY) / displayArea.scaleY;
            const videoX = adjustedX + displayArea.cropX;
            const videoY = adjustedY + displayArea.cropY;
            const clampedX = Math.max(0, Math.min(activeVideo.videoWidth, videoX));
            const clampedY = Math.max(0, Math.min(activeVideo.videoHeight, videoY));

            setCapturedPoints(prev => ({
                ...prev,
                [editingZoneId]: [...(prev[editingZoneId] || []), clampedX, clampedY]
            }));
            setVideoDisplayRect(displayArea);
        }
    };
    
    const finishEditingZone = () => {
        setEditingZoneId(null);
    };
    
    const clearZonePoints = (zoneId) => {
        setCapturedPoints(prev => ({ ...prev, [zoneId]: [] }));
    };
    
    const calculateTransformation = () => {
        // Calculate scale and offset to transform original coords to captured coords
        // Using least squares approach for better accuracy
        const transformations = {};
        
        clickableZones.forEach(zone => {
            const original = zone.coords;
            const captured = capturedPoints[zone.id] || [];
            
            if (captured.length >= 4 && original.length === captured.length) {
                // Calculate average scale from all point pairs
                let totalScaleX = 0;
                let totalScaleY = 0;
                let count = 0;
                
                // Calculate scales from differences between consecutive points
                for (let i = 0; i < original.length - 2; i += 2) {
                    const origDx = original[i + 2] - original[i];
                    const origDy = original[i + 3] - original[i + 1];
                    const capDx = captured[i + 2] - captured[i];
                    const capDy = captured[i + 3] - captured[i + 1];
                    
                    if (Math.abs(origDx) > 0.1) {
                        totalScaleX += capDx / origDx;
                        count++;
                    }
                    if (Math.abs(origDy) > 0.1) {
                        totalScaleY += capDy / origDy;
                        count++;
                    }
                }
                
                const avgScaleX = count > 0 ? totalScaleX / count : 1;
                const avgScaleY = count > 0 ? totalScaleY / count : 1;
                const scale = (avgScaleX + avgScaleY) / 2; // Average scale
                
                // Calculate offset using first point
                const offsetX = captured[0] - (original[0] * scale);
                const offsetY = captured[1] - (original[1] * scale);
                
                transformations[zone.id] = { offsetX, offsetY, scale };
            }
        });
        
        return transformations;
    };
    
    const applyTransformation = () => {
        const pts = capturedPoints['custom'];
        if (!pts || pts.length < 6) {
            alert('Add at least 3 points before logging.');
            return;
        }

        console.clear();
        console.log('=== NEW AREA COORDINATES (video pixels) ===');
        console.log(`coords: [${pts.join(',')}]`);
        console.log('JSON:');
        console.log(JSON.stringify({ id: 'custom', coords: pts }, null, 2));
        console.log('===========================================');
        
        alert('New area coordinates logged to console.');
    };

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
                        setShowClickableZones(true); // Show zones when video ends
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

    // Track video time to detect last frame and show clickable zones
    useEffect(() => {
        const activeVideo = activeLayer === 0 ? v0.current : v1.current;
        if (!activeVideo) return;

        const updateTime = () => {
            if (activeVideo) {
                setVideoTime(activeVideo.currentTime);
                setVideoDuration(activeVideo.duration || 0);
                
                // Determine if current video has zones attached (by DB video id)
                const currentVideo = videos[current];
                const hasZonesForCurrentVideo = !!currentVideo && clickableZones.some(zone => {
                    // If zone.videoId is set, it must match DB id
                    if (zone.videoId) return zone.videoId === currentVideo.id;
                    // If zone.attachToIndex is set, it must match current index
                    if (typeof zone.attachToIndex === "number") return zone.attachToIndex === current;
                    // Backwards-compat: zones without videoId/attachToIndex are treated as "last video" zones
                    const isLastVideoFallback = current === videos.length - 1;
                    return isLastVideoFallback;
                });

                // Check if we're on the last frame of the current video (within last 0.5 seconds)
                const isLastFrame = activeVideo.duration && activeVideo.currentTime >= activeVideo.duration - 0.5;
                
                if (hasZonesForCurrentVideo && isLastFrame && !isInterior) {
                    setShowClickableZones(true);
                } else if (activeVideo.currentTime < activeVideo.duration - 1) {
                    setShowClickableZones(false);
                }
            }
        };

        activeVideo.addEventListener('timeupdate', updateTime);
        
        return () => {
            if (activeVideo) {
                activeVideo.removeEventListener('timeupdate', updateTime);
            }
        };
    }, [current, activeLayer, isInterior, videos.length]);
    
    // Add/remove body class to hide navbar buttons when zone editor is active
    useEffect(() => {
        if (isZoneEditorMode) {
            document.body.classList.add('zone-editor-active');
        } else {
            document.body.classList.remove('zone-editor-active');
        }
        
        return () => {
            document.body.classList.remove('zone-editor-active');
        };
    }, [isZoneEditorMode]);
    
    // Recalculate video display area on window resize for responsive zones
    useEffect(() => {
        const handleResize = () => {
            // Force re-render of zones by updating state
            // This will trigger recalculation of display area
            if (showClickableZones || isZoneEditorMode) {
                const activeVideo = activeLayer === 0 ? v0.current : v1.current;
                if (activeVideo && isZoneEditorMode && editingZoneId) {
                    const displayArea = calculateVideoDisplayArea(activeVideo);
                    if (displayArea) {
                        setVideoDisplayRect(displayArea);
                    }
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showClickableZones, isZoneEditorMode, editingZoneId, activeLayer]);

    const markArrowHintSeen = () => {
        if (showArrowHint) {
            setShowArrowHint(false);
        }
    };

    if (videos.length === 0) return null;

    const isLastVideo = current === videos.length - 1;

    // Zones attached to the currently playing video (by DB id / index / legacy last-video)
    const currentVideo = videos[current];
    const zonesForCurrentVideo = currentVideo
        ? clickableZones.filter(zone => {
            if (zone.videoId) return zone.videoId === currentVideo.id;
            if (typeof zone.attachToIndex === "number") return zone.attachToIndex === current;
            // legacy zones without videoId/attachToIndex: treat them as last-video-only
            return current === videos.length - 1;
        })
        : [];
    const hasZonesForCurrentVideo = zonesForCurrentVideo.length > 0;

    // Jump helper: go to the video whose DB id is 5 (zones/peek video)
    const handleGoToZonesVideo = () => {
        if (!videos.length) return;
        const targetIndex = findVideoIndexById(5);
        if (targetIndex < 0 || !videos[targetIndex]) return;

        setIsInterior(false);
        playVideo(videos[targetIndex].src, targetIndex, false, false);
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
    const btnArrow = "relative w-14 h-14 rounded-full bg-gradient-to-br from-white to-[#fcd34d]/90 text-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.35)] border border-white/70 transition-all duration-200 flex items-center justify-center hover:scale-110 hover:shadow-[0_12px_50px_rgba(252,211,77,0.6)]";
    const btnArrowDisabled = "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.35)]";

    // Dividers
    const separator = "w-[1px] h-5 bg-[#fcd34d]/40";

    return (
        <>
            <style>{`
                @keyframes zoneBlink {
                    0% { stroke-opacity: 0.2; }
                    50% { stroke-opacity: 0.9; }
                    100% { stroke-opacity: 0.2; }
                }
                @keyframes zonePulse {
                    0% { fill-opacity: 0.25; stroke-opacity: 0.5; }
                    50% { fill-opacity: 0.6; stroke-opacity: 1; }
                    100% { fill-opacity: 0.25; stroke-opacity: 0.5; }
                }
            `}</style>

        <div 
            ref={videoContainerRef}
            className={`relative w-full bg-black overflow-hidden select-none font-sans ${
                isMobile && !isMobileFullscreen ? 'h-[60vh] md:h-screen' : 'h-screen'
            }`}
        >
            {/* Mobile overlay button - shown only on mobile when not in fullscreen */}
            {isMobile && !isMobileFullscreen && !isZoneEditorMode && (
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
            {isMobile && isMobileFullscreen && !isZoneEditorMode && (
                <button
                    onClick={exitMobileFullscreen}
                    className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition"
                    aria-label="Close fullscreen"
                >
                    <X className="w-6 h-6" />
                </button>
            )}


            {/* SIMPLE ZONE EDITOR PANEL & TOGGLE (kept for future use, currently disabled in UI) */}
            {false && isSimpleZoneEditor && (
                <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-lg p-3 shadow-lg border border-gray-300 text-xs text-gray-800 space-y-2">
                    {/* ... existing simple editor panel content ... */}
                </div>
            )}

            {/* --- VIDEO LAYERS --- */}
            <div 
                ref={videoDisplayRef}
                className="absolute inset-0 w-full h-full bg-black overflow-hidden"
                onClick={handleVideoClick}
                style={{ cursor: isZoneEditorMode && editingZoneId ? 'crosshair' : 'default' }}
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
                
                {/* Zone Editor Overlay - Shows captured points (advanced editor) */}
                {isZoneEditorMode && Object.keys(capturedPoints).length > 0 && (() => {
                    const activeVideo = activeLayer === 0 ? v0.current : v1.current;
                    if (!activeVideo) return null;
                    
                    const displayArea = calculateVideoDisplayArea(activeVideo);
                    if (!displayArea) return null;
                    
                    return (
                        <div className="absolute inset-0 z-40 pointer-events-none">
                            <svg 
                                className="absolute inset-0 w-full h-full"
                                style={{ pointerEvents: 'none' }}
                            >
                                {Object.entries(capturedPoints).map(([zoneId, points]) => {
                                    if (points.length < 4) return null;
                                    
                                    // Convert video coordinates to screen coordinates (with object-cover)
                                    const screenPoints = [];
                                    for (let i = 0; i < points.length; i += 2) {
                                        // Account for cropping: adjust coordinates by crop offset
                                        const adjustedX = points[i] - displayArea.cropX;
                                        const adjustedY = points[i + 1] - displayArea.cropY;
                                        
                                        // Convert to screen coordinates
                                        const x = (adjustedX * displayArea.scaleX) + displayArea.offsetX;
                                        const y = (adjustedY * displayArea.scaleY) + displayArea.offsetY;
                                        screenPoints.push(`${x},${y}`);
                                    }
                                    
                                    if (screenPoints.length < 2) return null;
                                    
                                    return (
                                        <g key={zoneId}>
                                            <polygon
                                                points={screenPoints.join(' ')}
                                                fill={parseInt(zoneId) === editingZoneId ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)'}
                                                stroke={parseInt(zoneId) === editingZoneId ? '#22c55e' : '#3b82f6'}
                                                strokeWidth="3"
                                            />
                                            {points.map((point, idx) => {
                                                if (idx % 2 !== 0) return null;
                                                // Account for cropping
                                                const adjustedX = point - displayArea.cropX;
                                                const adjustedY = points[idx + 1] - displayArea.cropY;
                                                const x = (adjustedX * displayArea.scaleX) + displayArea.offsetX;
                                                const y = (adjustedY * displayArea.scaleY) + displayArea.offsetY;
                                                return (
                                                    <circle
                                                        key={idx}
                                                        cx={x}
                                                        cy={y}
                                                        r="5"
                                                        fill="#22c55e"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                    />
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    );
                })()}

                {/* Clickable Zones Overlay - only when current video has zones (hidden in editor mode) */}
                {showClickableZones && hasZonesForCurrentVideo && !isInterior && !isZoneEditorMode && (() => {
                    const activeVideo = activeLayer === 0 ? v0.current : v1.current;
                    if (!activeVideo) return null;

                    // Use actual video dimensions when available; fallback to image dimensions
                    const viewWidth = activeVideo.videoWidth || IMAGE_WIDTH;
                    const viewHeight = activeVideo.videoHeight || IMAGE_HEIGHT;

                    return (
                        <div className="absolute inset-0 z-30 pointer-events-auto">
                            <svg
                                className="absolute inset-0 w-full h-full"
                                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                                preserveAspectRatio="xMidYMid slice" // match object-cover
                                style={{ pointerEvents: 'none' }}
                            >
                                <defs>
                                    <filter id="shadow-medium" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
                                    </filter>
                                </defs>
                                {zonesForCurrentVideo.map((zone) => {
                                    // Optional per-zone offset for fine tuning (only used when defined)
                                    const dx = typeof zone.offsetX === "number" ? zone.offsetX : 0;
                                    const dy = typeof zone.offsetY === "number" ? zone.offsetY : 0;

                                    const points = [];
                                    for (let i = 0; i < zone.coords.length; i += 2) {
                                        points.push(`${zone.coords[i] + dx},${zone.coords[i + 1] + dy}`);
                                    }

                                    // Calculate center for tooltip (in SVG coords)
                                    const xCoords = [];
                                    const yCoords = [];
                                    for (let i = 0; i < zone.coords.length; i += 2) {
                                        xCoords.push(zone.coords[i] + dx);
                                        yCoords.push(zone.coords[i + 1] + dy);
                                    }
                                    const centerX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
                                    const centerY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
                                    const minY = Math.min(...yCoords);

                                    const isHovered = hoveredZone === zone.id;
                                    const isPeekZone = zone.id === 4 || zone.id === 5;
                                    return (
                                        <g key={zone.id}>
                                            <polygon
                                                points={points.join(' ')}
                                                className="cursor-pointer transition-all duration-300"
                                                fill={isHovered || isPeekZone ? 'rgba(96, 165, 250, 0.55)' : 'rgba(96, 165, 250, 0.28)'}
                                                stroke="#60a5fa"
                                                strokeWidth={isHovered ? '3.5' : '2.5'}
                                                style={{
                                                    pointerEvents: 'all',
                                                    animation: 'zonePulse 1.4s ease-in-out infinite'
                                                }}
                                                onMouseEnter={() => setHoveredZone(zone.id)}
                                                onMouseLeave={() => setHoveredZone(null)}
                                                onClick={() => {
                                                    // TEMP: disable all navigation until all videos are configured
                                                    console.log(`Zone ${zone.id} polygon clicked (navigation disabled until all videos are configured).`);
                                                }}
                                            />

                                            {/* Label tooltip / button */}
                                            {isPeekZone ? (
                                                // Always-visible "See interior" button for this area, positioned above the zone
                                                <g
                                                    onClick={() => {
                                                        // TEMP: disable all navigation until all videos are configured
                                                        console.log("See Interior button clicked (navigation disabled until all videos are configured).");
                                                    }}
                                                    onMouseEnter={() => setIsPeekButtonHovered(true)}
                                                    onMouseLeave={() => {
                                                        setIsPeekButtonHovered(false);
                                                        setIsPeekButtonActive(false);
                                                    }}
                                                    onMouseDown={() => setIsPeekButtonActive(true)}
                                                    onMouseUp={() => setIsPeekButtonActive(false)}
                                                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                                >
                                                    <defs>
                                                        <linearGradient id={`zone-button-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                                                            <stop offset="100%" stopColor="rgba(236, 245, 255, 0.94)" />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect
                                                        x={centerX - 140}
                                                        y={minY - 88}  // above the top edge of the zone
                                                        width="280"
                                                        height="72"
                                                        rx="18"
                                                        fill={
                                                            isPeekButtonActive
                                                                ? "#f59e0b" // strong orange on click
                                                                : isPeekButtonHovered
                                                                    ? "#fef3c7" // warm highlight on hover
                                                                    : `url(#zone-button-${zone.id})`
                                                        }
                                                        stroke={isPeekButtonActive ? "#b45309" : isPeekButtonHovered ? "#fbbf24" : "#fcd34d"}
                                                        strokeWidth={isPeekButtonActive ? "4" : isPeekButtonHovered ? "3.2" : "2.8"}
                                                        opacity={isPeekButtonActive ? "0.96" : isPeekButtonHovered ? "1" : "0.98"}
                                                        transform={isPeekButtonActive ? "translate(0,3)" : isPeekButtonHovered ? "translate(0,-1)" : "translate(0,0)"}
                                                        filter="url(#shadow-medium)`" />
                                                    <text
                                                        x={centerX}
                                                        y={minY - 88 + 40}
                                                        textAnchor="middle"
                                                        fill="#0f172a"
                                                        fontSize={isPeekButtonActive ? 22 : isPeekButtonHovered ? 20 : 18}
                                                        fontWeight="900"
                                                        className="pointer-events-none tracking-widest"
                                                    >
                                                        SEE INTERIOR
                                                    </text>
                                                </g>
                                            ) : (
                                                // Always-visible labels for the 3 main areas
                                                <g>
                                                    <defs>
                                                        <linearGradient id={`zone-label-${zone.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                                                            <stop offset="100%" stopColor="rgba(236, 245, 255, 0.94)" />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect
                                                        x={centerX - 160}
                                                        y={centerY - 30}
                                                        width="320"
                                                        height="60"
                                                        rx="20"
                                                        fill={`url(#zone-label-${zone.id})`}
                                                        stroke="#fcd34d"
                                                        strokeWidth="3.2"
                                                        opacity="0.98"
                                                        filter="url(#shadow-medium)`" />
                                                    <text
                                                        x={centerX}
                                                        y={centerY + 2}
                                                        textAnchor="middle"
                                                        fill="#0f172a"
                                                        fontSize="28"
                                                        fontWeight="900"
                                                        className="pointer-events-none tracking-widest"
                                                    >
                                                        {zone.label.toUpperCase()}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    );
                })()}
            </div>

            {/* --- ZONE EDITOR UI (Enabled for manual polygon capture) --- */}
            {!isSimpleZoneEditor && !isMobile && (
                <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-300">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-800">Zone Editor</h3>
                            <button
                                onClick={() => {
                                    setIsZoneEditorMode(!isZoneEditorMode);
                                    setEditingZoneId(null);
                                    setCapturedPoints({});
                                }}
                                className="px-3 py-1 text-xs font-semibold rounded bg-blue-500 text-white hover:bg-blue-600"
                            >
                                {isZoneEditorMode ? 'Exit Editor' : 'Enable Editor'}
                            </button>
                        </div>
                        
                        {isZoneEditorMode && (
                            <>
                                <div className="text-xs text-gray-600 mb-2">
                                    Click “Start new area”, then click points on the video to outline it. When done, click “Finish & log” to output coordinates in the console.
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const tempId = 'custom';
                                            if (editingZoneId === tempId) {
                                                finishEditingZone();
                                            } else {
                                                startEditingZone(tempId);
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-semibold rounded ${editingZoneId ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {editingZoneId ? 'Finish & log' : 'Start new area'}
                                    </button>
                                    {capturedPoints['custom'] && capturedPoints['custom'].length > 0 && (
                                        <>
                                            <span className="text-xs text-gray-600">
                                                ({capturedPoints['custom'].length / 2} points)
                                            </span>
                                            <button
                                                onClick={() => clearZonePoints('custom')}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Clear
                                            </button>
                                        </>
                                    )}
                                </div>
                                {editingZoneId && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                        Click on the video to mark points. Click “Finish & log” when done.
                                    </div>
                                )}
                                
                                <button
                                    onClick={applyTransformation}
                                    disabled={Object.keys(capturedPoints).length === 0 || Object.values(capturedPoints).some(p => p.length === 0)}
                                    className="mt-2 px-4 py-2 text-sm font-bold bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Calculate & Log Adjusted Coordinates
                                </button>
                            </>
                        )}
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

                    {/* GROUP 1.5: PEEK A HOUSE (Jump to zones video) */}
                    <div className={`${glassContainer} rounded-full overflow-hidden`}>
                        <button
                            onClick={handleGoToZonesVideo}
                            disabled={isLastVideo || isTransitioning}
                            className={`${btnBase} ${(isLastVideo || isTransitioning) ? btnDisabled : btnInactive}`}
                        >
                            Peek a house
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
        </>
    );
}