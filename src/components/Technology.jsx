import React from "react";
import { Shield, Smartphone, Zap, Wifi, ArrowRight } from "lucide-react";
import ScrollReveal, { StaggerContainer } from "./ScrollReveal";
import { BuildingShapes } from "./Architectural3D";

export default function Technology() {
    const features = [
        {
            id: "01",
            icon: <Shield strokeWidth={1.25} className="w-8 h-8" />,
            title: "Integrated Security",
            desc: "Biometric access control, AI-driven perimeter surveillance, and encrypted localized data storage."
        },
        {
            id: "02",
            icon: <Smartphone strokeWidth={1.25} className="w-8 h-8" />,
            title: "Home Automation",
            desc: "Centralized mobile command for climate zoning, ambient lighting scenes, and blind actuation."
        },
        {
            id: "03",
            icon: <Zap strokeWidth={1.25} className="w-8 h-8" />,
            title: "Sustainable Systems",
            desc: "Solar-ready infrastructure combined with smart grid monitoring to optimize energy consumption."
        },
        {
            id: "04",
            icon: <Wifi strokeWidth={1.25} className="w-8 h-8" />,
            title: "Fiber Infrastructure",
            desc: "Pre-wired FTTH (Fiber to the Home) ensuring gigabit speeds and mesh-network readiness."
        },
    ];

    return (
        <section id="technology" className="relative py-12 md:py-16 lg:py-24 bg-gray-50 overflow-hidden">

            {/* --- Embedded Styles --- */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85;
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-bronze { color: var(--accent-bronze); }
        .bg-bronze { background-color: var(--accent-bronze); }
        .border-bronze { border-color: var(--accent-bronze); }

        /* Subtle Tech Grid Background */
        .tech-grid-bg {
          background-image: 
            linear-gradient(rgba(180, 155, 133, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 155, 133, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

            {/* Architectural 3D Background Elements */}
            <BuildingShapes />

            {/* Background Decor */}
            <div className="absolute inset-0 tech-grid-bg pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-white to-transparent opacity-80 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 relative z-10 font-premium">

                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 lg:mb-20 gap-6 md:gap-8">
                    <ScrollReveal direction="right" delay={0.1}>
                        <div className="space-y-3 md:space-y-4">
                            <span className="text-bronze text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                                03 — Innovation
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight leading-tight">
                                Smart <span className="font-bold">Ecosystem</span>
                            </h2>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="left" delay={0.2}>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block h-px w-16 md:w-24 bg-gray-300"></div>
                            <p className="text-gray-500 text-xs md:text-sm max-w-xs text-right md:text-left">
                                Future-proof infrastructure designed for seamless modern living.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>

                {/* --- Feature Grid --- */}
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" staggerDelay={0.1}>
                    {features.map((item, index) => (
                        <div
                            key={index}
                            className="group relative bg-white border border-gray-100 p-6 md:p-8 rounded-xl md:rounded-2xl transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 hover:border-bronze/30"
                        >
                            {/* ID Number Watermark */}
                            <span className="absolute top-4 right-4 md:top-6 md:right-6 text-xs font-bold text-gray-200 group-hover:text-bronze/20 transition-colors">
                                {item.id}
                            </span>

                            {/* Icon Container - FIXED */}
                            <div className="mb-6 md:mb-8 inline-flex p-3 md:p-4 rounded-lg md:rounded-xl bg-gray-50 group-hover:bg-black transition-colors duration-500">
                                {/* FIX: Changed group-hover:text-bronze to group-hover:text-white 
                    This ensures the icon is clearly visible when the box turns black.
                */}
                                <div className="text-gray-900 group-hover:text-white transition-colors duration-500">
                                    {item.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2 md:space-y-3">
                                <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-wide group-hover:text-bronze transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed group-hover:text-gray-600">
                                    {item.desc}
                                </p>
                            </div>

                            {/* Bottom Line Interaction */}
                            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-bronze transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                        </div>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}