import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxImage({ src, className, children, onClick }) {
    const ref = useRef(null);


    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });


    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

    return (
        <div
            ref={ref}
            className={`relative overflow-hidden ${className}`}
            onClick={onClick}
        >
            <motion.div
                style={{ y, backgroundImage: `url(${src})` }}
                className="absolute inset-0 w-full h-[120%] -top-[10%] bg-cover bg-center will-change-transform"
            />
            {/* Content stays static on top */}
            <div className="relative z-10 h-full w-full">{children}</div>
        </div>
    );
}