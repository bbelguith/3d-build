import React, { useEffect, useState, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Home,
    Map,
    Play,
    CheckCircle2
} from "lucide-react";

export default function VideoPlayer({ videos = [] }) {
    // --- STATE & REFS ---
    const [current, setCurrent] = useState(0);
    const [activeLayer, setActiveLayer] = useState(0);
    const [isReversed, setIsReversed] = useState(false);
    const [isInterior, setIsInterior] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const v0 = useRef(null);
    const v1 = useRef(null);

    const INTERIOR_VIDEO = "https://res.cloudinary.com/dzbmwlwra/video/upload/f_auto,q_auto,vc_auto/v1762343546/1105_pyem6p.mp4";

    // --- 1. INITIALIZE PLAYER ---
    useEffect(() => {
        if (videos.length > 0 && v0.current && !isInitialized) {
            v0.current.src = videos[0].src;
            v0.current.play().catch(() => {
                if (v0.current) {
                    v0.current.muted = true;
                    v0.current.play();
                }
            });
            setIsInitialized(true);
        }
    }, [videos, isInitialized]);

    // --- 2. VIDEO LOGIC ---
    const playVideo = (url, index, reversed = false, isInteriorVideo = false) => {
        const nextLayer = activeLayer === 0 ? 1 : 0;
        const showEl = nextLayer === 0 ? v0.current : v1.current;
        const hideEl = activeLayer === 0 ? v0.current : v1.current;

        if (showEl) {
            showEl.src = url;
            showEl.load();

            const onCanPlay = () => {
                showEl.currentTime = 0;
                showEl.play().catch(() => { });

                if (hideEl) hideEl.classList.add("opacity-0");
                showEl.classList.remove("opacity-0");
                showEl.classList.add("transition-opacity", "duration-700");
                if (hideEl) hideEl.classList.add("transition-opacity", "duration-700");

                setActiveLayer(nextLayer);
                setCurrent(index);
                setIsReversed(reversed);
                setIsInterior(isInteriorVideo);

                showEl.removeEventListener("canplay", onCanPlay);
            };

            showEl.addEventListener("canplay", onCanPlay);

            showEl.onended = () => {
                if (isInteriorVideo) {
                    const lastIndex = videos.length - 1;
                    setIsInterior(false);
                    playVideo(videos[lastIndex].src, lastIndex, false, false);
                } else if (index === videos.length - 1) {
                    showEl.pause();
                    if (showEl.duration) showEl.currentTime = showEl.duration - 0.05;
                }
            };
        }
    };

    // --- 3. HANDLERS ---
    const handleNext = () => {
        if (isReversed) {
            playVideo(videos[current].src, current, false);
        } else {
            const nextIndex = (current + 1) % videos.length;
            playVideo(videos[nextIndex].src, nextIndex, false);
        }
    };

    const handlePrev = () => {
        if (!isReversed && videos[current]?.reverse) {
            playVideo(videos[current].reverse, current, true);
        } else {
            const prevIndex = (current - 1 + videos.length) % videos.length;
            playVideo(videos[prevIndex].src, prevIndex, false);
        }
    };

    const handleRestart = () => {
        setIsInterior(false);
        playVideo(videos[0].src, 0, false);
    };

    const handleGoToInterior = () => {
        setIsInterior(true);
        playVideo(INTERIOR_VIDEO, current, false, true);
    };

    const handleBackToExterior = () => {
        setIsInterior(false);
        playVideo(videos[current].src, current, false);
    };

    if (videos.length === 0) return null;

    const isLastVideo = current === videos.length - 1;

    // --- STYLES (Matching Navbar) ---
    // The "Glass" container
    const glassContainer = "bg-[#4a6fa5]/60 backdrop-blur-md border border-[#fcd34d]/60 shadow-lg flex items-center h-10";

    // Buttons
    const btnBase = "h-full px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap";
    const btnActive = "bg-white text-slate-900";
    const btnInactive = "text-white hover:bg-white/10 hover:text-[#fcd34d]";
    const btnDisabled = "text-white/30 cursor-not-allowed";

    // Dividers
    const separator = "w-[1px] h-5 bg-[#fcd34d]/40";

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">
            {/* --- VIDEO LAYERS --- */}
            <div className="absolute inset-0">
                <video ref={v0} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-100" playsInline muted={!isInterior} autoPlay preload="auto" />
                <video ref={v1} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0" playsInline muted={!isInterior} autoPlay preload="auto" />
            </div>

            {/* --- CONTROLS --- */}
            <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center px-4">
                <div className="flex flex-wrap items-center justify-center gap-3">

                    {/* GROUP 1: CONTEXT SWITCHER (Rounded Pill Shape like Screenshot) */}
                    <div className={`${glassContainer} rounded-full p-1 gap-1`}>
                        <button
                            onClick={handleBackToExterior}
                            className={`rounded-full px-5 h-full text-xs font-bold tracking-wider uppercase transition-all ${!isInterior ? "bg-white text-slate-900 shadow-sm" : "text-white hover:bg-white/10"}`}
                        >
                            Exterior
                        </button>
                        <button
                            onClick={handleGoToInterior}
                            disabled={!isLastVideo && !isInterior}
                            className={`rounded-full px-5 h-full text-xs font-bold tracking-wider uppercase transition-all ${isInterior ? "bg-white text-slate-900 shadow-sm" : "text-white hover:bg-white/10"} ${(!isLastVideo && !isInterior) ? 'opacity-50' : ''}`}
                        >
                            Interior
                        </button>
                    </div>

                    {/* GROUP 2: PROGRESS (Rectangular Segmented Control) */}
                    <div className={`${glassContainer} rounded-md overflow-hidden`}>
                        {videos.map((_, idx) => {
                            // Logic to hide too many dots if list is long
                            if (videos.length > 8 && idx !== 0 && idx !== videos.length - 1 && idx !== current) return null;
                            const isDot = videos.length > 8 && idx !== current;
                            const isCurrent = idx === current;

                            return (
                                <React.Fragment key={idx}>
                                    <div
                                        className={`
                                            h-full px-3 flex items-center justify-center text-xs font-bold 
                                            ${isCurrent ? "bg-white text-slate-900 min-w-[3rem]" : "text-white/80 min-w-[2.5rem]"}
                                        `}
                                    >
                                        {isDot ? "•" : `${idx + 1}m`}
                                    </div>
                                    {/* Separator only between non-active items */}
                                    {idx < videos.length - 1 && !isCurrent && (idx + 1) !== current && (
                                        <div className={separator}></div>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </div>

                    {/* GROUP 3: NAVIGATION (Rectangular Segmented Control) */}
                    <div className={`${glassContainer} rounded-md overflow-hidden`}>
                        {/* Prev Button */}
                        <button
                            onClick={handlePrev}
                            disabled={current === 0 && !isReversed}
                            className={`${btnBase} ${current === 0 && !isReversed ? btnDisabled : btnInactive}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className={separator}></div>

                        {/* Status / Middle Indicator */}
                        <div className="h-full px-4 flex items-center justify-center text-xs font-bold text-white tracking-widest min-w-[90px]">
                            {isLastVideo ? "FINISHED" : "PLAYING"}
                        </div>

                        <div className={separator}></div>

                        {/* Next / Replay Button */}
                        {isLastVideo ? (
                            <button
                                onClick={handleRestart}
                                className={`${btnBase} ${btnInactive}`}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className={`${btnBase} ${btnInactive}`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}