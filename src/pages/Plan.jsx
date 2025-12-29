import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// --- ICONS ---
const PdfIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 mb-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375h-2.625A3.375 3.375 0 004.125 5.625v12.75c0 1.864 1.511 3.375 3.375 3.375h12.75c1.864 0 3.375-1.511 3.375-3.375z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5h.008v.008H9v-.008zm4.5 0h.008v.008h-.008v-.008zm2.25-4.5h.008v.008h-.008v-.008z" />
    </svg>
);
const CompareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 mb-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0l-4.875-4.875m4.875 4.875l4.875-4.875M3 12h18" />
    </svg>
);
const ThreeDIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 mb-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.96 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
    </svg>
);

export default function Plan() {
    const navigate = useNavigate();
    const location = useLocation();
    const selectionRef = useRef(null);

    // 1. STATE
    const [houses, setHouses] = useState([]);
    const [roomImages, setRoomImages] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [floorPlanImages, setFloorPlanImages] = useState([]);
    const [twinPlanIdx, setTwinPlanIdx] = useState(0);
    const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
    const [twinPreloaded, setTwinPreloaded] = useState(false);
    const [loading, setLoading] = useState(true);

    // View States
    const [roomIndex, setRoomIndex] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [floorIndex, setFloorIndex] = useState(0);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [houseTypeFilter, setHouseTypeFilter] = useState("ALL"); // 'ALL', 'VP', 'VT'

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

                // Mock data enrichment for testing filtering if types are simple A/B
                const enhancedHouses = housesRes.data.map((h, i) => ({
                    ...h,
                    type: h.type || (i % 2 === 0 ? "Type A (VP)" : "Type B (VT)"),
                }));

                setHouses(enhancedHouses);
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

    // Scroll & Toast
    useEffect(() => {
        if (location.state?.scrollToSelection && !loading) {
            setTimeout(() => {
                selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            setTimeout(() => {
                toast.info("📅 Please select a house to schedule your appointment!", {
                    position: "bottom-center", autoClose: 5000, theme: "dark", hideProgressBar: true
                });
                window.history.replaceState({}, document.title);
            }, 1000);
        }
    }, [location, loading]);

    // 3. LOGIC

    // --- FILTER LOGIC (VP / VT Check) ---
    const visibleHouses = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return houses.filter(h => {
            // 1. Must be active
            if (h.state !== "actif") return false;

            const typeStr = (h.type || "").toUpperCase();

            // 2. VP / VT Check
            if (houseTypeFilter === "VP") {
                if (!typeStr.includes("VP")) return false;
            }
            if (houseTypeFilter === "VT") {
                if (!typeStr.includes("VT")) return false;
            }

            // 3. Search Number
            return h.number.toString().includes(lowerSearch);
        });
    }, [houses, searchTerm, houseTypeFilter]);

    // Current House Logic
    const activeHousesList = useMemo(() => houses.filter(h => h.state === 'actif'), [houses]);
    const [currentIdx, setCurrentIdx] = useState(0);

    // Ensure we don't crash if filtered list changes
    // Using filtered list for selection index if available, else fallback
    const currentHouse = activeHousesList[currentIdx] || activeHousesList[0];

    const currentRoomImages = roomImages.map((img) => img.src);
    const currentGalleryImages = galleryImages.map((img) => img.src);
    const currentFloorImages = floorPlanImages.map((img) => img.src);

    const twinPlanImages = useMemo(() => ([
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986525/plan_rdc_villa_isolee_pyote8.png",
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986610/plan_terrasse_villa_isolee_riz5mc.png",
        "https://res.cloudinary.com/dueoeevmz/image/upload/v1765986523/WhatsApp_Image_2025-12-17_at_15.49.21_krfpum.jpg"
    ]), []);

    // Labels for the pill buttons
    const twinPlanLabels = ["Ground Floor", "1st Floor", "Under Ground"];

    // Preload
    useEffect(() => {
        let cancelled = false;
        const preload = async () => {
            const loaders = twinPlanImages.map(src => new Promise(res => {
                const img = new Image();
                img.onload = () => res(true);
                img.onerror = () => res(false);
                img.src = src;
            }));
            await Promise.all(loaders);
            if (!cancelled) setTwinPreloaded(true);
        };
        preload();
        return () => { cancelled = true; };
    }, [twinPlanImages]);

    const openLightbox = (images, index = 0) => setLightbox({ open: true, images, index });
    const closeLightbox = () => setLightbox({ open: false, images: [], index: 0 });

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) closeLightbox();
    };

    const handleHouseClick = (houseId) => {
        navigate(`/house/${houseId}`);
    };

    // --- COMPONENTS ---

    const Title = ({ children }) => (
        <div className="flex items-center justify-center gap-6 mb-16 px-4">
            <div className="h-[1px] bg-gray-300 w-16 md:w-32 lg:w-48 opacity-50" />
            <h2 className="text-3xl md:text-5xl font-sans font-light uppercase tracking-[0.2em] text-gray-800">
                {children}
            </h2>
            <div className="h-[1px] bg-gray-300 w-16 md:w-32 lg:w-48 opacity-50" />
        </div>
    );

    const CarouselSection = ({ title, images, index, setIndex }) => (
        <section className="py-24 bg-white border-b border-gray-100">
            <Title>{title}</Title>
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8">
                <div className="relative w-full h-[70vh] rounded-[3rem] overflow-hidden group shadow-xl">
                    <img src={images[index]} className="w-full h-full object-cover cursor-zoom-in" onClick={() => openLightbox(images, index)} />

                    <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button onClick={() => setIndex((p) => (p - 1 + images.length) % images.length)}
                            className="pointer-events-auto w-16 h-16 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/20">
                            <span className="text-3xl pb-2">←</span>
                        </button>
                        <button onClick={() => setIndex((p) => (p + 1) % images.length)}
                            className="pointer-events-auto w-16 h-16 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/20">
                            <span className="text-3xl pb-2">→</span>
                        </button>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10">
                        {images.map((_, idx) => (
                            <button key={idx} onClick={() => setIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === index ? "w-10 bg-white shadow-[0_0_10px_white]" : "w-1.5 bg-white/30 hover:bg-white/60"}`} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );

    if (loading) return <div className="h-screen flex items-center justify-center font-sans font-light text-2xl tracking-[0.3em] text-gray-400 uppercase">Loading Plan...</div>;

    return (
        <div className="bg-[#fcfcfc] min-h-screen text-gray-900 font-sans">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* --- PROPERTY PLANNING SECTION (Refined for PlanB Content) --- */}
            <section className="pt-20 pb-24 border-b border-gray-100 relative z-10">

                {/* Header Style Match */}
                <div className="flex items-center justify-center gap-4 mb-20 px-6">
                    <div className="h-[1px] bg-gray-300 flex-1 max-w-[350px] opacity-60" />
                    <h1 className="text-4xl lg:text-6xl font-sans font-extralight uppercase tracking-[0.15em] text-gray-800">
                        Property Planning
                    </h1>
                    <div className="h-[1px] bg-gray-300 flex-1 max-w-[350px] opacity-60" />
                </div>

                <div className="max-w-[1800px] mx-auto px-6 lg:px-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                        {/* LEFT COLUMN: Metadata */}
                        <div className="lg:col-span-3 flex flex-col gap-10">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span className="bg-gray-100 px-3 py-1.5 rounded">House: 1</span>
                                    <span className="bg-gray-100 px-3 py-1.5 rounded">Floor: 22</span>
                                    <span className="bg-gray-100 px-3 py-1.5 rounded">Number: {currentHouse?.number}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Type: {currentHouse?.type || "Standard"}
                                    </span>
                                    <span className="bg-[#8CBF8C] text-white px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Available</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-7xl font-light tracking-tighter text-gray-900 flex items-center gap-4">
                                    1R <span className="text-gray-300 font-thin text-5xl">/</span> 546.27<span className="text-3xl text-gray-500">sqft</span>
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">$ per sqft 1,868</p>
                            </div>

                            <div className="text-6xl font-sans font-normal text-gray-900 tracking-tight">
                                $ 1 020 400
                            </div>

                            <div className="flex justify-between items-center max-w-xs mt-4">
                                <button className="flex flex-col items-center gap-2 group text-gray-400 hover:text-black transition-colors">
                                    <PdfIcon /> <span className="text-[9px] font-bold uppercase tracking-widest">PDF</span>
                                </button>
                                <div className="w-[1px] h-8 bg-gray-200" />
                                <button className="flex flex-col items-center gap-2 group text-gray-400 hover:text-black transition-colors">
                                    <CompareIcon /> <span className="text-[9px] font-bold uppercase tracking-widest">Compare</span>
                                </button>
                                <div className="w-[1px] h-8 bg-gray-200" />
                                <button className="flex flex-col items-center gap-2 group text-gray-400 hover:text-black transition-colors">
                                    <ThreeDIcon /> <span className="text-[9px] font-bold uppercase tracking-widest">On 3D</span>
                                </button>
                            </div>

                            <button className="w-full bg-[#151515] text-white py-5 rounded-full text-xs font-bold uppercase tracking-[0.25em] hover:bg-gray-800 transition-all flex items-center justify-center gap-3 mt-6 shadow-xl">
                                <PhoneIcon /> Call Back
                            </button>
                        </div>

                        {/* CENTER COLUMN: The Twin Plan Image & Buttons */}
                        <div className="lg:col-span-6 flex flex-col items-center justify-center">
                            {/* NEW CARD WRAPPER */}
                            <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-gray-100 w-full flex flex-col items-center relative z-20">
                                <div
                                    className="relative w-full flex justify-center cursor-zoom-in group"
                                    onClick={() => openLightbox(twinPlanImages, twinPlanIdx)}
                                >
                                    <img
                                        src={twinPlanImages[twinPlanIdx]}
                                        // Kept rotate-90, removed hover scale for cleaner card look
                                        className={`h-[400px] w-auto object-contain transition-transform duration-700 rotate-90 drop-shadow-sm ${!twinPreloaded ? 'opacity-0' : 'opacity-100'}`}
                                        alt="Floor Plan"
                                    />
                                </div>

                                {/* High visibility buttons - Adjusted container style to fit inside card */}
                                <div className="mt-8 flex gap-4 bg-gray-50 p-2 rounded-full border border-gray-100">
                                    {twinPlanImages.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setTwinPlanIdx(i)}
                                            className={`
                                            px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300
                                            ${twinPlanIdx === i
                                                    ? 'bg-[#151515] text-white shadow-lg transform scale-105'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black hover:shadow-sm'
                                                }
                                        `}
                                        >
                                            {twinPlanLabels[i] || `Level ${i + 1}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details */}
                        <div className="lg:col-span-3 flex flex-col items-end text-right pl-0 lg:pl-12 gap-16 h-full justify-start mt-10 lg:mt-0">
                            <div className="w-full">
                                <h3 className="text-2xl font-sans font-light uppercase tracking-widest mb-8 text-gray-800">1st Floor</h3>
                                <div className="space-y-4 w-full">
                                    <div className="flex justify-between items-center w-full group">
                                        <span className="text-gray-400 text-xs uppercase tracking-wider">Total area:</span>
                                        <span className="font-mono text-sm text-gray-600 border-b border-gray-100 pb-1 w-32 text-right">546.27 sqft</span>
                                    </div>
                                    <div className="flex justify-between items-center w-full group">
                                        <span className="text-gray-400 text-xs uppercase tracking-wider">Living area:</span>
                                        <span className="font-mono text-sm text-gray-600 border-b border-gray-100 pb-1 w-32 text-right">491.51 sqft</span>
                                    </div>
                                </div>
                            </div>

                            <button className="px-10 border border-[#151515] text-[#151515] py-4 rounded-full text-[10px] uppercase font-bold tracking-[0.25em] hover:bg-[#151515] hover:text-white transition-all flex items-center gap-3">
                                <PhoneIcon /> Call Back
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CAROUSELS --- */}
            <CarouselSection title="Interior Concept" images={currentRoomImages} index={roomIndex} setIndex={setRoomIndex} />
            <CarouselSection title="Floor Plan" images={currentFloorImages} index={floorIndex} setIndex={setFloorIndex} />
            <CarouselSection title="Architecture Gallery" images={currentGalleryImages} index={galleryIndex} setIndex={setGalleryIndex} />

            {/* --- SELECT RESIDENCE (Darker Text & Filtered) --- */}
            <section ref={selectionRef} className="py-32 bg-gray-50 border-t border-gray-200">
                <div className="max-w-[1600px] mx-auto px-6">
                    <Title>Select Residence</Title>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-16">
                        <div className="relative w-full max-w-sm group">
                            <input
                                type="text"
                                placeholder="Search House Number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-none rounded-full py-5 pl-8 pr-12 shadow-sm focus:ring-1 focus:ring-black outline-none font-bold text-center text-lg transition-all text-black"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black">🔍</div>
                        </div>

                        <div className="bg-white p-1.5 rounded-full shadow-sm flex gap-1">
                            {['ALL', 'VP', 'VT'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setHouseTypeFilter(type)}
                                    className={`px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${houseTypeFilter === type ? 'bg-[#151515] text-white shadow-lg' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 min-h-[400px]">
                        <div className="flex justify-between items-center mb-8 px-4 border-b border-gray-100 pb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Residences</span>
                            <span className="text-xs font-bold text-black uppercase tracking-widest">{visibleHouses.length} Found</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {visibleHouses.length > 0 ? (
                                visibleHouses.map((house) => (
                                    <button
                                        key={house.id}
                                        onClick={() => handleHouseClick(house.id)}
                                        onMouseEnter={() => setCurrentIdx(houses.indexOf(house))}
                                        className={`
                                            h-24 rounded-2xl font-bold transition-all border flex flex-col items-center justify-center gap-1 group
                                            ${house.id === currentHouse?.id
                                                ? "bg-[#151515] text-white border-[#151515] shadow-2xl scale-105 z-10"
                                                : "bg-white text-black border-gray-200 hover:border-[#151515] hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        {/* TEXT MADE DARKER AND BOLDER */}
                                        <span className={`text-2xl font-bold ${house.id === currentHouse?.id ? "text-white" : "text-black"}`}>
                                            {house.number}
                                        </span>
                                        <span className={`text-[9px] uppercase font-extrabold tracking-widest ${house.id === currentHouse?.id ? "text-white/60" : "text-gray-900"}`}>
                                            {(house.type || "").includes("A") ? "VP" : "VT"}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-24 text-center text-gray-300 flex flex-col items-center justify-center">
                                    <span className="text-5xl mb-4 opacity-30">∅</span>
                                    <span className="uppercase font-bold text-xs tracking-[0.2em]">No residences found</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>


            {/* LIGHTBOX */}
            {lightbox.open && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/98 flex items-center justify-center p-8 backdrop-blur-xl cursor-pointer"
                    onClick={handleBackdropClick}
                >
                    <button onClick={closeLightbox} className="absolute top-8 right-8 text-white/50 hover:text-white text-5xl transition-colors leading-none z-50">&times;</button>

                    <button className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white text-6xl transition-colors z-50 p-4"
                        onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length })) }}>‹</button>

                    <img
                        src={lightbox.images[lightbox.index]}
                        // UPDATED: Added rotate-90 here for the modal view
                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl cursor-default rotate-90"
                        alt="Zoom"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white text-6xl transition-colors z-50 p-4"
                        onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length })) }}>›</button>

                    <div className="absolute bottom-8 text-white/50 font-mono text-xs tracking-widest pointer-events-none">
                        {lightbox.index + 1} / {lightbox.images.length}
                    </div>
                </div>
            )}
        </div>
    );
}