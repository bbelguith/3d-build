import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// --- SKELETON LOADER COMPONENT ---
const SkeletonPulse = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

export default function Plan() {
    const navigate = useNavigate();
    const location = useLocation();

    // Create a Ref for the section we want to scroll to
    const selectionRef = useRef(null);

    // 1. STATE
    const [houses, setHouses] = useState([]);
    const [roomImages, setRoomImages] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [floorPlanImages, setFloorPlanImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [hoveredHouseId, setHoveredHouseId] = useState(null);
    const [roomIndex, setRoomIndex] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [floorIndex, setFloorIndex] = useState(0);
    const [primePlanIdx, setPrimePlanIdx] = useState(0);

    // 2. FETCH DATA
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE || "";
        const fetchAllData = async () => {
            try {
                const [housesRes, rImgRes, gImgRes, fImgRes] = await Promise.all([
                    axios.get(`${apiBase}/api/houses`),
                    axios.get(`${apiBase}/api/room-images`),
                    axios.get(`${apiBase}/api/gallery-images`),
                    axios.get(`${apiBase}/api/floor-images`),
                ]);

                setHouses(housesRes.data);
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

    // Handle Scroll & Toast on Arrival
    useEffect(() => {
        if (location.state?.scrollToSelection && !loading) {
            setTimeout(() => {
                if (selectionRef.current) {
                    selectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);

            setTimeout(() => {
                toast.info("📅 Please select a house to schedule your appointment!", {
                    position: "bottom-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "dark",
                    style: {
                        borderRadius: "1rem",
                        fontFamily: "serif",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "#1f2937",
                        color: "#fff"
                    }
                });
                window.history.replaceState({}, document.title);
            }, 1000);
        }
    }, [location, loading]);

    // 3. LOGIC
    const activeHouses = useMemo(() => {
        return houses;
    }, [houses]);

    const [currentIdx, setCurrentIdx] = useState(0);

    useEffect(() => {
        if (activeHouses.length > 0) {
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

    const currentHouse = activeHouses[currentIdx];
    const currentActiveId = hoveredHouseId ?? (currentHouse ? currentHouse.id : null);

    const currentRoomImages = roomImages.map((img) => img.src);
    const currentGalleryImages = galleryImages.map((img) => img.src);
    const currentFloorImages = floorPlanImages.map((img) => img.src);
    const primePlanImages = useMemo(() => ([
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986525/plan_rdc_villa_isolee_pyote8.png",
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986610/plan_terrasse_villa_isolee_riz5mc.png",
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986523/WhatsApp_Image_2025-12-17_at_15.49.21_krfpum.jpg"
    ]), []);

    const handleHouseClick = (houseId) => {
        const house = houses.find((h) => h.id === houseId);
        if (house && house.state === "actif") navigate(`/house/${houseId}`);
    };

    // --- RENDER HELPERS ---

    const Title = ({ children }) => (
        <div className="text-center max-w-5xl mx-auto px-4 mb-12 relative flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold uppercase leading-tight tracking-[0.15em] text-gray-900 drop-shadow-sm">
                {children}
            </h2>
            <span className="block h-1 w-24 bg-gradient-to-r from-transparent via-emerald-600 to-transparent rounded-full mt-6 opacity-80" />
        </div>
    );

    // --- SECTION COMPONENT ---
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
            <section className="py-24 bg-white border-b border-gray-100">
                <Title>{title}</Title>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                    <div
                        className="relative w-full h-[60vh] md:h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl group border border-gray-100"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div
                            key={index}
                            className="absolute inset-0 bg-center bg-cover transition-transform duration-[10s] ease-linear scale-100 group-hover:scale-110 cursor-zoom-in"
                            style={{ backgroundImage: `url(${images[index]})` }}
                            onClick={() => setPopupSrc(images[index])}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                        <button
                            onClick={() => setIndex((p) => (p - 1 + images.length) % images.length)}
                            className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 opacity-0 group-hover:opacity-100 -translate-x-8 group-hover:translate-x-0 z-20 shadow-lg"
                        >
                            <span className="text-2xl pb-1">&larr;</span>
                        </button>
                        <button
                            onClick={() => setIndex((p) => (p + 1) % images.length)}
                            className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 opacity-0 group-hover:opacity-100 translate-x-8 group-hover:translate-x-0 z-20 shadow-lg"
                        >
                            <span className="text-2xl pb-1">&rarr;</span>
                        </button>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === index ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/80"}`}
                                />
                            ))}
                        </div>
                        <div className="absolute top-8 right-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-black/30 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 tracking-widest uppercase">
                                View Fullscreen
                            </span>
                        </div>
                    </div>
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

            {/* --- PROPERTY PLANNING SECTION --- */}
            <section className="relative z-10 py-12 md:py-16 lg:py-24 border-b border-gray-200 bg-gradient-to-b from-white via-gray-50 to-white">
                <div className="flex flex-col md:flex-row justify-between items-center max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 mb-8 md:mb-12 gap-4 md:gap-6">
                    <div className="text-center w-full flex flex-col items-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold uppercase tracking-widest text-gray-900 text-center drop-shadow-sm">
                            Property Planning
                        </h1>
                        <span className="block h-1 w-20 md:w-24 bg-emerald-600 rounded-full mt-4 md:mt-6 mx-auto opacity-80" />
                    </div>
                </div>

                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch relative">

                        {/* Left Card - Sticky */}
                        <div className="lg:w-[280px] xl:w-[320px] sticky top-20 md:top-32 h-fit z-10">
                            <div className="bg-white/80 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 flex flex-col justify-between backdrop-blur-xl transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                                <div>
                                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 md:mb-3 text-gray-900">
                                        Unit {currentHouse?.number || "..."}
                                    </h2>
                                    <p className={`text-xs font-extrabold uppercase tracking-widest mb-8 inline-block px-3 py-1 rounded-full ${currentHouse?.state === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {currentHouse?.state === 'actif' ? "Available Now" : "Sold"}
                                    </p>
                                    <div className="space-y-4 md:space-y-6 text-xs md:text-sm text-gray-600">
                                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 md:pb-3">
                                            <span className="font-medium tracking-wide">Type</span>
                                            <span className="font-serif text-gray-900 uppercase text-base md:text-lg">{currentHouse?.type || "A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 md:pb-3">
                                            <span className="font-medium tracking-wide">Price</span>
                                            <span className="font-serif text-emerald-700 font-bold text-lg md:text-xl">
                                                {currentHouse?.price ? `$${(currentHouse.price / 1000000).toFixed(2)}M` : "Contact"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-10 grid grid-cols-2 gap-2 md:gap-3">
                                    {['PDF Brochure', '3D View', 'Compare', 'Contact Us'].map((btn, i) => (
                                        <button key={btn} className={`
                                            px-2 py-3 md:py-4 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-bold tracking-wider border transition-all duration-300 uppercase shadow-sm
                                            ${i === 3
                                                ? 'col-span-2 bg-emerald-900 text-white border-emerald-900 hover:bg-emerald-800 hover:shadow-lg'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}>
                                            {btn}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center Card - Normal Scroll */}
                        <div
                            className="flex-1 min-h-[400px] md:min-h-[500px] lg:min-h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white/50 bg-white relative group cursor-pointer transition-all hover:shadow-[0_30px_60px_rgb(0,0,0,0.15)] flex flex-col z-10"
                            onClick={() => setPopupSrc(primePlanImages[primePlanIdx])}
                        >
                            <div
                                className="absolute inset-0 bg-center bg-contain bg-no-repeat transition-transform duration-700 group-hover:scale-105 p-6 md:p-8 lg:p-12"
                                style={{ backgroundImage: `url(${primePlanImages[primePlanIdx]})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />
                            <div className="mt-auto relative z-10 p-6 md:p-8 lg:p-10 text-white w-full">
                                <span className="inline-block px-3 md:px-4 py-1 md:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-bold tracking-[0.2em] mb-3 md:mb-4 border border-white/20 uppercase hover:bg-white/30 transition-colors">
                                    Interactive View
                                </span>
                                <p className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium mb-2">Floor Plan Overview</p>
                                <p className="text-white/80 text-xs md:text-sm font-light tracking-wide">Click to expand details</p>
                                <div className="flex items-center gap-2 mt-4">
                                    {primePlanImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setPrimePlanIdx(idx); }}
                                            className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${idx === primePlanIdx ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/80"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Card - Sticky */}
                        <div className="lg:w-[280px] xl:w-[320px] sticky top-20 md:top-32 h-fit z-10">
                            <div className="bg-white/80 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 backdrop-blur-xl flex flex-col justify-center transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                                <h3 className="text-lg md:text-xl font-serif font-bold mb-6 md:mb-8 text-gray-900 border-b border-gray-100 pb-3 md:pb-4">Key Features</h3>
                                <ul className="space-y-4 md:space-y-6">
                                    {[
                                        { icon: "✨", text: "High Ceilings (3.5m)" },
                                        { icon: "💡", text: "Smart Home System" },
                                        { icon: "🪵", text: "Premium Oak Flooring" },
                                        { icon: "🌇", text: "Panoramic City Views" },
                                        { icon: "❄️", text: "Central AC & Heating" },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 md:gap-5 text-xs md:text-sm text-gray-600 group/item cursor-default">
                                            <div className="flex items-center gap-3 md:gap-5">
                                                <span className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-lg md:text-xl shadow-sm border border-gray-100 group-hover/item:scale-110 group-hover/item:bg-emerald-50 transition-all duration-300">
                                                    {item.icon}
                                                </span>
                                                <span className="font-medium group-hover/item:text-gray-900 transition-colors">{item.text}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Section title="Room Tour" images={currentRoomImages} index={roomIndex} setIndex={setRoomIndex} />
            <Section title="Floor Plan" images={currentFloorImages} index={floorIndex} setIndex={setFloorIndex} />
            <Section title="Gallery" images={currentGalleryImages} index={galleryIndex} setIndex={setGalleryIndex} />

            {/* --- CHOOSE YOUR HOUSE --- */}
            <section ref={selectionRef} className="relative z-10 w-full flex flex-col items-center justify-start gap-8 md:gap-12 pt-16 md:pt-20 lg:pt-24 bg-white pb-16 md:pb-24 lg:pb-32">
                <Title>Select Residence</Title>

                <div className="w-full max-w-[1600px] px-4 sm:px-6 md:px-8 z-20">
                    <div className="bg-gray-50/50 p-4 md:p-6 lg:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-inner">
                        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                            {activeHouses.map((house, i) => {
                                const isActive = house.id === currentActiveId;
                                const isSold = house.state !== "actif";

                                return (
                                    <button
                                        key={house.id}
                                        onClick={() => { setCurrentIdx(i); handleHouseClick(house.id); }}
                                        onMouseEnter={() => setCurrentIdx(i)}
                                        className={`
                                            relative px-6 py-4 rounded-2xl font-bold transition-all duration-300 text-sm tracking-wide shadow-sm overflow-hidden group border
                                            ${isSold
                                                ? "bg-white text-gray-300 border-gray-100 cursor-not-allowed"
                                                : isActive
                                                    ? "bg-gray-900 text-white shadow-2xl scale-110 border-gray-900 z-10 ring-4 ring-gray-100"
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 hover:-translate-y-1 hover:shadow-md"
                                            }
                                        `}
                                    >
                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <span className={isSold ? "line-through decoration-red-200 decoration-2" : "text-base"}>
                                                {house.number}
                                            </span>
                                            {isSold && (
                                                <span className="text-[9px] text-red-300 uppercase font-extrabold tracking-widest">Sold</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
        @keyframes subtleZoom { from { transform: scale(1); } to { transform: scale(1.05); } }
      `}</style>
        </div>
    );
}