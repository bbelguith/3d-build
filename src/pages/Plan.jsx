import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// --- SKELETON LOADER COMPONENT ---
const SkeletonPulse = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

export default function Plan() {
    const navigate = useNavigate();

    // 1. STATE
    const [houses, setHouses] = useState([]);
    const [houseImages, setHouseImages] = useState([]);
    const [roomImages, setRoomImages] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [floorPlanImages, setFloorPlanImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [hoveredHouseId, setHoveredHouseId] = useState(null);
    const [roomIndex, setRoomIndex] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [floorIndex, setFloorIndex] = useState(0);
    const [popupSrc, setPopupSrc] = useState(null);

    // 2. FETCH DATA
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Ensure your backend is running on port 5000
                const [housesRes, hImgRes, rImgRes, gImgRes, fImgRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/houses"),
                    axios.get("http://localhost:5000/api/house-images"),
                    axios.get("http://localhost:5000/api/room-images"),
                    axios.get("http://localhost:5000/api/gallery-images"),
                    axios.get("http://localhost:5000/api/floor-images"),
                ]);

                setHouses(housesRes.data);
                setHouseImages(hImgRes.data);
                setRoomImages(rImgRes.data);
                setGalleryImages(gImgRes.data);
                setFloorPlanImages(fImgRes.data);
                setTimeout(() => setLoading(false), 500);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // 3. LOGIC - FIXED: REMOVED TYPE 'A' FILTER
    // Now creates a list of ALL houses sorted by number (optional but good for UI)
    const activeHouses = useMemo(() => {
        // We just return 'houses' directly.
        // If you want to sort them (e.g. 1R, 3R, 4R...), you can add a sort function here.
        return houses;
    }, [houses]);

    const [currentIdx, setCurrentIdx] = useState(0);

    // Reset index when data loads
    useEffect(() => {
        if (activeHouses.length > 0) {
            // Find the first one that is active to set as default
            const idx = activeHouses.findIndex((h) => h.state === "actif");
            setCurrentIdx(Math.max(0, idx));
        }
    }, [activeHouses]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (activeHouses.length === 0) return;
            if (e.key === "ArrowRight") nextHouse();
            if (e.key === "ArrowLeft") prevHouse();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [currentIdx, activeHouses.length]);

    const prevHouse = () => setCurrentIdx((i) => (i - 1 + activeHouses.length) % activeHouses.length);
    const nextHouse = () => setCurrentIdx((i) => (i + 1) % activeHouses.length);

    // Determine currently selected house
    const currentHouse = activeHouses[currentIdx];
    const currentActiveId = hoveredHouseId ?? (currentHouse ? currentHouse.id : null);

    // Images logic
    const currentImageObj = houseImages.find((img) => img.houseId === currentActiveId);
    // Fallback image if none found
    const currentImage = currentImageObj?.src ?? "https://res.cloudinary.com/dzbmwlwra/image/upload/f_auto,q_auto/v1762360930/49ba186a-621c-4825-859e-ff097bec92c5_rdji7t.jpg";

    const currentRoomImages = roomImages.map((img) => img.src);
    const currentGalleryImages = galleryImages.map((img) => img.src);
    const currentFloorImages = floorPlanImages.map((img) => img.src);

    const handleHouseClick = (houseId) => {
        const house = houses.find((h) => h.id === houseId);
        if (house && house.state === "actif") navigate(`/house/${houseId}`);
    };

    // --- RENDER HELPERS ---

    const Title = ({ children }) => (
        <div className="text-center max-w-5xl mx-auto px-4 mb-8 relative">
            <h1 className="text-4xl sm:text-6xl font-serif font-bold uppercase leading-tight tracking-[0.15em] text-gray-900 drop-shadow-sm">
                {children}
            </h1>
            <span className="block h-1 w-24 bg-gradient-to-r from-transparent via-black to-transparent mx-auto rounded-full mt-6 opacity-80" />
        </div>
    );

    const Section = ({ title, images, index, setIndex }) => {
        const [isHovered, setIsHovered] = useState(false);

        useEffect(() => {
            if (!images || images.length === 0 || isHovered) return;
            const interval = setInterval(() => {
                setIndex((p) => (p + 1) % images.length);
            }, 5000);
            return () => clearInterval(interval);
        }, [images, isHovered, setIndex]);

        if (!images || images.length === 0) return null;

        return (
            <section
                className="relative w-full min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] border-b border-gray-100 flex items-center justify-center overflow-hidden group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    key={index}
                    className="absolute inset-0 bg-center bg-no-repeat bg-cover cursor-zoom-in animate-[subtleZoom_8s_infinite_alternate]"
                    style={{ backgroundImage: `url(${images[index]})` }}
                    onClick={() => setPopupSrc(images[index])}
                    title="Click to view full screen"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                <h2 className="absolute top-10 w-full text-center text-3xl sm:text-5xl font-serif font-medium text-white z-10 tracking-[0.3em] drop-shadow-lg opacity-90">
                    {title}
                </h2>

                <button
                    onClick={() => setIndex((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white text-3xl font-light bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/10 z-20"
                >
                    &#8592;
                </button>
                <button
                    onClick={() => setIndex((p) => (p + 1) % images.length)}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white text-3xl font-light bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/10 z-20"
                >
                    &#8594;
                </button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {images.map((_, idx) => (
                        <span
                            key={idx}
                            className={`block h-1 rounded-full transition-all duration-500 shadow-sm ${idx === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/80"}`}
                        />
                    ))}
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 space-y-12">
                <div className="max-w-6xl mx-auto space-y-8">
                    <SkeletonPulse className="h-12 w-64 mx-auto" />
                    <SkeletonPulse className="w-full h-[60vh] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full text-gray-800 bg-[#fdfdfd] pb-32">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* PROPERTY PLANNING SECTION */}
            <section className="relative z-10 py-16 sm:py-24 border-b border-gray-200 bg-gradient-to-b from-white via-gray-50 to-white">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-[1400px] mx-auto px-4 sm:px-8 mb-12 gap-6">
                    <div className="text-center md:text-left w-full">
                        <h1 className="text-4xl sm:text-5xl font-serif font-bold uppercase tracking-widest text-gray-900 text-center">
                            Property Planning
                        </h1>
                        <span className="block h-1 w-20 bg-emerald-600 rounded-full mt-4 mx-auto" />
                    </div>
                </div>

                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">

                        {/* Left Card - Dynamic Info */}
                        <div className="lg:w-[260px] bg-white/80 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 flex flex-col justify-between backdrop-blur-xl transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                            <div>
                                <h2 className="text-4xl font-serif font-bold mb-2 text-gray-900">
                                    {/* Dynamically show the current house number */}
                                    Unit {currentHouse?.number || "..."}
                                </h2>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-6">
                                    {/* Dynamically show state */}
                                    {currentHouse?.state === 'actif' ? "Available Now" : "Sold"}
                                </p>
                                <div className="space-y-4 text-sm text-gray-600">
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                                        <span className="font-medium">Type</span>
                                        <span className="font-serif text-gray-900 uppercase">{currentHouse?.type || "A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                                        <span className="font-medium">Price</span>
                                        <span className="font-serif text-emerald-700 font-bold text-lg">
                                            {currentHouse?.price ? `$${(currentHouse.price / 1000000).toFixed(2)}M` : "Contact"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-2">
                                {['PDF', '3D VIEW', 'COMPARE', 'CONTACT'].map((btn, i) => (
                                    <button key={btn} className={`
                    px-2 py-3 rounded-lg text-[10px] font-bold tracking-wider border transition-all duration-300
                    ${i === 3
                                            ? 'col-span-2 bg-emerald-900 text-white border-emerald-900 hover:bg-emerald-800'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                        }
                  `}>
                                        {btn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Center Floor Plan - FIXED BOTTOM EDGES */}
                        <div
                            className="flex-1 min-h-[600px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white/50 bg-white relative group cursor-pointer transition-all hover:shadow-[0_30px_60px_rgb(0,0,0,0.15)] flex flex-col"
                            onClick={() => setPopupSrc("https://res.cloudinary.com/dzbmwlwra/image/upload/v1754778241/floor-plan_jvww4l.png")}
                        >
                            <div
                                className="absolute inset-0 bg-center bg-contain bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: "url(https://res.cloudinary.com/dzbmwlwra/image/upload/v1754778241/floor-plan_jvww4l.png)" }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />
                            <div className="mt-auto relative z-10 p-8 text-white w-full">
                                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest mb-3 border border-white/20">
                                    INTERACTIVE VIEW
                                </span>
                                <p className="text-3xl font-serif font-medium mb-1">Floor Plan Overview</p>
                                <p className="text-white/80 text-sm font-light">Click to expand details</p>
                            </div>
                        </div>

                        {/* Right Card */}
                        <div className="lg:w-[260px] bg-white/80 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-center transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                            <h3 className="text-lg font-serif font-bold mb-6 text-gray-900 border-b border-gray-100 pb-4">Key Features</h3>
                            <ul className="space-y-4">
                                {[
                                    { icon: "✨", text: "High Ceilings" },
                                    { icon: "💡", text: "Smart Lighting" },
                                    { icon: "🪵", text: "Oak Flooring" },
                                    { icon: "🌇", text: "City Views" },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-sm text-gray-600 group/item">
                                        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg shadow-sm group-hover/item:scale-110 transition-transform">
                                            {item.icon}
                                        </span>
                                        <span className="font-medium">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </section>

            <Section title="Room Tour" images={currentRoomImages} index={roomIndex} setIndex={setRoomIndex} />
            <Section title="Floor Plan" images={currentFloorImages} index={floorIndex} setIndex={setFloorIndex} />
            <Section title="Gallery" images={currentGalleryImages} index={galleryIndex} setIndex={setGalleryIndex} />

            {/* CHOOSE YOUR HOUSE */}
            <section className="relative z-10 w-full flex flex-col items-center justify-start gap-8 pt-24 bg-white">
                <Title>Select Residence</Title>

                <div className="w-full max-w-7xl px-4 z-20">
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {activeHouses.map((house, i) => {
                            const isActive = house.id === currentActiveId;
                            const isSold = house.state !== "actif";

                            return (
                                <button
                                    key={house.id}
                                    onClick={() => { setCurrentIdx(i); handleHouseClick(house.id); }}
                                    onMouseEnter={() => setCurrentIdx(i)}
                                    className={`
                    relative px-5 py-3 rounded-lg font-bold transition-all duration-300 text-sm tracking-wide shadow-sm overflow-hidden group
                    ${isSold
                                            ? "bg-red-50 text-red-400 border border-red-100 cursor-not-allowed grayscale-[0.5]"
                                            : isActive
                                                ? "bg-gray-900 text-white shadow-xl scale-110 ring-4 ring-gray-100 z-10"
                                                : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 hover:-translate-y-1"
                                        }
                  `}
                                >
                                    <div className="relative z-10 flex items-center gap-2">
                                        <span className={isSold ? "line-through decoration-red-400 decoration-2 opacity-70" : ""}>
                                            {house.number}
                                        </span>
                                        {isSold && (
                                            <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold border border-red-200">
                                                Sold
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Hero Image */}
                <div className="relative w-full max-w-[1400px] h-[70vh] rounded-t-[4rem] overflow-hidden shadow-2xl mx-auto mt-auto border-t-8 border-x-8 border-white bg-gray-100">
                    <div
                        key={currentImage}
                        className="absolute inset-0 bg-center bg-cover animate-[fadeIn_0.8s_ease-out] cursor-zoom-in hover:scale-105 transition-transform duration-[3s]"
                        style={{ backgroundImage: `url(${currentImage})` }}
                        onClick={() => setPopupSrc(currentImage)}
                    />

                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 sm:px-12">
                        <button
                            onClick={prevHouse}
                            className="pointer-events-auto w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all duration-300 shadow-2xl"
                        >
                            &#8592;
                        </button>
                        <button
                            onClick={nextHouse}
                            className="pointer-events-auto w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all duration-300 shadow-2xl"
                        >
                            &#8594;
                        </button>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
            </section>

            {/* Image Modal */}
            {popupSrc && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[150] p-4 animate-[fadeIn_0.3s_ease-out]" onClick={() => setPopupSrc(null)}>
                    <img src={popupSrc} alt="Popup" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
                    <button onClick={() => setPopupSrc(null)} className="absolute top-8 right-8 text-white/50 hover:text-white text-5xl font-thin transition-colors">&times;</button>
                </div>
            )}

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
        @keyframes subtleZoom { from { transform: scale(1); } to { transform: scale(1.05); } }
      `}</style>
        </div>
    );
}