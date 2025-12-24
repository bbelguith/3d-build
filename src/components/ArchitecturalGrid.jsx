import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ArchitecturalGrid({ className = "" }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.1, 0.3, 0.3, 0.1]);
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <motion.div
            ref={ref}
            className={`absolute inset-0 pointer-events-none ${className}`}
            style={{ opacity, y }}
        >
            {/* Architectural Grid Pattern */}
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(rgba(180, 155, 133, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(180, 155, 133, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                transform: 'perspective(1000px) rotateX(60deg) scale(1.2)',
                transformOrigin: 'center center'
            }} />
            
            {/* Perspective Lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#b49b85" stopOpacity="0" />
                        <stop offset="50%" stopColor="#b49b85" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#b49b85" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
            </svg>
        </motion.div>
    );
}

