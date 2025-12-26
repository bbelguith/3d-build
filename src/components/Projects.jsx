import React from "react";
import { ArrowUpRight, Building2 } from "lucide-react";
import ScrollReveal, { StaggerContainer } from "./ScrollReveal";
import { BuildingShapes } from "./Architectural3D";

export default function Projects() {
    const projects = [
        {
            name: "Villa Les Jasmins",
            location: "Carthage, Tunis",
            year: "2021",
            status: "Delivered",
        },
        {
            name: "The Gammarth Heights",
            location: "Gammarth Supérieur",
            year: "2022",
            status: "Delivered",
        },
        {
            name: "Azure Waterfront",
            location: "La Marsa, Corniche",
            year: "2023",
            status: "Sold Out",
        },
        {
            name: "Residence Élysée",
            location: "Les Berges du Lac II",
            year: "2024",
            status: "Under Construction",
        },
    ];

    return (
        <section id="projects" className="relative py-12 md:py-16 lg:py-24 bg-[#f9f9f9] overflow-hidden">
            {/* Architectural 3D Background Elements */}
            <BuildingShapes />

            {/* --- Embedded Styles --- */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85;
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-bronze { color: var(--accent-bronze); }
        .bg-bronze { background-color: var(--accent-bronze); }
        
        .project-row:hover .project-title {
          color: var(--accent-bronze);
          transform: translateX(10px);
        }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 font-premium">

                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 lg:mb-20 gap-6 md:gap-8">
                    <ScrollReveal direction="right" delay={0.1}>
                        <div className="space-y-3 md:space-y-4">
                            <span className="text-bronze text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                                05 — Portfolio
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight leading-tight">
                                Previous <span className="font-bold">Developments</span>
                            </h2>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="left" delay={0.2}>
                        <div className="hidden md:block">
                            <p className="text-gray-500 text-xs md:text-sm max-w-xs text-right">
                                A track record of excellence across Tunisia's most prestigious districts.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>

                {/* --- Project Index Table --- */}
                <div className="w-full">

                    {/* Table Header (Visible on Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-300 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <div className="col-span-6">Project Name</div>
                        <div className="col-span-3">Location</div>
                        <div className="col-span-3 text-right">Completion</div>
                    </div>

                    {/* Table Rows */}
                    <StaggerContainer className="border-t border-gray-200" staggerDelay={0.1}>
                        {projects.map((project, idx) => (
                            <div
                                key={idx}
                                className="project-row group relative grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 py-6 md:py-8 lg:py-10 border-b border-gray-200 cursor-pointer items-center transition-all duration-300"
                            >
                                {/* Column 1: Name */}
                                <div className="col-span-12 md:col-span-6 flex items-baseline gap-3 md:gap-4">
                                    <span className="hidden md:block text-xs font-bold text-gray-300 group-hover:text-bronze/50 transition-colors">
                                        0{idx + 1}
                                    </span>
                                    <h3 className="project-title text-xl md:text-2xl lg:text-3xl font-light text-gray-900 transition-all duration-500 ease-out">
                                        {project.name}
                                    </h3>
                                </div>

                                {/* Column 2: Location */}
                                <div className="col-span-12 md:col-span-3 mt-2 md:mt-0">
                                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-800 transition-colors">
                                        <span className="md:hidden text-[9px] md:text-[10px] uppercase font-bold text-gray-300 tracking-wider">Loc:</span>
                                        <span className="text-xs md:text-sm lg:text-base">{project.location}</span>
                                    </div>
                                </div>

                                {/* Column 3: Year/Status */}
                                <div className="col-span-12 md:col-span-3 mt-1 md:mt-0 flex items-center justify-between md:justify-end gap-4 md:gap-6">
                                    <div className="flex flex-col md:items-end">
                                        <span className="text-xs md:text-sm font-medium text-gray-900">{project.year}</span>
                                        <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 group-hover:text-bronze transition-colors">
                                            {project.status}
                                        </span>
                                    </div>

                                    {/* Arrow Interaction */}
                                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                        <ArrowUpRight className="w-5 h-5 text-bronze" strokeWidth={1.5} />
                                    </div>
                                </div>

                            </div>
                        ))}
                    </StaggerContainer>

                    {/* --- Bottom CTA --- */}
                    <ScrollReveal direction="up" delay={0.3}>
                        <div className="mt-12 flex justify-center">
                            <button className="group flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-bronze transition-all duration-300">
                                <Building2 className="w-4 h-4 text-gray-400 group-hover:text-bronze transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">View Full Archive</span>
                            </button>
                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
}