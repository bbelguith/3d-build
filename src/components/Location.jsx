import React from "react";
import { MapPin, Activity, Car, Leaf, Flag, ArrowUpRight } from "lucide-react";
import ScrollReveal, { StaggerContainer } from "./ScrollReveal";
import { BuildingShapes } from "./Architectural3D";

export default function Location() {
    const locationItems = [
        {
            category: "Transport",
            title: "Wintering Road",
            icon: <Activity strokeWidth={1.5} className="w-5 h-5" />,
            distance: "3 min drive",
            details: "Main Access Point"
        },
        {
            category: "Connectivity",
            title: "City Center",
            icon: <Car strokeWidth={1.5} className="w-5 h-5" />,
            distance: "15 min drive",
            details: "Direct Highway Link"
        },
        {
            category: "Lifestyle",
            title: "Sport Drive & Park",
            icon: <Leaf strokeWidth={1.5} className="w-5 h-5" />,
            distance: "5 min walk",
            details: "Green Belt Access"
        },
        {
            category: "Services",
            title: "Medical District",
            icon: <Flag strokeWidth={1.5} className="w-5 h-5" />,
            distance: "2 km radius",
            details: "Hospitals & Clinics"
        },
    ];

    return (
        <section id="location" className="relative py-12 md:py-16 lg:py-24 bg-[#fcfcfc] overflow-hidden">
            {/* Architectural 3D Background Elements */}
            <BuildingShapes />

            {/* --- Embedded Styles (Matches Navbar) --- */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85;
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-bronze { color: var(--accent-bronze); }
        .bg-bronze { background-color: var(--accent-bronze); }
        
        /* Map Filter - Architectural Grayscale */
        .map-grayscale {
          filter: grayscale(100%) contrast(95%);
          transition: filter 0.5s ease-in-out;
        }
        .map-wrapper:hover .map-grayscale {
          filter: grayscale(0%) contrast(100%);
        }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 font-premium">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 lg:mb-16 gap-4 md:gap-6">
                    <ScrollReveal direction="right" delay={0.1}>
                        <div className="space-y-3 md:space-y-4">
                            <span className="text-bronze text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                                02 — Neighborhood
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight leading-tight">
                                Strategic <span className="font-bold">Location</span>
                            </h2>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal direction="left" delay={0.2}>
                        <p className="max-w-md text-gray-500 text-xs md:text-sm leading-relaxed text-justify">
                            Situated at the convergence of nature and urban convenience.
                            Enjoy seamless connectivity while remaining secluded in a private,
                            serene enclave.
                        </p>
                    </ScrollReveal>
                </div>

                {/* --- Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16">

                    {/* Left: Specification List */}
                    <div className="lg:col-span-5 flex flex-col justify-center">
                        <StaggerContainer className="border-t border-gray-200" staggerDelay={0.15}>
                            {locationItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group flex items-start gap-3 md:gap-4 border-b border-gray-200 py-4 md:py-6 transition-all duration-300 hover:pl-2 cursor-default"
                                >
                                    {/* Icon Box */}
                                    <div className="flex-shrink-0 mt-1 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-bronze group-hover:border-bronze/30 transition-colors duration-300">
                                        {item.icon}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-medium group-hover:text-bronze transition-colors">
                                                {item.category}
                                            </span>
                                            <span className="text-xs md:text-sm font-semibold text-gray-900">
                                                {item.distance}
                                            </span>
                                        </div>

                                        <h3 className="text-lg md:text-xl font-medium text-gray-800 group-hover:text-black transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                                            {item.details}
                                        </p>
                                    </div>

                                    {/* Arrow Interaction */}
                                    <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center h-full">
                                        <ArrowUpRight className="w-5 h-5 text-bronze" strokeWidth={1.5} />
                                    </div>
                                </div>
                            ))}
                        </StaggerContainer>

                        <ScrollReveal direction="up" delay={0.3}>
                            <div className="mt-8">
                                <button className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-900 hover:text-bronze transition-colors group">
                                    <MapPin className="w-4 h-4 text-bronze" />
                                    View on Google Maps
                                    <div className="h-px w-8 bg-gray-300 group-hover:w-12 group-hover:bg-bronze transition-all duration-300"></div>
                                </button>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right: The Map Frame */}
                    <ScrollReveal direction="left" delay={0.2} className="lg:col-span-7">
                        <div className="map-wrapper relative w-full h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-white ring-1 ring-gray-200 group">

                            {/* Map Overlay Text (Visible before hover) */}
                            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg border border-white/50 shadow-sm">
                                    <span className="text-xs font-bold tracking-widest text-gray-900 uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Live Satellite View
                                    </span>
                                </div>
                            </div>

                            <iframe
                                title="Google Map"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12776.488349076045!2d10.1815!3d36.8065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd3440dc780287%3A0x6239105470d9a657!2sTunis%2C%20Tunisia!5e0!3m2!1sen!2sus!4v1625680000000!5m2!1sen!2sus"
                                width="100%"
                                height="100%"
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full object-cover map-grayscale"
                            />

                            {/* Decorative Corner Lines */}
                            <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-gray-900/10 rounded-br-xl pointer-events-none"></div>
                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
}