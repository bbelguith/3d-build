import React, { useEffect, useState, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Home,
    ArrowLeft
} from "lucide-react";

export default function VideoPlayer({ videos = [] }) {
    // --- ORIGINAL STATE & REFS ---
    const [current, setCurrent] = useState(0);
    const [activeLayer, setActiveLayer] = useState(0);
    const [isReversed, setIsReversed] = useState(false);
    const [isInterior, setIsInterior] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const v0 = useRef(null);
    const v1 = useRef(null);

    const INTERIOR_VIDEO = "https://res.cloudinary.com/dzbmwlwra/video/upload/f_auto,q_auto,vc_auto/v1762343546/1105_pyem6p.mp4";

    // --- 1. INITIALIZE PLAYER (Optimized for props) ---
    useEffect(() => {
        if (videos.length > 0 && v0.current && !isInitialized) {
            v0.current.src = videos[0].src;
            // Attempt play, handle browser autoplay policies silently
            v0.current.play().catch(() => {
                if (v0.current) {
                    v0.current.muted = true;
                    v0.current.play();
                }
            });
            setIsInitialized(true);
        }
    }, [videos, isInitialized]);

    // --- 2. ORIGINAL VIDEO LOGIC (The one you liked) ---
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

                // Direct DOM manipulation for transitions (Your original logic)
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
                    // Hold last frame slightly before end
                    if (showEl.duration) showEl.currentTime = showEl.duration - 0.05;
                }
            };
        }
    };

    // --- 3. HANDLERS (Mapped to your original logic) ---
    const handleNext = () => {
        if (isReversed) {
            playVideo(videos[current].src, current, false);
        } else {
            const nextIndex = (current + 1) % videos.length;
            playVideo(videos[nextIndex].src, nextIndex, false);
        }
    };

    const handlePrev = () => {
        // If current video has a 'reverse' property (from your data), use it
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

    if (videos.length === 0) {
        return (
            <div className="w-full h-screen bg-neutral-900 flex items-center justify-center text-white/50 font-light tracking-widest animate-pulse">
                LOADING...
            </div>
        );
    }

    const isLastVideo = current === videos.length - 1;

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden select-none">
            {/* --- VIDEO LAYERS (Original Structure) --- */}
            <div className="absolute inset-0">
                <video
                    ref={v0}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-100"
                    playsInline
                    muted={!isInterior}
                    autoPlay
                    preload="auto"
                />
                <video
                    ref={v1}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0"
                    playsInline
                    muted={!isInterior}
                    autoPlay
                    preload="auto"
                />
            </div>

            {/* --- NEW MODERN CONTROLS (The design you wanted) --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform translate-y-0 opacity-100">
                <div className="flex items-center gap-1 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-black/5">

                    {!isInterior ? (
                        <>
                            {/* Previous Button */}
                            <button
                                onClick={handlePrev}
                                // Only disable if at start AND not reversed
                                disabled={current === 0 && !isReversed}
                                className={`p-3 rounded-full transition-all duration-200 group/btn ${current === 0 && !isReversed
                                        ? "text-white/20 cursor-not-allowed"
                                        : "text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                                    }`}
                            >
                                <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                            </button>

                            {/* Step Indicator */}
                            <div className="px-4 flex flex-col items-center justify-center min-w-[80px]">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
                                    Step
                                </span>
                                <span className="text-sm font-bold text-white font-mono">
                                    {current + 1} <span className="text-white/30">/</span> {videos.length}
                                </span>
                            </div>

                            {/* Next / Action Buttons */}
                            {isLastVideo ? (
                                <div className="flex items-center gap-1 pr-1">
                                    <button
                                        onClick={handleRestart}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all hover:scale-105"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Replay
                                    </button>
                                    <button
                                        onClick={handleGoToInterior}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all hover:scale-105 shadow-lg"
                                    >
                                        <Home className="w-4 h-4" />
                                        Inside
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="p-3 rounded-full text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                                </button>
                            )}
                        </>
                    ) : (
                        /* Interior Controls */
                        <button
                            onClick={handleBackToExterior}
                            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 text-white text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-all hover:scale-105 group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Exterior
                        </button>
                    )}
                </div>
            </div>

            {/* Step Dots */}
            {!isInterior && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                    {videos.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-500 ${idx === current ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "w-1 bg-white/20"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}