import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios

export default function Plan() {
    const navigate = useNavigate();

    // 1. STATE: Replace JSON imports with useState
    const [houses, setHouses] = useState([]);
    const [houseImages, setHouseImages] = useState([]);
    const [roomImages, setRoomImages] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [floorPlanImages, setFloorPlanImages] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state

    const [hoveredHouseId, setHoveredHouseId] = useState(null);
    const [roomIndex, setRoomIndex] = useState(0);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [floorIndex, setFloorIndex] = useState(0);
    const [popupSrc, setPopupSrc] = useState(null);

    // 2. FETCH DATA: Use useEffect to call your API
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all endpoints in parallel
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
                setLoading(false); // Data is ready
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // 3. LOGIC ADAPTATION
    const activeHouses = useMemo(() => houses.filter((h) => h.type === "a"), [houses]);

    // Initialize currentIdx carefully (wait for data)
    const [currentIdx, setCurrentIdx] = useState(0);

    // Update index when activeHouses changes (after fetch)
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

    const prevHouse = () =>
        setCurrentIdx((i) => (i - 1 + activeHouses.length) % activeHouses.length);
    const nextHouse = () =>
        setCurrentIdx((i) => (i + 1) % activeHouses.length);

    const currentActiveId =
        hoveredHouseId ??
        (activeHouses[currentIdx] ? activeHouses[currentIdx].id : null);

    // 4. FINDING IMAGES: 
    // This logic relies on houseImages having a "houseId" property matching the house ID
    const currentImageObj = houseImages.find((img) => img.houseId === currentActiveId);

    const currentImage = currentImageObj?.src ??
        "https://res.cloudinary.com/dzbmwlwra/image/upload/f_auto,q_auto/v1762360930/49ba186a-621c-4825-859e-ff097bec92c5_rdji7t.jpg";

    // Helper to get array of strings for the sliders based on the data structure
    const currentRoomImages = roomImages.map(img => img.src);
    const currentGalleryImages = galleryImages.map(img => img.src);
    const currentFloorImages = floorPlanImages.map(img => img.src);

    const handleHouseClick = (houseId) => {
        const house = houses.find((h) => h.id === houseId);
        if (house && house.state === "actif") navigate(`/house/${houseId}`);
    };

    // --- RENDER HELPERS ---
    const Title = ({ children }) => (
        <div className="text-center max-w-5xl mx-auto px-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-extrabold uppercase leading-tight tracking-[0.2em]">
                {children}
            </h1>
            <span className="block h-[3px] w-28 bg-black mx-auto rounded-full mt-4" />
        </div>
    );

    const Section = ({ title, images, index, setIndex }) => {
        if (!images || images.length === 0) return null;

        return (
            <section className="relative w-full min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] border-b flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-center bg-no-repeat bg-cover cursor-zoom-in"
                    style={{ backgroundImage: `url(${images[index]})` }}
                    onClick={() => setPopupSrc(images[index])}
                    title="Click to view"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
                <h2 className="absolute top-6 w-full text-center text-3xl sm:text-5xl font-extrabold text-white z-10 tracking-widest drop-shadow">
                    {title}
                </h2>
                <button
                    onClick={() => setIndex((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white text-2xl sm:text-3xl font-bold bg-white/10 hover:bg-white/20 backdrop-blur rounded-full p-2 sm:p-3 ring-1 ring-white/30 z-10"
                >
                    &#8592;
                </button>
                <button
                    onClick={() => setIndex((p) => (p + 1) % images.length)}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white text-2xl sm:text-3xl font-bold bg-white/10 hover:bg-white/20 backdrop-blur rounded-full p-2 sm:p-3 ring-1 ring-white/30 z-10"
                >
                    &#8594;
                </button>
            </section>
        )
    };

    // --- LOADING CHECK ---
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl">Loading Plans...</div>;
    }


    return (
        <div className="min-h-screen text-gray-900 bg-gradient-to-b from-white to-gray-50">
            {/* PROPERTY PLANNING */}
            <section className="py-16 sm:py-24 border-b border-gray-200 bg-gradient-to-b from-white via-gray-50 to-white">
                <Title>
                    PROPERTY
                    <br />
                    PLANNING
                </Title>

                <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">

                        {/* Left Card */}
                        <div className="lg:w-[240px] bg-white/95 border border-gray-100 rounded-3xl shadow-xl p-6 flex flex-col justify-between text-center backdrop-blur-lg transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div>
                                <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-wide">Unit 1R</h2>
                                <div className="text-base space-y-1 text-gray-700">
                                    <p><strong>Area:</strong> 546.27 sqft</p>
                                    <p><strong>Price:</strong> <span className="text-green-700 font-bold">$1,020,400</span></p>
                                    <div className="pt-2 flex flex-col gap-1 text-gray-600">
                                        <span className="inline-flex items-center gap-1"><span className="text-lg">🛏️</span> 1 Bed</span>
                                        <span className="inline-flex items-center gap-1"><span className="text-lg">🛁</span> 1 Bath</span>
                                        <span className="inline-flex items-center gap-1"><span className="text-lg">📐</span> 1BD, Type A, W.B</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <button className="px-3 py-1.5 rounded-full border-2 border-black font-semibold hover:bg-black hover:text-white transition text-sm">PDF</button>
                                <button className="px-3 py-1.5 rounded-full border-2 border-black font-semibold hover:bg-black hover:text-white transition text-sm">COMPARE</button>
                                <button className="px-3 py-1.5 rounded-full border-2 border-black font-semibold hover:bg-black hover:text-white transition text-sm">ON 3D</button>
                                <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition text-sm shadow">CALL BACK</button>
                            </div>
                        </div>

                        {/* Center Floor Plan */}
                        <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white/80 backdrop-blur-lg flex flex-col transform hover:scale-[1.025] transition-transform duration-300">
                            <div
                                className="relative w-full aspect-[4/3] bg-center bg-cover cursor-pointer group"
                                style={{
                                    backgroundImage:
                                        "url(https://res.cloudinary.com/dzbmwlwra/image/upload/v1754778241/floor-plan_jvww4l.png)",
                                }}
                                onClick={() =>
                                    setPopupSrc(
                                        "https://res.cloudinary.com/dzbmwlwra/image/upload/v1754778241/floor-plan_jvww4l.png"
                                    )
                                }
                                title="Click to view"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-4 right-4 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full bg-black/80 text-white shadow-lg tracking-wide">
                                    VIEW FLOOR PLAN
                                </span>
                            </div>
                            <div className="p-6 text-center text-gray-700 space-y-1">
                                <p className="text-2xl font-semibold text-gray-900">Floor Plan Overview</p>
                                <div className="flex justify-center gap-6 mt-2">
                                    <span className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium">
                                        Total area: <strong>546.27 sqft</strong>
                                    </span>
                                    <span className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium">
                                        Living area: <strong>491.13 sqft</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Card */}
                        <div className="lg:w-[240px] bg-white/95 border border-gray-100 rounded-3xl shadow-xl p-6 text-center backdrop-blur-lg flex flex-col justify-between transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div>
                                <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-wide">Interior Highlights</h2>
                                <ul className="space-y-2 text-base text-gray-700 mt-2">
                                    <li className="flex items-center gap-2"><span className="text-lg">✨</span> High ceilings</li>
                                    <li className="flex items-center gap-2"><span className="text-lg">💡</span> Smart lighting</li>
                                    <li className="flex items-center gap-2"><span className="text-lg">🪵</span> Luxury wood flooring</li>
                                    <li className="flex items-center gap-2"><span className="text-lg">🌇</span> Panoramic windows</li>
                                </ul>
                            </div>
                            <div className="mt-4 text-gray-500 text-xs sm:text-sm italic">Designed for modern living</div>
                        </div>

                    </div>
                </div>
            </section>

            <Section title="ROOM TOUR" images={currentRoomImages} index={roomIndex} setIndex={setRoomIndex} />
            <br />
            <Section title="FLOOR PLAN" images={currentFloorImages} index={floorIndex} setIndex={setFloorIndex} />
            <br />
            <Section title="GALLERY" images={currentGalleryImages} index={galleryIndex} setIndex={setGalleryIndex} />
            <br />

            {/* CHOOSE YOUR HOUSE */}
            <section className="relative w-full min-h-[72vh] md:min-h-[80vh] lg:min-h-[88vh] flex flex-col items-center justify-start gap-6 sm:gap-8">
                <Title>CHOOSE YOUR HOUSE</Title>
                <div className="w-full max-w-7xl px-4">
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2 py-2 mb-4">
                        {activeHouses.map((house, i) => {
                            const isActive = house.id === currentActiveId;
                            const isSold = house.state !== "actif";
                            return (
                                <button
                                    key={house.id}
                                    onClick={() => {
                                        setCurrentIdx(i);
                                        handleHouseClick(house.id);
                                    }}
                                    onMouseEnter={() => setHoveredHouseId(house.id)}
                                    onMouseLeave={() => setHoveredHouseId(null)}
                                    disabled={isSold}
                                    className={[
                                        "rounded-full px-5 py-2 font-semibold transition text-sm sm:text-base",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60",
                                        isSold
                                            ? "bg-red-600 text-white border border-red-700 cursor-not-allowed"
                                            : "bg-green-600 text-white border border-green-700 hover:bg-green-700",
                                        isActive ? "scale-105 ring-2 ring-offset-2 ring-black" : "",
                                    ].join(" ")}
                                >
                                    {house.number} {isSold ? "(Sold)" : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative w-full flex-1 rounded-2xl overflow-hidden max-w-7xl shadow-2xl">
                    <div
                        key={currentImage}
                        className="absolute inset-0 bg-center bg-cover will-change-transform animate-[fadeIn_420ms_ease] md:scale-[1.02] cursor-zoom-in"
                        style={{ backgroundImage: `url(${currentImage})` }}
                        onClick={() => setPopupSrc(currentImage)}
                    />
                    {/* Arrows */}
                    <button onClick={prevHouse} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white text-xl sm:text-2xl font-bold bg-black/30 hover:bg-black/50 backdrop-blur rounded-full p-2 sm:p-3 ring-1 ring-white/20">&#8592;</button>
                    <button onClick={nextHouse} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white text-xl sm:text-2xl font-bold bg-black/30 hover:bg-black/50 backdrop-blur rounded-full p-2 sm:p-3 ring-1 ring-white/20">&#8594;</button>
                </div>
            </section>

            {/* Modal & Footer (Unchanged) */}
            {popupSrc && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer p-4" onClick={() => setPopupSrc(null)}>
                    <img src={popupSrc} alt="Popup" className="max-w-[95vw] max-h-[85vh] rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <button onClick={() => setPopupSrc(null)} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white text-3xl sm:text-5xl font-bold select-none">&times;</button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}