import React, { useRef, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useInView } from 'framer-motion';

export default function Architectural3D({ children, className = "" }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                y,
                opacity,
                scale
            }}
        >
            {children}
        </motion.div>
    );
}

// Building shapes component for architectural decoration
export function BuildingShapes() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const rotateY = useTransform(scrollYProgress, [0, 1], [0, 8]);
    const rotateX = useTransform(scrollYProgress, [0, 1], [0, -4]);
    const translateY = useTransform(scrollYProgress, [0, 1], [0, -30]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.15, 0.25, 0.25, 0.15]);
    const gridOpacity = useTransform(scrollYProgress, [0, 1], [0.3, 0.1]);

    return (
        <motion.div 
            ref={containerRef} 
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ opacity }}
        >
            {/* Building Shape 1 - Tall Modern */}
            <motion.div
                className="absolute top-20 right-10 w-32 h-96 bg-gradient-to-b from-[#b49b85]/15 to-[#b49b85]/5 backdrop-blur-sm border border-[#b49b85]/10"
                style={{
                    rotateY,
                    y: translateY,
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                    transform: "translateZ(20px)"
                }}
            />
            
            {/* Building Shape 2 - Medium */}
            <motion.div
                className="absolute bottom-40 left-20 w-24 h-72 bg-gradient-to-t from-[#b49b85]/20 to-[#b49b85]/8 backdrop-blur-sm border border-[#b49b85]/10"
                style={{
                    rotateX,
                    y: translateY,
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                    transform: "translateZ(10px)"
                }}
            />
            
            {/* Building Shape 3 - Small Modern */}
            <motion.div
                className="absolute top-1/2 right-1/4 w-16 h-48 bg-gradient-to-b from-[#b49b85]/12 to-transparent backdrop-blur-sm border-l border-[#b49b85]/10"
                style={{
                    rotateY,
                    y: translateY,
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                    transform: "translateZ(5px)"
                }}
            />
            
            {/* Architectural Grid Lines */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(180, 155, 133, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(180, 155, 133, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                    y: translateY,
                    opacity: gridOpacity
                }}
            />
        </motion.div>
    );
}

